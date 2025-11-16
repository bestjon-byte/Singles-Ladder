-- Function to update ladder positions after a match result
CREATE OR REPLACE FUNCTION update_ladder_after_match(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_match_id UUID
)
RETURNS void AS $$
DECLARE
  v_winner_position INTEGER;
  v_loser_position INTEGER;
  v_was_challenger BOOLEAN;
BEGIN
  -- Get current positions
  SELECT position INTO v_winner_position
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_winner_id AND is_active = TRUE;

  SELECT position INTO v_loser_position
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_loser_id AND is_active = TRUE;

  -- Check if winner was the challenger (lower position = higher number)
  v_was_challenger := v_winner_position > v_loser_position;

  -- Only update if challenger won
  IF v_was_challenger THEN
    -- Record history for winner
    INSERT INTO ladder_history (season_id, user_id, previous_position, new_position, match_id, change_reason)
    VALUES (p_season_id, p_winner_id, v_winner_position, v_loser_position, p_match_id, 'match_result');

    -- Record history for loser
    INSERT INTO ladder_history (season_id, user_id, previous_position, new_position, match_id, change_reason)
    VALUES (p_season_id, p_loser_id, v_loser_position, v_loser_position + 1, p_match_id, 'match_result');

    -- Shift everyone between the two positions down
    UPDATE ladder_positions
    SET position = position + 1,
        updated_at = NOW()
    WHERE season_id = p_season_id
      AND position >= v_loser_position
      AND position < v_winner_position
      AND is_active = TRUE;

    -- Move winner to loser's position
    UPDATE ladder_positions
    SET position = v_loser_position,
        updated_at = NOW()
    WHERE season_id = p_season_id
      AND user_id = p_winner_id
      AND is_active = TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add player to ladder
CREATE OR REPLACE FUNCTION add_player_to_ladder(
  p_season_id UUID,
  p_user_id UUID,
  p_position INTEGER
)
RETURNS void AS $$
BEGIN
  -- Shift all positions at or below the new position down by 1
  UPDATE ladder_positions
  SET position = position + 1,
      updated_at = NOW()
  WHERE season_id = p_season_id
    AND position >= p_position
    AND is_active = TRUE;

  -- Insert new player
  INSERT INTO ladder_positions (season_id, user_id, position)
  VALUES (p_season_id, p_user_id, p_position);

  -- Record history
  INSERT INTO ladder_history (season_id, user_id, previous_position, new_position, change_reason)
  VALUES (p_season_id, p_user_id, NULL, p_position, 'player_joined');
END;
$$ LANGUAGE plpgsql;

