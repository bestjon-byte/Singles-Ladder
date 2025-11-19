# Tennis Singles Ladder - Database Schema Documentation

## Overview

The Tennis Singles Ladder uses **PostgreSQL** (via Supabase) with **Row Level Security (RLS)** enabled on all tables. The database supports a comprehensive tennis ladder competition system with challenges, matches, statistics tracking, and administrative functions.

## Database Technology

- **Database Engine**: PostgreSQL 15+ (Supabase)
- **ORM**: None - Direct SQL queries via Supabase JavaScript client
- **Security**: Row Level Security (RLS) policies on all tables
- **Authentication**: Supabase Auth (integrated with auth.users)

---

## Tables

### 1. users
Extends Supabase auth.users with application-specific profile data.

```sql
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
```

**Purpose**: Stores user profile information and notification preferences.

**Key Fields**:
- `id`: References Supabase auth.users.id (UUID)
- `email`: User's email address (synced with auth.users)
- `name`: Display name
- `whatsapp_number`: Optional WhatsApp contact
- `is_active`: Soft delete flag
- `*_notifications_enabled`: User preferences for notification channels

**Relationships**:
- Referenced by: ladder_positions, challenges, matches, notifications, player_stats
- References: auth.users (Supabase Auth)

**Indexes**: None (small table, primary key sufficient)

---

### 2. admins
Tracks which users have administrative privileges.

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Role-based access control for admin users.

**Key Fields**:
- `user_id`: Can be NULL if admin is not a player
- `email`: Admin's email (used for authorization checks)

**Relationships**:
- References: users(id) [nullable]

**RLS Usage**: Used in `is_admin()` function for policy checks

**Indexes**: Unique index on email

---

### 3. seasons
Defines competitive seasons.

```sql
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
```

**Purpose**: Manages season lifecycle and configuration.

**Key Fields**:
- `status`: ENUM ('active', 'playoffs', 'completed')
- `is_active`: Quick filter for current season
- `wildcards_per_player`: Default 2 wildcards per player
- `playoff_third_place_enabled`: Include 3rd place match in playoffs

**Business Rules**:
- Only one season should have `is_active = TRUE` at a time
- `end_date` is NULL for active seasons, set when season ends

**Indexes**: None (small table, typically 1-10 rows)

---

### 4. ladder_positions
Tracks player positions within a season's ladder.

```sql
CREATE TABLE ladder_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Core ladder ranking system.

**Key Fields**:
- `position`: 1 = top player, higher numbers = lower rank
- `is_active`: FALSE when player withdraws (soft delete)

**Constraints**:
```sql
-- Ensures no duplicate positions in active ladder
CREATE UNIQUE INDEX unique_active_position
  ON ladder_positions(season_id, position)
  WHERE is_active = TRUE;

-- Ensures each user only appears once per season
CREATE UNIQUE INDEX unique_active_user
  ON ladder_positions(season_id, user_id)
  WHERE is_active = TRUE;
```

**Indexes**:
- `idx_ladder_positions_season` ON (season_id)
- `idx_ladder_positions_user` ON (user_id)
- `idx_ladder_positions_active` ON (season_id, position) WHERE is_active = TRUE

**Business Logic**:
- Position updates handled by `update_ladder_after_match()` function
- Adding players uses `add_player_to_ladder()` function
- Removing players uses `remove_player_from_ladder()` function

---

### 5. challenges
Records challenge requests between players.

```sql
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
```

**Purpose**: Manages challenge lifecycle from creation to completion.

**Key Fields**:
- `status`: ENUM ('pending', 'accepted', 'withdrawn', 'forfeited', 'completed', 'cancelled')
- `is_wildcard`: TRUE if wildcard was used (allows challenging >2 positions above)
- `proposed_date/location`: Initial proposal from challenger
- `accepted_date/location`: Final agreed details (may differ from proposed)

**Status Flow**:
1. `pending` → Created, awaiting response
2. `accepted` → Challenged player accepted, match scheduled
3. `withdrawn` → Challenger withdrew before completion
4. `forfeited` → Auto-forfeited after 14 days (future feature)
5. `completed` → Match played and scored
6. `cancelled` → Admin cancelled

**Business Rules**:
- Players can only challenge those above them (lower position number)
- Normal challenge: Max 2 positions above
- Wildcard challenge: Any position above
- Only one active challenge per player at a time

**Indexes**:
- `idx_challenges_season` ON (season_id)
- `idx_challenges_challenger` ON (challenger_id)
- `idx_challenges_challenged` ON (challenged_id)
- `idx_challenges_status` ON (status)

---

### 6. challenge_negotiations
Stores negotiation history (table exists but **NOT USED** in current implementation).

```sql
CREATE TABLE challenge_negotiations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  proposed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_date TIMESTAMPTZ,
  proposed_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status**: **DEPRECATED** - Table exists in schema but negotiation feature was removed.

