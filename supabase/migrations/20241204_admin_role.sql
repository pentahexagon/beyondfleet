-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Set coinkim00@gmail.com as admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'coinkim00@gmail.com';

-- If the user doesn't exist in profiles yet, we'll need to handle it on first login
-- This is handled by the auth trigger that creates profiles

-- Create a function to check admin role
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for admin access to profiles (admins can view all)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Add RLS policy for admin to update profiles (for changing roles, membership tiers)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
