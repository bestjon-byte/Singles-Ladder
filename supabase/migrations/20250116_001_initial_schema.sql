-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE challenge_status AS ENUM (
  'pending',
  'accepted',
  'withdrawn',
  'forfeited',
  'completed',
  'cancelled'
);

CREATE TYPE season_status AS ENUM (
  'active',
  'playoffs',
  'completed'
);

CREATE TYPE match_type AS ENUM (
  'challenge',
  'semifinal',
  'final',
  'third_place'
);

CREATE TYPE final_set_type AS ENUM (
  'tiebreak',
  'full_set'
);

CREATE TYPE notification_type AS ENUM (
  'challenge_received',
  'challenge_accepted',
  'challenge_counter_proposal',
  'match_reminder',
  'forfeit_warning',
  'score_submitted',
  'score_disputed',
  'season_ended'
);

CREATE TYPE ladder_change_reason AS ENUM (
  'match_result',
  'player_joined',
  'player_withdrew',
  'admin_adjustment'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons table
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  wildcards_per_player INTEGER DEFAULT 2,
  playoff_third_place_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status season_status DEFAULT 'active'
);

-- Ladder positions table
CREATE TABLE ladder_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_position UNIQUE (season_id, position) WHERE is_active = TRUE,
  CONSTRAINT unique_active_user UNIQUE (season_id, user_id) WHERE is_active = TRUE
);

-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_wildcard BOOLEAN DEFAULT FALSE,
  status challenge_status DEFAULT 'pending',
  proposed_date TIMESTAMPTZ,
  proposed_location TEXT,
  accepted_date TIMESTAMPTZ,
  accepted_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  forfeited_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CHECK (challenger_id != challenged_id)
);

-- Challenge negotiations table
CREATE TABLE challenge_negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  proposed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_date TIMESTAMPTZ,
  proposed_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID UNIQUE REFERENCES challenges(id) ON DELETE SET NULL,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type match_type DEFAULT 'challenge',
  match_date TIMESTAMPTZ,
  location TEXT,

  -- Scoring
  set1_player1_score INTEGER,
  set1_player2_score INTEGER,
  set2_player1_score INTEGER,
  set2_player2_score INTEGER,
  set3_player1_score INTEGER,
  set3_player2_score INTEGER,
  final_set_type final_set_type,

  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_disputed BOOLEAN DEFAULT FALSE,
  disputed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dispute_resolved_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK (player1_id != player2_id)
);

-- Wildcard usage table
CREATE TABLE wildcard_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_wildcard_usage UNIQUE (season_id, user_id, challenge_id)
);

-- Ladder history table
CREATE TABLE ladder_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_position INTEGER,
  new_position INTEGER,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  change_reason ladder_change_reason NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  related_challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL
);

-- Player stats table
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,

  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  current_loss_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,

  challenges_initiated INTEGER DEFAULT 0,
  challenges_won INTEGER DEFAULT 0,
  challenges_defended INTEGER DEFAULT 0,
  wildcards_used INTEGER DEFAULT 0,

  highest_position INTEGER,
  lowest_position INTEGER,
  biggest_position_gain INTEGER DEFAULT 0,
  final_position INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_season_stats UNIQUE (user_id, season_id)
);

-- Head to head stats table
CREATE TABLE head_to_head_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_head_to_head UNIQUE (user_id, opponent_id, season_id),
  CHECK (user_id != opponent_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_ladder_positions_season ON ladder_positions(season_id);
CREATE INDEX idx_ladder_positions_user ON ladder_positions(user_id);
CREATE INDEX idx_ladder_positions_active ON ladder_positions(season_id, position) WHERE is_active = TRUE;

CREATE INDEX idx_challenges_season ON challenges(season_id);
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);

CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX idx_player_stats_user ON player_stats(user_id);
CREATE INDEX idx_player_stats_season ON player_stats(season_id);

CREATE INDEX idx_head_to_head_user ON head_to_head_stats(user_id);
CREATE INDEX idx_head_to_head_opponent ON head_to_head_stats(opponent_id);