**Historical Context**: Originally planned for back-and-forth date/time negotiation, simplified to accept/reject only.

---

### 7. matches
Records match results and scores.

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID UNIQUE REFERENCES challenges(id) ON DELETE SET NULL,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_type match_type DEFAULT 'challenge',
  match_date TIMESTAMPTZ,
  location TEXT,

  -- Scoring (Best of 3 sets)
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
```

**Purpose**: Stores match results with detailed scoring.

**Key Fields**:
- `match_type`: ENUM ('challenge', 'semifinal', 'final', 'third_place')
- `final_set_type`: ENUM ('tiebreak', 'full_set') - For 3rd set format
- `winner_id`: Calculated from set scores
- `is_disputed`: TRUE when either player disputes the score

**Scoring Format**:
- Best of 3 sets
- Sets 1 & 2 always required
- Set 3 optional (if match went to 3 sets)
- `final_set_type` indicates if set 3 was:
  - `tiebreak`: Match tiebreak (first to 10, win by 2)
  - `full_set`: Regular set (first to 6, tiebreak at 6-6)

**Dispute Flow**:
1. Score submitted → `submitted_by_user_id` set
2. Other player disputes → `is_disputed = TRUE`, `disputed_by_user_id` set
3. Admin resolves → `dispute_resolved_by_admin_id` set, may update score
4. If winner changes → ladder positions recalculated

**Indexes**:
- `idx_matches_season` ON (season_id)
- `idx_matches_player1` ON (player1_id)
- `idx_matches_player2` ON (player2_id)
- Unique constraint on `challenge_id` (one match per challenge)

---

### 8. wildcard_usage
Tracks wildcard consumption.

```sql
CREATE TABLE wildcard_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_wildcard_usage UNIQUE (season_id, user_id, challenge_id)
);
```

**Purpose**: Tracks when wildcards are consumed.

**Business Logic**:
- Wildcard is **reserved** when challenge is created (`is_wildcard = TRUE`)
- Wildcard is **consumed** (inserted here) when match is completed
- If challenge is withdrawn/rejected, wildcard is NOT consumed (no row inserted)

**Query Pattern**:
```sql
-- Get available wildcards
SELECT (s.wildcards_per_player - COUNT(w.id)) AS available
FROM seasons s
LEFT JOIN wildcard_usage w ON w.season_id = s.id AND w.user_id = $user_id
WHERE s.id = $season_id;
```

---

### 9. ladder_history
Audit trail of all ladder position changes.

```sql
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
```

**Purpose**: Immutable log of position changes for analytics and rollback.

**Key Fields**:
- `change_reason`: ENUM ('match_result', 'player_joined', 'player_withdrew', 'admin_adjustment')
- `previous_position`: NULL when player joins
- `new_position`: NULL when player withdraws

**Use Cases**:
- Position progression graphs
- Rollback on dispute resolution
- Audit trail for admin actions

---

### 10. notifications
In-app and email notification log.

```sql
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
```

**Purpose**: Stores all notifications for in-app display and tracks email delivery.

**Key Fields**:
- `type`: ENUM notification types (see below)
- `is_read`: FALSE until user marks as read
- `email_sent`: TRUE if email was sent via Resend
- `related_*_id`: Links to relevant challenge/match

**Notification Types**:
- `challenge_received`: You've been challenged
- `challenge_accepted`: Your challenge was accepted
- `challenge_counter_proposal`: *(Not implemented)* Date/time counter-proposal
- `match_reminder`: *(Not implemented)* Upcoming match reminder
- `forfeit_warning`: *(Not implemented)* 10-day forfeit warning
- `score_submitted`: Match score entered
- `score_disputed`: Score has been disputed
- `season_ended`: Season has concluded

**Indexes**:
- `idx_notifications_user` ON (user_id)
- `idx_notifications_unread` ON (user_id, is_read) WHERE is_read = FALSE

---

### 11. player_stats
Aggregate statistics per player per season (and lifetime).

```sql
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
```

**Purpose**: Tracks comprehensive player performance metrics.

**Key Fields**:
- `season_id`: NULL for lifetime stats, UUID for season-specific
- `current_*_streak`: Running streak count
- `longest_*_streak`: All-time best streak
- `challenges_initiated`: Challenges created by this player
- `challenges_won`: Won as challenger (moved up ladder)
- `challenges_defended`: Won when challenged (defended position)

**Update Mechanism**:
- Updated by `update_player_stats_after_match()` function
- Uses `INSERT ... ON CONFLICT DO UPDATE` for upsert pattern

**Indexes**:
- `idx_player_stats_user` ON (user_id)
- `idx_player_stats_season` ON (season_id)

---

### 12. head_to_head_stats
Match records between specific player pairs.

```sql
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
```

**Purpose**: Tracks performance against specific opponents.

**Key Fields**:
- `season_id`: NULL for lifetime, UUID for season-specific
- `wins`/`losses`: From `user_id`'s perspective

**Symmetry**: Each match creates/updates TWO rows:
- Row 1: user_id=A, opponent_id=B, wins=1 (A won)
- Row 2: user_id=B, opponent_id=A, losses=1 (B lost)

**Use Cases**:
- "Who is your nemesis?" (most losses against)
- "Who is your favorite opponent?" (most wins against)
- Head-to-head matchup history

---

## Database Functions

### 1. update_ladder_after_match()
**Purpose**: Atomically updates ladder positions after a match result.

```sql
CREATE OR REPLACE FUNCTION update_ladder_after_match(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_match_id UUID
)
RETURNS void
```

**Logic**:
1. Get current positions of both players
2. Check if winner was challenger (lower position = higher number)
3. If challenger won:
   - Record ladder_history for both players
   - Shift everyone between the two positions down by 1
   - Move winner to loser's position
4. If challenged player won:
   - No position changes (status quo maintained)

**Atomicity**: Entire operation in single transaction.

---

### 2. add_player_to_ladder()
**Purpose**: Inserts player at specific position, shifts others down.

```sql
CREATE OR REPLACE FUNCTION add_player_to_ladder(
  p_season_id UUID,
  p_user_id UUID,
  p_position INTEGER
)
RETURNS void
```

**Logic**:
1. Shift all positions >= p_position down by 1
2. Insert new player at p_position
3. Record ladder_history entry

**Example**: Add Alice at position 3
- Before: [1: Bob, 2: Carol, 3: David, 4: Eve]
- After: [1: Bob, 2: Carol, 3: Alice, 4: David, 5: Eve]

---

### 3. remove_player_from_ladder()
**Purpose**: Soft-deletes player, shifts others up.

```sql
CREATE OR REPLACE FUNCTION remove_player_from_ladder(
  p_season_id UUID,
  p_user_id UUID
)
RETURNS void
```

**Logic**:
1. Get player's current position
2. Mark player as `is_active = FALSE`
3. Shift all positions below up by 1
4. Record ladder_history entry

---

### 4. get_available_wildcards()
**Purpose**: Calculates remaining wildcards for a user.

```sql
CREATE OR REPLACE FUNCTION get_available_wildcards(
  p_season_id UUID,
  p_user_id UUID
)
RETURNS INTEGER
```

**Logic**:
1. Get `wildcards_per_player` from season
2. Count consumed wildcards in `wildcard_usage`
3. Return difference

---

### 5. can_challenge()
**Purpose**: Validates if a challenge is allowed.

```sql
CREATE OR REPLACE FUNCTION can_challenge(
  p_season_id UUID,
  p_challenger_id UUID,
  p_challenged_id UUID,
  p_is_wildcard BOOLEAN
)
RETURNS BOOLEAN
```

**Validation Checks**:
1. Neither player has active challenge (pending/accepted)
2. Challenged player is above challenger (lower position number)
3. If wildcard: User has wildcards available
4. If not wildcard: Position difference ≤ 2

---

### 6. update_player_stats_after_match()
**Purpose**: Updates player_stats and head_to_head_stats after match.

```sql
CREATE OR REPLACE FUNCTION update_player_stats_after_match(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_was_challenge BOOLEAN,
  p_was_wildcard BOOLEAN,
  p_challenger_id UUID
)
RETURNS void
```

**Updates**:
- Winner: matches_won, current_win_streak, longest_win_streak
- Loser: matches_lost, current_loss_streak, longest_loss_streak
- Both: matches_played
- Challenge-specific: challenges_initiated, challenges_won, challenges_defended
- Wildcard: wildcards_used
- Also updates lifetime stats (season_id = NULL)

---

### 7. is_admin()
**Purpose**: Checks if user is an admin (used in RLS policies).

```sql
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
```

**Usage**: Called in RLS policies to grant admin access.

---

### 8. handle_new_user()
**Purpose**: Trigger function to auto-create user profile on signup.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
```

