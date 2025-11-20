# Timeline Event Bugs Analysis: Mike vs Jon Best

## Overview
This document identifies potential bugs in the challenge and match workflow that could affect the timeline of events between players.

## Bugs Identified

### Bug #1: Orphaned Match Fixtures After Challenge Withdrawal (CRITICAL)

**Location**: `lib/actions/challenges.ts:358-434` (withdrawChallenge function)

**Description**: When a challenge is withdrawn AFTER being accepted, the match fixture remains in the database as an orphaned record.

**Workflow**:
1. Player A challenges Player B → Challenge created (status='pending')
2. Player B accepts → Challenge status='accepted', Match fixture created
3. Player A withdraws → Challenge status='withdrawn'
4. **BUG**: Match fixture still exists with no winner_id (incomplete match)

**Problem**:
- The `withdrawChallenge` function only updates the challenge status to 'withdrawn'
- It does NOT delete or cancel the associated match fixture
- This leaves an incomplete match in the database
- The incomplete match blocks both players from creating new challenges (lines 115-138 in challenges.ts check for incomplete matches)

**Expected Behavior**:
When withdrawing an accepted challenge, the code should also:
1. Delete the match fixture, OR
2. Add a 'cancelled' status to matches and mark the match as cancelled

**Code Evidence**:
```typescript
// lib/actions/challenges.ts:358-434
export async function withdrawChallenge(challengeId: string) {
  // ... validation code ...

  // Withdraw the challenge
  const { error: updateError } = await supabase
    .from('challenges')
    .update({
      status: 'withdrawn',
      updated_at: new Date().toISOString(),
    })
    .eq('id', challengeId)

  // BUG: No code here to handle the associated match fixture!

  // ... refund wildcard and send notification ...
}
```

**Fix Recommendation**:
Add code to delete or cancel the match when withdrawing an accepted challenge:

```typescript
// After withdrawing the challenge, check if a match exists
if (challenge.status === 'accepted') {
  // Delete the associated match fixture
  const { error: matchDeleteError } = await supabase
    .from('matches')
    .delete()
    .eq('challenge_id', challengeId)
    .is('winner_id', null) // Only delete if score not submitted

  if (matchDeleteError) {
    console.error('Error deleting match fixture:', matchDeleteError)
  }
}
```

---

### Bug #2: Wildcard Usage Timing Inconsistency

**Location**: `lib/actions/challenges.ts:161-174` vs `DATABASE_SCHEMA.md:316-319`

**Description**: There's an inconsistency between the documented behavior and actual implementation of wildcard consumption.

**Documentation says** (DATABASE_SCHEMA.md:316-319):
- Wildcard is **reserved** when challenge is created
- Wildcard is **consumed** (inserted to wildcard_usage) when match is **completed**
- If challenge is withdrawn/rejected, wildcard is NOT consumed

**Code actually does**:
- Wildcard is **consumed immediately** when challenge is created (lines 161-174)
- If challenge is withdrawn/rejected, wildcard is **refunded** by deleting the wildcard_usage record

**Code Evidence**:
```typescript
// lib/actions/challenges.ts:161-174
// If wildcard, record wildcard usage
if (params.isWildcard && challenge) {
  const { error: wildcardError } = await supabase
    .from('wildcard_usage')
    .insert({  // BUG: Inserted immediately, not on match completion
      season_id: activeSeason.id,
      user_id: user.id,
      challenge_id: challenge.id,
    })
}
```

**Problem**:
- The current implementation works but doesn't match the documented design
- This could cause confusion when debugging wildcard issues
- If the wildcard refund fails (lines 333, 411), the player loses the wildcard permanently

**Impact**: Medium - Works correctly but inconsistent with documentation

**Fix Recommendation**:
Either:
1. Update the documentation to match the current implementation, OR
2. Change the code to only insert wildcard_usage when match is completed:
   - Add `is_wildcard` check in submitMatchScore function
   - Insert wildcard_usage record when match score is submitted
   - Remove wildcard_usage insert from createChallenge function
   - Remove wildcard refund logic from rejectChallenge and withdrawChallenge

---

### Bug #3: Missing Match Deletion in rejectChallenge

**Location**: `lib/actions/challenges.ts:280-356` (rejectChallenge function)

**Description**: Similar to Bug #1, but for rejected challenges instead of withdrawn ones.

**Note**: This is actually NOT a bug because:
- Challenges can only be rejected when status='pending' (line 307-309)
- Match fixtures are only created when a challenge is accepted (lines 242-258)
- Therefore, no match fixture exists when a challenge is rejected

**Status**: Not a bug - working as intended

---

### Bug #4: No Validation for Challenge Withdrawal After Match Creation

