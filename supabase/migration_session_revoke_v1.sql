-- Migration: Add session_id to user_devices + create revoke_session function
-- Version: v1
-- Description: Enables real session revocation via Edge Function (Part 11-12)

-- ─── 1. Add session_id column to user_devices ───
ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS session_id UUID;

-- ─── 2. Create revoke_session function ───
-- Deletes a session from auth.sessions by its ID.
-- Uses SECURITY DEFINER so service_role (via Edge Function) can remove sessions.
CREATE OR REPLACE FUNCTION revoke_session(target_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.sessions WHERE id = target_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', target_session_id;
  END IF;
END;
$$;

-- ─── 3. Restrict execution to service_role only ───
REVOKE EXECUTE ON FUNCTION revoke_session FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION revoke_session TO service_role;

-- ─── 4. Create index for faster lookups (optional but recommended) ───
CREATE INDEX IF NOT EXISTS idx_user_devices_session_id ON user_devices (session_id);