**Trigger**: Runs on `auth.users` INSERT to create corresponding `users` row.

---

## Row Level Security (RLS) Policies

### Summary Table

| Table | Authenticated Users | Admins | Notes |
|-------|---------------------|--------|-------|
| **users** | SELECT (all active) | Full access | Users can UPDATE own profile |
| **admins** | No access | Full access | Admin-only table |
| **seasons** | SELECT (all) | Full access | Read-only for players |
| **ladder_positions** | SELECT (all) | Full access | Read-only for players |
| **challenges** | SELECT (all), INSERT (own), UPDATE (participants) | Full access | Create challenges, update if involved |
| **challenge_negotiations** | SELECT (all), INSERT (participants) | Full access | Not used in app |
| **matches** | SELECT (all), UPDATE (participants) | Full access | Submit scores if playing |
| **wildcard_usage** | SELECT (all), INSERT (system) | Full access | System-managed |
| **ladder_history** | SELECT (all), INSERT (system) | Full access | Audit log, read-only for players |
| **notifications** | SELECT/UPDATE/DELETE (own) | SELECT (all) | Users see only their notifications |
| **player_stats** | SELECT (all), UPDATE (system) | Full access | Stats visible to all |
| **head_to_head_stats** | SELECT (all), UPDATE (system) | Full access | Stats visible to all |

