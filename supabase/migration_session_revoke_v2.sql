-- Migration: Fix revoke_session to not throw on session not found
-- Version: v2
-- Description: "Session not found" = session already invalid, not an error

CREATE OR REPLACE FUNCTION revoke_session(target_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.sessions WHERE id = target_session_id;
  -- NOT FOUND is NOT an error — session may have already expired or been revoked
  -- Just return successfully; the caller will clean up the device record either way.
END;
$$;

REVOKE EXECUTE ON FUNCTION revoke_session FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION revoke_session TO service_role;
