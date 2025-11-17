-- Migration: Allow match creation when challenge is accepted
-- Date: 2025-01-16
-- Description: Add RLS policy to allow users to create matches when accepting challenges

-- Add policy to allow match creation for challenge participants
CREATE POLICY "Challenge participants can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must have a valid challenge_id
    challenge_id IS NOT NULL
    AND EXISTS (
      -- Challenge must exist and be accepted
      SELECT 1 FROM challenges
      WHERE challenges.id = matches.challenge_id
      AND challenges.status = 'accepted'
      -- User must be one of the participants
      AND auth.uid() IN (challenges.challenger_id, challenges.challenged_id)
    )
  );

COMMENT ON POLICY "Challenge participants can create matches" ON matches IS
  'Allows authenticated users to create a match when they are part of an accepted challenge. This enables the acceptChallenge server action to create match fixtures.';
