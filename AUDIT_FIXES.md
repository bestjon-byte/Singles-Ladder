# Singles Ladder - Audit Fixes & Code Recommendations

## Quick Fix Templates

### Fix #1: Ladder Transaction Wrapper
**Location:** `lib/actions/matches.ts` + `lib/actions/disputes.ts`

**Current Code (BROKEN):**
```typescript
// Multiple separate operations = race condition
await supabase.from('ladder_positions').update({position: -1}).eq('id', winnerId)
// ... other updates
await supabase.from('ladder_positions').update({position: newPosition}).eq('id', winnerId)
```

**Fixed Code:**
```typescript
import { createClient } from '@supabase/supabase-js'

async function updateLadderPositions(seasonId: string, winnerId: string, loserId: string) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Use explicit transaction
  const rpcResult = await supabase.rpc('update_ladder_positions', {
    p_season_id: seasonId,
    p_winner_id: winnerId,
    p_loser_id: loserId
  })

  if (rpcResult.error) {
    throw rpcResult.error
  }

  return rpcResult.data
}
```

**SQL Function (add to migrations):**
```sql
CREATE OR REPLACE FUNCTION update_ladder_positions(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
) RETURNS void AS $$
DECLARE
  v_winner_pos INTEGER;
  v_loser_pos INTEGER;
BEGIN
  -- Lock rows to prevent concurrent updates
  SELECT position INTO v_winner_pos
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_winner_id
  FOR UPDATE;

  SELECT position INTO v_loser_pos
  FROM ladder_positions
  WHERE season_id = p_season_id AND user_id = p_loser_id
  FOR UPDATE;

  IF v_winner_pos > v_loser_pos THEN
    -- Atomic update all positions
    WITH update_cte AS (
      UPDATE ladder_positions
      SET position = CASE
        WHEN user_id = p_winner_id THEN v_loser_pos
        WHEN position > v_loser_pos AND position < v_winner_pos THEN position + 1
        ELSE position
      END
      WHERE season_id = p_season_id
      RETURNING *
    )
    INSERT INTO ladder_history (season_id, user_id, previous_position, new_position, change_reason)
    SELECT p_season_id, p_winner_id, v_winner_pos, v_loser_pos, 'match_result'
    WHERE v_winner_pos != v_loser_pos;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

### Fix #2: Add Race Condition Prevention Constraint
**Location:** Database migrations

```sql
-- Add unique constraint to prevent multiple active challenges per player
ALTER TABLE challenges
ADD CONSTRAINT unique_active_challenge_per_player
  UNIQUE (season_id, challenged_id)
  WHERE status IN ('pending', 'accepted');

-- Update application logic to handle constraint violation
```

**Application Code:**
```typescript
// challenges.ts - Replace lines 88-112
try {
  const { data: challenge, error: createError } = await supabase
    .from('challenges')
    .insert({
      season_id: activeSeason.id,
      challenger_id: user.id,
      challenged_id: params.challengedId,
      is_wildcard: params.isWildcard,
      status: 'pending',
      proposed_date: params.proposedDate,
      proposed_location: params.proposedLocation,
    })
    .select()
    .single()

  if (createError) {
    if (createError.code === 'unique_violation') {
      return { error: 'The challenged player already has an active challenge' }
    }
    console.error('Error creating challenge:', createError)
    return { error: 'Failed to create challenge' }
  }
  // ...
} catch (error) {
  // ...
}
```

---

### Fix #3: Match Score Validation
**Location:** `lib/actions/matches.ts` - Add new validation function

```typescript
interface ValidateScoreResult {
  valid: boolean
  error?: string
}