**Location**: `lib/actions/challenges.ts:384-387`

**Description**: The withdrawChallenge function allows withdrawing challenges with status 'accepted', but doesn't check if a match score has already been partially entered or if the match has started.

**Code**:
```typescript
// Can only withdraw pending or accepted challenges
if (!['pending', 'accepted'].includes(challenge.status)) {
  return { error: 'This challenge cannot be withdrawn' }
}
```

**Potential Issue**:
- If players have started entering match details or scores, withdrawing could cause data inconsistency
- However, current implementation checks if match.winner_id is null before allowing withdrawal

**Impact**: Low - Likely handled by incomplete match checks

---

## How to Debug the Timeline

I've created two tools to help you investigate the timeline between Mike and Jon Best:

### Option 1: Admin Web Page
Navigate to: `http://localhost:3000/admin/timeline`
- Enter "Mike" and "Jon Best" in the player name fields
- Click "Refresh" to see the full timeline
- View all challenges, matches, and events in chronological order
- Expand "View raw data" for each event to see database details

### Option 2: Command Line Script
Run: `npx tsx scripts/query-timeline.ts`
- Requires environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Outputs timeline to console with full JSON data

## What to Look For

When examining the timeline between Mike and Jon Best, check for:

1. **Orphaned Match Fixtures**:
   - Challenge status = 'withdrawn' or 'cancelled'
   - Associated match exists with winner_id = null
   - Match was created BEFORE challenge was withdrawn
   - This indicates Bug #1

2. **Challenge Accepted → Withdrawn → New Challenge Blocked**:
   - Challenge accepted at Time A
   - Challenge withdrawn at Time B
   - New challenge attempt at Time C fails with "incomplete match" error
   - This indicates the orphaned match is blocking new challenges

3. **Wildcard Inconsistencies**:
   - Challenge created with is_wildcard = true
   - Challenge withdrawn/rejected
   - Check wildcard_usage table to see if record was properly deleted
   - If wildcard_usage record still exists, player lost a wildcard (Bug #2 side effect)

4. **Timeline Sequence Anomalies**:
   - Challenge withdrawn but match shows as completed
   - Match created before challenge accepted
   - Multiple active challenges at the same time for one player
   - Challenge completed without an associated match

## Recommended Actions

1. **Immediate**: Run the timeline debug tool and check for orphaned matches
2. **Short-term**: Implement Bug #1 fix to handle match deletion on withdrawal
3. **Medium-term**: Decide on wildcard consumption timing (Bug #2) and update code or docs
4. **Long-term**: Add database constraints and triggers to prevent orphaned records

## Database Queries to Investigate

### Find Orphaned Matches
```sql
SELECT m.*, c.status as challenge_status
FROM matches m
JOIN challenges c ON c.id = m.challenge_id
WHERE c.status IN ('withdrawn', 'cancelled')
  AND m.winner_id IS NULL;
```

### Find Challenges Between Mike and Jon Best
```sql
SELECT c.*, u1.name as challenger_name, u2.name as challenged_name
FROM challenges c
JOIN users u1 ON u1.id = c.challenger_id
JOIN users u2 ON u2.id = c.challenged_id
WHERE (u1.name ILIKE '%Mike%' AND u2.name ILIKE '%Jon Best%')
   OR (u1.name ILIKE '%Jon Best%' AND u2.name ILIKE '%Mike%')
ORDER BY c.created_at;
```

### Find All Events Timeline
```sql
-- Challenges
SELECT created_at as timestamp, 'challenge_created' as event_type, id
FROM challenges
WHERE (challenger_id IN (SELECT id FROM users WHERE name ILIKE '%Mike%' OR name ILIKE '%Jon Best%'))
  AND (challenged_id IN (SELECT id FROM users WHERE name ILIKE '%Mike%' OR name ILIKE '%Jon Best%'))
UNION ALL
-- Matches
SELECT created_at as timestamp, 'match_created' as event_type, id
FROM matches
WHERE (player1_id IN (SELECT id FROM users WHERE name ILIKE '%Mike%' OR name ILIKE '%Jon Best%'))
  AND (player2_id IN (SELECT id FROM users WHERE name ILIKE '%Mike%' OR name ILIKE '%Jon Best%'))
ORDER BY timestamp;
```

---

## Summary

The most likely bug affecting the timeline between Mike and Jon Best is **Bug #1**: orphaned match fixtures after challenge withdrawal. This would manifest as:
- Challenge shown as "withdrawn"
- Match fixture still exists
- Both players blocked from creating new challenges
- Timeline shows incomplete/inconsistent state

Use the debug tools provided to verify this hypothesis.
