-- Migration: Fix admin role assignment
-- ============================================================================
-- ROOT CAUSE: handle_new_user() trigger assigned role='admin' to EVERY new
-- user on signup. Combined with admin-only RLS policies, any Google account
-- could see/edit/delete ALL data (admin count became 2).
--
-- FIX:
--   1. Default role for profiles: 'viewer' (was 'admin')
--   2. Trigger: only owner email(s) get 'admin', everyone else 'viewer'
--   3. Downgrade existing non-owner 'admin' profiles to 'viewer'
--
-- Run this in Supabase SQL Editor. (Note: Gmail ignores dots, so the owner
-- email is matched in both 'phongprot.vn@gmail.com' and 'phongprotvn@gmail.com'
-- forms so the owner is never accidentally downgraded.)

-- 1. Default role: 'viewer'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'viewer';

-- 2. Rewrite trigger — admin only for owner email(s)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    CASE
      WHEN LOWER(NEW.email) IN ('phongprot.vn@gmail.com', 'phongprotvn@gmail.com') THEN 'admin'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Downgrade existing non-owner admins (fixes nghiemhaphong@gmail.com etc.)
UPDATE public.profiles
SET role = 'viewer'
WHERE LOWER(COALESCE(email, '')) NOT IN ('phongprot.vn@gmail.com', 'phongprotvn@gmail.com')
  AND role = 'admin';