function validateMatchScore(params: SubmitScoreParams): ValidateScoreResult {
  const { set1Player1, set1Player2, set2Player1, set2Player2, set3Player1, set3Player2 } = params

  // Check all scores are valid numbers
  const scores = [set1Player1, set1Player2, set2Player1, set2Player2]
  for (const score of scores) {
    if (isNaN(score) || !Number.isInteger(score)) {
      return { valid: false, error: 'Scores must be whole numbers' }
    }
    if (score < 0 || score > 7) {
      return { valid: false, error: 'Game scores must be between 0 and 7' }
    }
  }

  // Check set 1
  if (set1Player1 < 6 && set1Player2 < 6) {
    return { valid: false, error: 'At least one player must score 6+ games per set' }
  }
  if (set1Player1 >= 6 && set1Player2 >= 6) {
    const diff = Math.abs(set1Player1 - set1Player2)
    if (diff !== 1) {
      return { valid: false, error: 'Tiebreak must be won by exactly 1 game' }
    }
  } else {
    const diff = Math.abs(set1Player1 - set1Player2)
    if (diff < 2) {
      return { valid: false, error: 'Regular set must be won by 2+ games' }
    }
  }

  // Check set 2
  if (set2Player1 < 6 && set2Player2 < 6) {
    return { valid: false, error: 'Set 2: At least one player must score 6+ games' }
  }
  if (set2Player1 >= 6 && set2Player2 >= 6) {
    const diff = Math.abs(set2Player1 - set2Player2)
    if (diff !== 1) {
      return { valid: false, error: 'Set 2 tiebreak must be won by exactly 1 game' }
    }
  } else {
    const diff = Math.abs(set2Player1 - set2Player2)
    if (diff < 2) {
      return { valid: false, error: 'Set 2 must be won by 2+ games' }
    }
  }

  // Check if match is complete (someone won 2 sets)
  let player1Sets = 0, player2Sets = 0
  if (set1Player1 > set1Player2) player1Sets++; else player2Sets++
  if (set2Player1 > set2Player2) player1Sets++; else player2Sets++

  if (player1Sets < 2 && player2Sets < 2) {
    // Need set 3
    if (set3Player1 === undefined || set3Player2 === undefined) {
      return { valid: false, error: 'Need set 3 to determine winner' }
    }
    if (isNaN(set3Player1) || isNaN(set3Player2) || !Number.isInteger(set3Player1) || !Number.isInteger(set3Player2)) {
      return { valid: false, error: 'Set 3 scores must be whole numbers' }
    }
    if (set3Player1 < 0 || set3Player1 > 7 || set3Player2 < 0 || set3Player2 > 7) {
      return { valid: false, error: 'Set 3 game scores must be between 0 and 7' }
    }
    if (set3Player1 < 6 && set3Player2 < 6) {
      return { valid: false, error: 'Set 3: At least one player must score 6+ games' }
    }
  }

  return { valid: true }
}

// In submitMatchScore function, add at start:
export async function submitMatchScore(params: SubmitScoreParams) {
  try {
    const supabase = await createClient()

    // Validate score BEFORE database operations
    const validation = validateMatchScore(params)
    if (!validation.valid) {
      return { error: validation.error }
    }

    // ... rest of function
  }
}
```

---

### Fix #4: Structured Error Codes
**Location:** Create `lib/utils/errors.ts`

```typescript
export enum ErrorCode {
  // Auth errors
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Ladder errors
  LADDER_UPDATE_FAILED = 'LADDER_UPDATE_FAILED',
  POSITION_CORRUPTED = 'POSITION_CORRUPTED',
  PLAYER_NOT_ON_LADDER = 'PLAYER_NOT_ON_LADDER',
  
  // Challenge errors
  PLAYER_HAS_ACTIVE_CHALLENGE = 'PLAYER_HAS_ACTIVE_CHALLENGE',
  CHALLENGE_NOT_FOUND = 'CHALLENGE_NOT_FOUND',
  CHALLENGE_INVALID_STATE = 'CHALLENGE_INVALID_STATE',
  
  // Match errors
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',
  INVALID_SCORE = 'INVALID_SCORE',
  MATCH_ALREADY_COMPLETED = 'MATCH_ALREADY_COMPLETED',
  
  // Validation errors
  INVALID_DATE = 'INVALID_DATE',
  INVALID_POSITION = 'INVALID_POSITION',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: Record<string, any>
}

export function createError(code: ErrorCode, message: string, details?: Record<string, any>): AppError {
  return { code, message, details }
}

export function isAppError(error: any): error is AppError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error
}
```

**Usage in server actions:**
```typescript
import { ErrorCode, createError } from '@/lib/utils/errors'

export async function createChallenge(params: CreateChallengeParams) {
  try {
    // ...
    if (!user) {
      return createError(ErrorCode.NOT_AUTHENTICATED, 'Please log in to create a challenge')
    }

    if (!challengedPosition) {
      return createError(ErrorCode.PLAYER_NOT_ON_LADDER, 'The challenged player is not on the ladder')
    }

    // ...
  } catch (error) {
    console.error('[createChallenge] Internal error:', error)
    return createError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred', {
      requestId: requestId,
      originalError: error instanceof Error ? error.message : String(error)
    })
  }
}
```

---

### Fix #5: Return Errors on Ladder Update Failure
**Location:** `lib/actions/matches.ts:133-172`

**Current (Silent Failure):**
```typescript
if (match.match_type === 'challenge' && match.challenge_id) {
  try {
    await updateLadderPositions(...)
    ladderUpdateStatus = 'updated'
  } catch (error) {
    console.error('Error updating ladder positions:', error)
    ladderUpdateStatus = 'error'  // ⚠️ Still returns { success: true }!
  }
}

return {
  success: true,
  debug: { ladderUpdateStatus, ... }
}
```

**Fixed (Return Error):**
```typescript
if (match.match_type === 'challenge' && match.challenge_id) {
  try {
    await updateLadderPositions(...)
    ladderUpdateStatus = 'updated'
  } catch (error) {
    console.error('Error updating ladder positions:', error)
    
    // Rollback match update if ladder update fails
    await supabase
      .from('matches')
      .update({ winner_id: null, completed_at: null })
      .eq('id', params.matchId)
    
    return createError(
      ErrorCode.LADDER_UPDATE_FAILED,
      'Failed to update ladder positions. Score submission reverted.',
      { originalError: error instanceof Error ? error.message : String(error) }
    )
  }
}

