-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wildcard_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ladder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head_stats ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view all active users"
  ON users FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Admins table policies
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Admins can insert admins"
  ON admins FOR INSERT
  WITH CHECK (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Seasons table policies
CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage seasons"
  ON seasons FOR ALL
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Ladder positions policies
CREATE POLICY "Anyone can view active ladder positions"
  ON ladder_positions FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage ladder positions"
  ON ladder_positions FOR ALL
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Challenges policies
CREATE POLICY "Anyone can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Challenge participants can update"
  ON challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (challenger_id, challenged_id));

CREATE POLICY "Admins can manage all challenges"
  ON challenges FOR ALL
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Challenge negotiations policies
CREATE POLICY "Anyone can view negotiations"
  ON challenge_negotiations FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Challenge participants can add negotiations"
  ON challenge_negotiations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT challenger_id FROM challenges WHERE id = challenge_id
      UNION
      SELECT challenged_id FROM challenges WHERE id = challenge_id
    )
  );

-- Matches policies
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Match participants can submit scores"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (player1_id, player2_id));

CREATE POLICY "Admins can manage all matches"
  ON matches FOR ALL
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Wildcard usage policies
CREATE POLICY "Anyone can view wildcard usage"
  ON wildcard_usage FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "System can insert wildcard usage"
  ON wildcard_usage FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Ladder history policies
CREATE POLICY "Anyone can view ladder history"
  ON ladder_history FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "System can insert ladder history"
  ON ladder_history FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Player stats policies
CREATE POLICY "Anyone can view player stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "System can manage stats"
  ON player_stats FOR ALL
  TO authenticated
  USING (TRUE);

-- Head to head stats policies
CREATE POLICY "Anyone can view head to head stats"
  ON head_to_head_stats FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "System can manage head to head stats"
  ON head_to_head_stats FOR ALL
  TO authenticated
  USING (TRUE);
