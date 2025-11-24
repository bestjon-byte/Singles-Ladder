-- Allow NULL player IDs for playoff matches
-- This is necessary because playoff matches are created incrementally as earlier rounds complete
-- For example, the Final match is created when the first Semi-Final completes (with only player1),
-- then updated when the second Semi-Final completes (adding player2)

ALTER TABLE matches
ALTER COLUMN player1_id DROP NOT NULL;

ALTER TABLE matches
ALTER COLUMN player2_id DROP NOT NULL;

-- Add a check constraint to ensure challenge matches always have both players
-- (only playoff matches can have NULL players)
ALTER TABLE matches
ADD CONSTRAINT matches_challenge_requires_both_players
CHECK (
  match_type != 'challenge' OR (player1_id IS NOT NULL AND player2_id IS NOT NULL)
);

-- Add a comment explaining the nullable player IDs
COMMENT ON COLUMN matches.player1_id IS 'Player 1 ID. Can be NULL for playoff matches that are not yet fully determined.';
COMMENT ON COLUMN matches.player2_id IS 'Player 2 ID. Can be NULL for playoff matches that are not yet fully determined.';