-- Function to remove player from ladder
CREATE OR REPLACE FUNCTION remove_player_from_ladder(
  p_season_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_current_position INTEGER;
BEGIN
  -- Get current position
  SELECT position INTO v_current_position
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_user_id AND is_active = TRUE;

  -- Mark as inactive
  UPDATE ladder_positions
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE season_id = p_season_id AND user_id = p_user_id;

  -- Shift all positions below up by 1
  UPDATE ladder_positions
  SET position = position - 1,
      updated_at = NOW()
  WHERE season_id = p_season_id
    AND position > v_current_position
    AND is_active = TRUE;

  -- Record history
  INSERT INTO ladder_history (season_id, user_id, previous_position, new_position, change_reason)
  VALUES (p_season_id, p_user_id, v_current_position, NULL, 'player_withdrew');
END;
$$ LANGUAGE plpgsql;

-- Function to get available wildcards for a user in a season
CREATE OR REPLACE FUNCTION get_available_wildcards(
  p_season_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_total_wildcards INTEGER;
  v_used_wildcards INTEGER;
BEGIN
  -- Get total wildcards for season
  SELECT wildcards_per_player INTO v_total_wildcards
  FROM seasons
  WHERE id = p_season_id;

  -- Count used wildcards
  SELECT COUNT(*) INTO v_used_wildcards
  FROM wildcard_usage
  WHERE season_id = p_season_id AND user_id = p_user_id;

  RETURN v_total_wildcards - v_used_wildcards;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user can challenge another user
CREATE OR REPLACE FUNCTION can_challenge(
  p_season_id UUID,
  p_challenger_id UUID,
  p_challenged_id UUID,
  p_is_wildcard BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_challenger_position INTEGER;
  v_challenged_position INTEGER;
  v_position_diff INTEGER;
  v_has_active_challenge BOOLEAN;
  v_available_wildcards INTEGER;
BEGIN
  -- Check if either player has an active challenge
  SELECT EXISTS (
    SELECT 1 FROM challenges
    WHERE season_id = p_season_id
      AND status IN ('pending', 'accepted')
      AND (challenger_id = p_challenger_id OR challenged_id = p_challenger_id
           OR challenger_id = p_challenged_id OR challenged_id = p_challenged_id)
  ) INTO v_has_active_challenge;

  IF v_has_active_challenge THEN
    RETURN FALSE;
  END IF;

  -- Get positions
  SELECT position INTO v_challenger_position
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_challenger_id AND is_active = TRUE;

  SELECT position INTO v_challenged_position
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_challenged_id AND is_active = TRUE;

  -- Check if challenged player is above challenger
  IF v_challenged_position >= v_challenger_position THEN
    RETURN FALSE;
  END IF;

  -- If wildcard, check availability
  IF p_is_wildcard THEN
    SELECT get_available_wildcards(p_season_id, p_challenger_id) INTO v_available_wildcards;
    RETURN v_available_wildcards > 0;
  END IF;

  -- Check position difference (max 2 positions above)
  v_position_diff := v_challenger_position - v_challenged_position;
  RETURN v_position_diff <= 2;
END;
$$ LANGUAGE plpgsql;

-- Function to update player stats after a match
CREATE OR REPLACE FUNCTION update_player_stats_after_match(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_was_challenge BOOLEAN,
  p_was_wildcard BOOLEAN,
  p_challenger_id UUID
)
RETURNS void AS $$
BEGIN
  -- Update winner stats
  INSERT INTO player_stats (user_id, season_id, matches_played, matches_won, current_win_streak, longest_win_streak)
  VALUES (p_winner_id, p_season_id, 1, 1, 1, 1)
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_won = player_stats.matches_won + 1,
    current_win_streak = player_stats.current_win_streak + 1,
    longest_win_streak = GREATEST(player_stats.longest_win_streak, player_stats.current_win_streak + 1),
    current_loss_streak = 0,
    challenges_initiated = CASE WHEN p_was_challenge AND p_challenger_id = p_winner_id THEN player_stats.challenges_initiated + 1 ELSE player_stats.challenges_initiated END,
    challenges_won = CASE WHEN p_was_challenge AND p_challenger_id = p_winner_id THEN player_stats.challenges_won + 1 ELSE player_stats.challenges_won END,
    challenges_defended = CASE WHEN p_was_challenge AND p_challenger_id != p_winner_id THEN player_stats.challenges_defended + 1 ELSE player_stats.challenges_defended END,
    wildcards_used = CASE WHEN p_was_wildcard AND p_challenger_id = p_winner_id THEN player_stats.wildcards_used + 1 ELSE player_stats.wildcards_used END,
    updated_at = NOW();

  -- Update loser stats
  INSERT INTO player_stats (user_id, season_id, matches_played, matches_lost, current_loss_streak, longest_loss_streak)
  VALUES (p_loser_id, p_season_id, 1, 1, 1, 1)
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_lost = player_stats.matches_lost + 1,
    current_loss_streak = player_stats.current_loss_streak + 1,
    longest_loss_streak = GREATEST(player_stats.longest_loss_streak, player_stats.current_loss_streak + 1),
    current_win_streak = 0,
    challenges_initiated = CASE WHEN p_was_challenge AND p_challenger_id = p_loser_id THEN player_stats.challenges_initiated + 1 ELSE player_stats.challenges_initiated END,
    wildcards_used = CASE WHEN p_was_wildcard AND p_challenger_id = p_loser_id THEN player_stats.wildcards_used + 1 ELSE player_stats.wildcards_used END,
    updated_at = NOW();

  -- Update lifetime stats (season_id = NULL)
  INSERT INTO player_stats (user_id, season_id, matches_played, matches_won, current_win_streak, longest_win_streak)
  VALUES (p_winner_id, NULL, 1, 1, 1, 1)
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_won = player_stats.matches_won + 1,
    current_win_streak = player_stats.current_win_streak + 1,
    longest_win_streak = GREATEST(player_stats.longest_win_streak, player_stats.current_win_streak + 1),
    current_loss_streak = 0,
    updated_at = NOW();

  INSERT INTO player_stats (user_id, season_id, matches_played, matches_lost, current_loss_streak, longest_loss_streak)
  VALUES (p_loser_id, NULL, 1, 1, 1, 1)
  ON CONFLICT (user_id, season_id) DO UPDATE SET
    matches_played = player_stats.matches_played + 1,
    matches_lost = player_stats.matches_lost + 1,
    current_loss_streak = player_stats.current_loss_streak + 1,
    longest_loss_streak = GREATEST(player_stats.longest_loss_streak, player_stats.current_loss_streak + 1),
    current_win_streak = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ladder_positions_updated_at BEFORE UPDATE ON ladder_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_head_to_head_stats_updated_at BEFORE UPDATE ON head_to_head_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
