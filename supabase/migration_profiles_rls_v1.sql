-- Migration: Add INSERT and UPDATE RLS policies for profiles table
-- Without these, Settings name save is silently blocked by RLS
-- The SELECT policy ('Public can view profiles') already exists

-- Users can insert their own profile row (if missing from signup trigger failure)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile row
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete own profile (future: account deletion)
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Ensure at least one row exists for the admin user (if trigger missed it)
INSERT INTO profiles (id, email, name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1), 'Prot'), 'admin'
FROM auth.users
WHERE email = 'phongprot.vn@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.users.id);
