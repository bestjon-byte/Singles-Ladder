-- Fix is_admin function to accept user_id instead of email
-- This avoids the RLS policy needing to query auth.users directly

-- Step 1: Drop all policies that depend on the old is_admin(TEXT) function
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can manage ladder positions" ON ladder_positions;
DROP POLICY IF EXISTS "Admins can manage all challenges" ON challenges;
DROP POLICY IF EXISTS "Admins can manage all matches" ON matches;
DROP POLICY IF EXISTS "Admins can view all challenges" ON challenges;
DROP POLICY IF EXISTS "Admins can view all matches" ON matches;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS is_admin(TEXT);

-- Step 3: Create new function with UUID parameter
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate all policies with the new function signature

-- Admins table policies
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Seasons table policies
CREATE POLICY "Admins can manage seasons"
  ON seasons FOR ALL
  USING (is_admin(auth.uid()));

-- Users table policies
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (is_admin(auth.uid()));

-- Ladder positions policies
CREATE POLICY "Admins can manage ladder positions"
  ON ladder_positions FOR ALL
  USING (is_admin(auth.uid()));

-- Challenges policies
CREATE POLICY "Admins can manage all challenges"
  ON challenges FOR ALL
  USING (is_admin(auth.uid()));

-- Matches policies
CREATE POLICY "Admins can manage all matches"
  ON matches FOR ALL
  USING (is_admin(auth.uid()));
