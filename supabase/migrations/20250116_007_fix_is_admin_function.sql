-- Fix is_admin function to accept user_id instead of email
-- This avoids the RLS policy needing to query auth.users directly

DROP FUNCTION IF EXISTS is_admin(TEXT);

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all RLS policies to use the new function signature

-- Admins table policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert admins" ON admins;
CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Seasons table policies
DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;
CREATE POLICY "Admins can manage seasons"
  ON seasons FOR ALL
  USING (is_admin(auth.uid()));

-- Users table policies
DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (is_admin(auth.uid()));

-- Ladder positions policies
DROP POLICY IF EXISTS "Admins can manage ladder positions" ON ladder_positions;
CREATE POLICY "Admins can manage ladder positions"
  ON ladder_positions FOR ALL
  USING (is_admin(auth.uid()));

-- Challenges policies
DROP POLICY IF EXISTS "Admins can view all challenges" ON challenges;
CREATE POLICY "Admins can view all challenges"
  ON challenges FOR SELECT
  USING (is_admin(auth.uid()));

-- Matches policies
DROP POLICY IF EXISTS "Admins can view all matches" ON matches;
CREATE POLICY "Admins can view all matches"
  ON matches FOR SELECT
  USING (is_admin(auth.uid()));