return { success: true, debug: { ... } }
```

---

### Fix #6: Add Request Correlation IDs
**Location:** Create `lib/utils/logging.ts`

```typescript
import { v4 as uuidv4 } from 'uuid'

export interface RequestContext {
  requestId: string
  startTime: number
  userId?: string
}

export function createRequestContext(userId?: string): RequestContext {
  return {
    requestId: uuidv4(),
    startTime: Date.now(),
    userId
  }
}

export function logInfo(context: RequestContext, message: string, data?: any) {
  console.log(`[${context.requestId}] ${message}`, data ? JSON.stringify(data) : '')
}

export function logError(context: RequestContext, message: string, error: any) {
  const duration = Date.now() - context.startTime
  console.error(
    `[${context.requestId}] ${message} (${duration}ms)`,
    error instanceof Error ? error.message : String(error)
  )
}
```

**Usage:**
```typescript
export async function createChallenge(params: CreateChallengeParams) {
  const { data: { user } } = await createClient().auth.getUser()
  const ctx = createRequestContext(user?.id)
  
  try {
    logInfo(ctx, 'Creating challenge', { challengedId: params.challengedId })
    // ...
    logInfo(ctx, 'Challenge created successfully', { challengeId: challenge.id })
    return { success: true, challengeId: challenge.id }
  } catch (error) {
    logError(ctx, 'Failed to create challenge', error)
    return createError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred')
  }
}
```

---

### Fix #7: Add Database Constraint for Position
**Location:** New migration file

```sql
-- 20250120_001_add_position_constraints.sql

-- Add check constraint for valid positions
ALTER TABLE ladder_positions
ADD CONSTRAINT valid_position_not_negative
  CHECK (position >= 1);

-- Create index for faster concurrent updates
CREATE INDEX idx_ladder_positions_for_update 
ON ladder_positions(season_id, position) 
WHERE is_active = TRUE;

-- Add constraint to prevent match without proper challenge reference
ALTER TABLE matches
ADD CONSTRAINT challenge_match_consistency
  CHECK (
    (match_type != 'challenge'::match_type) OR (challenge_id IS NOT NULL)
  );

-- Add constraint for match completion
ALTER TABLE matches
ADD CONSTRAINT completed_match_has_winner
  CHECK (
    (winner_id IS NULL AND completed_at IS NULL) OR
    (winner_id IS NOT NULL AND completed_at IS NOT NULL)
  );
```

---

### Fix #8: Validate Date Inputs
**Location:** `lib/utils/validation.ts`

```typescript
export function validateProposedDate(dateString: string, season: { end_date?: string }): { valid: boolean; error?: string } {
  try {
    const proposedDate = new Date(dateString)
    const now = new Date()

    // Check valid date
    if (isNaN(proposedDate.getTime())) {
      return { valid: false, error: 'Invalid date format' }
    }

    // Check not in past
    if (proposedDate <= now) {
      return { valid: false, error: 'Match date must be in the future' }
    }

    // Check before season end
    if (season.end_date) {
      const seasonEnd = new Date(season.end_date)
      if (proposedDate > seasonEnd) {
        return { valid: false, error: 'Match date must be before season ends' }
      }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Error validating date' }
  }
}

export function validateLadderPosition(position: number, maxPosition: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(position)) {
    return { valid: false, error: 'Position must be a whole number' }
  }

  if (position < 1) {
    return { valid: false, error: 'Position must be 1 or higher' }
  }

  if (position > maxPosition + 1) {
    return { valid: false, error: `Position cannot exceed ${maxPosition + 1}` }
  }

  return { valid: true }
}
```

---

### Fix #9: Remove Production Debug Logs
**Location:** `lib/actions/matches.ts:82-197`

**Current:**
```typescript
console.log('=== MATCH SCORE SUBMISSION DEBUG ===')
console.log('Match type:', match.match_type)
console.log('Winner ID:', winnerId)
// ... 15+ more logs
```

**Fixed:**
```typescript
// Remove or use environment flag
if (process.env.DEBUG === 'true') {
  console.log('[matches] Match type:', match.match_type)
  console.log('[matches] Winner ID:', winnerId)
}
```

---

## Database Migration Order

1. **Add constraints (prevents invalid states)**
   - Valid position CHECK
   - Challenge completion logic
   - Unique active challenge per player

2. **Add functions (enables transactions)**
   - `update_ladder_positions` RPC

3. **Add indexes (improves performance)**
   - Ladder positions for update
   - Challenge status lookups

---

## Testing Checklist

- [ ] Create test for concurrent ladder updates
- [ ] Create test for simultaneous challenges to same player
- [ ] Create test for invalid score submissions
- [ ] Create test for season end-of-life
- [ ] Create test for error code propagation
- [ ] Load test with 10+ concurrent matches

---

## Deployment Checklist

- [ ] Add error handling code
- [ ] Add validation functions
- [ ] Run database migrations
- [ ] Deploy new server actions
- [ ] Update frontend error handling
- [ ] Test error scenarios
- [ ] Monitor logs for errors
- [ ] Update documentation