### Key Policy Patterns

**Admin Check**:
```sql
USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())))
```

**Own Records**:
```sql
USING (auth.uid() = user_id)
```

**Match Participants**:
```sql
USING (auth.uid() IN (player1_id, player2_id))
```

---

## Data Types (ENUMs)

```sql
CREATE TYPE challenge_status AS ENUM (
  'pending',      -- Challenge created, awaiting response
  'accepted',     -- Challenged player accepted
  'withdrawn',    -- Challenger withdrew
  'forfeited',    -- Auto-forfeited (14 days)
  'completed',    -- Match played and scored
  'cancelled'     -- Admin cancelled
);

CREATE TYPE season_status AS ENUM (
  'active',       -- Regular season in progress
  'playoffs',     -- Playoff matches
  'completed'     -- Season archived
);

CREATE TYPE match_type AS ENUM (
  'challenge',    -- Regular challenge match
  'semifinal',    -- Playoff semi-final
  'final',        -- Championship final
  'third_place'   -- 3rd place playoff
);

CREATE TYPE final_set_type AS ENUM (
  'tiebreak',     -- Match tiebreak (first to 10)
  'full_set'      -- Regular set (first to 6)
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
  'match_result',      -- Position changed due to match outcome
  'player_joined',     -- New player added
  'player_withdrew',   -- Player removed
  'admin_adjustment'   -- Manual admin change
);
```

---

## Common Query Patterns

### Get Active Season Ladder
```sql
SELECT
  lp.position,
  u.name,
  u.email,
  (SELECT COUNT(*) FROM challenges c
   WHERE c.season_id = lp.season_id
   AND c.status IN ('pending', 'accepted')
   AND (c.challenger_id = u.id OR c.challenged_id = u.id)
  ) > 0 AS is_locked
FROM ladder_positions lp
JOIN users u ON u.id = lp.user_id
WHERE lp.season_id = $season_id
  AND lp.is_active = TRUE
ORDER BY lp.position ASC;
```

