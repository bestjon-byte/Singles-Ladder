-- Add playoff system support
-- This migration adds tables and columns to support knockout bracket playoffs

-- 1. Add 'quarterfinal' to match_type enum
ALTER TYPE match_type ADD VALUE IF NOT EXISTS 'quarterfinal';

-- 2. Add playoff columns to seasons table
ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS playoff_format VARCHAR(20) CHECK (playoff_format IN ('final', 'semis', 'quarters')),
ADD COLUMN IF NOT EXISTS playoff_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS playoff_winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS playoff_completed_at TIMESTAMPTZ;

-- 3. Add bracket positioning columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS round_number INTEGER,
ADD COLUMN IF NOT EXISTS bracket_position INTEGER,
ADD COLUMN IF NOT EXISTS player1_seed INTEGER,
ADD COLUMN IF NOT EXISTS player2_seed INTEGER;

-- 4. Create playoff_brackets table to store bracket structure
CREATE TABLE IF NOT EXISTS playoff_brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL CHECK (format IN ('final', 'semis', 'quarters')),
  bracket_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_season_bracket UNIQUE (season_id)
);

-- 5. Add playoff notification types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type'
                 AND e.enumlabel = 'playoff_started') THEN
    ALTER TYPE notification_type ADD VALUE 'playoff_started';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type'
                 AND e.enumlabel = 'playoff_match_ready') THEN
    ALTER TYPE notification_type ADD VALUE 'playoff_match_ready';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type'
                 AND e.enumlabel = 'playoff_advanced') THEN
    ALTER TYPE notification_type ADD VALUE 'playoff_advanced';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type'
                 AND e.enumlabel = 'playoff_eliminated') THEN
    ALTER TYPE notification_type ADD VALUE 'playoff_eliminated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type t
                 JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type'
                 AND e.enumlabel = 'playoff_champion') THEN
    ALTER TYPE notification_type ADD VALUE 'playoff_champion';
  END IF;
END $$;

-- 6. Create indexes for playoff queries
CREATE INDEX IF NOT EXISTS idx_matches_playoff ON matches(season_id, match_type, round_number) WHERE match_type IN ('quarterfinal', 'semifinal', 'final');
CREATE INDEX IF NOT EXISTS idx_playoff_brackets_season ON playoff_brackets(season_id);
CREATE INDEX IF NOT EXISTS idx_seasons_playoff_winner ON seasons(playoff_winner_id) WHERE playoff_winner_id IS NOT NULL;

-- 7. Add comment documentation
COMMENT ON TABLE playoff_brackets IS 'Stores the structure and state of playoff knockout brackets';
COMMENT ON COLUMN seasons.playoff_format IS 'The playoff format: final (2), semis (4), or quarters (8)';
COMMENT ON COLUMN seasons.playoff_winner_id IS 'The champion of this season playoffs';
COMMENT ON COLUMN matches.round_number IS 'Round in playoffs: 1=quarters, 2=semis, 3=final';
COMMENT ON COLUMN matches.bracket_position IS 'Visual position in bracket for ordering';
COMMENT ON COLUMN matches.player1_seed IS 'Seed number from ladder ranking';
COMMENT ON COLUMN matches.player2_seed IS 'Seed number from ladder ranking';