### Get Player's Active Challenges
```sql
SELECT c.*,
  challenger.name AS challenger_name,
  challenged.name AS challenged_name
FROM challenges c
JOIN users challenger ON challenger.id = c.challenger_id
JOIN users challenged ON challenged.id = c.challenged_id
WHERE c.season_id = $season_id
  AND c.status IN ('pending', 'accepted')
  AND (c.challenger_id = $user_id OR c.challenged_id = $user_id);
```

### Get Unread Notifications
```sql
SELECT * FROM notifications
WHERE user_id = $user_id
  AND is_read = FALSE
ORDER BY created_at DESC;
```

### Check if Player Can Challenge
```sql
SELECT can_challenge(
  $season_id,
  $challenger_id,
  $challenged_id,
  $is_wildcard
);
```

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20250116_001_initial_schema.sql` | 2025-01-16 | Initial tables, indexes, enums |
| `20250116_002_rls_policies.sql` | 2025-01-16 | RLS policies for all tables |
| `20250116_003_functions.sql` | 2025-01-16 | Database functions and triggers |
| `20250116_004_fix_users_insert_policy.sql` | 2025-01-16 | Fix user creation RLS |
| `20250116_005_auto_create_user_profile.sql` | 2025-01-16 | Trigger to auto-create user profiles |
| `20250116_006_fix_admin_rls.sql` | 2025-01-16 | Fix admin table policies |
| `20250116_007_fix_is_admin_function.sql` | 2025-01-16 | Update admin check function |
| `20250116_008_allow_match_creation.sql` | 2025-01-16 | Fix match creation policies |
| `20250117_001_notifications_rls.sql` | 2025-01-17 | Notification table RLS |
| `20250117_002_admin_delete_policy.sql` | 2025-01-17 | Admin delete permissions |
| `20250117_003_fix_seasons_insert_policy.sql` | 2025-01-17 | Fix season creation |
| `20250118_001_enable_email_notifications.sql` | 2025-01-18 | Email notification support |

---

## Performance Considerations

### Indexes
All foreign keys are indexed for efficient joins. Additional indexes:
- `ladder_positions`: Partial indexes on active positions for fast ladder queries
- `notifications`: Partial index on unread notifications
- `challenges`: Index on status for filtering active challenges

### Query Optimization
- Use partial indexes (`WHERE is_active = TRUE`) to reduce index size
- Composite indexes on frequently joined columns (season_id + position)
- Avoid SELECT * - query only needed columns

### Scaling Considerations
- Current schema optimized for 20-100 players per season
- For 100+ players, consider:
  - Materialized views for leaderboards
  - Caching layer (Redis) for ladder queries
  - Partitioning `ladder_history` by season

---

## Backup and Recovery

### Supabase Automatic Backups
- Daily backups (7-day retention on free tier)
- Point-in-time recovery available on paid tiers

### Manual Backup
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Using pg_dump (if direct access)
pg_dump -h db.cgvertskdkebxukrehyn.supabase.co -U postgres > backup.sql
```

### Disaster Recovery
1. Restore from Supabase dashboard backup
2. Re-run migrations if needed
3. Verify data integrity (check ladder position uniqueness)

---

## Development Best Practices

### Making Schema Changes
1. Create new migration file: `supabase/migrations/YYYYMMDD_###_description.sql`
2. Test locally first
3. Apply via Supabase SQL Editor
4. Document in this file

### Testing Database Functions
```sql
-- Test ladder update
SELECT update_ladder_after_match(
  'season-uuid',
  'winner-uuid',
  'loser-uuid',
  'match-uuid'
);

-- Verify positions changed
SELECT * FROM ladder_positions WHERE season_id = 'season-uuid' ORDER BY position;
```

### RLS Policy Testing
```sql
-- Set test user context
SET request.jwt.claim.sub = 'user-uuid';

-- Try query as that user
SELECT * FROM notifications;
```

---

## Appendix: Complete Schema Diagram

```
auth.users (Supabase)
    ↓
users ←──────────┬─────────────┬──────────────┬────────────┐
    ↓            │             │              │            │
admins      ladder_positions  challenges  notifications  player_stats
                ↓                  ↓
            seasons            matches
                                   ↓
                            wildcard_usage
                            ladder_history
                            head_to_head_stats
```

**Legend**:
- `→` One-to-many relationship
- `←` Foreign key reference
