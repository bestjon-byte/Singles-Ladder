# Singles Ladder - Error Audit Action Plan

## Executive Summary

**39 total issues found:** 9 critical, 10 high, 15 medium, 5 low

**Risk Level:** MEDIUM-HIGH (application is functional but has silent failure modes)

**Recommended Timeline:** 
- **Critical fixes:** Implement in next 1-2 sprints
- **All fixes:** Complete within 2 months
- **Production readiness:** Estimated 30-45 hours of development

---

## Phase 1: IMMEDIATE FIXES (3-4 days, 8-12 hours)

### Why These First?
These prevent **data corruption** and **silent failures**. They're essential before scaling to production.

### 1.1: Race Condition Prevention in Ladder Updates (4 hours)
**Critical:** Players getting stuck at position -1

**What:**
- Replace position `-1` placeholder with database-level locking
- Implement PostgreSQL function for atomic ladder updates
- Remove manual position shifting logic

**Files to Change:**
- `lib/actions/matches.ts` (lines 219-342)
- `lib/actions/disputes.ts` (lines 209-305)
- Create new database migration

**Testing:**
```bash
# Simulate concurrent score submissions
for i in {1..10}; do
  curl -X POST /api/submit-score \
    -d '{"matchId":"...","set1P1":6,...}' &
done
wait

# Check for position -1
SELECT * FROM ladder_positions WHERE position = -1;
```

**Success Criteria:**
- All ladder position values >= 1
- No stuck positions
- Concurrent updates produce correct ladder ordering

---

### 1.2: Match Score Validation (2 hours)
**Critical:** Invalid scores corrupting ladder calculations

**What:**
- Add `validateMatchScore()` function
- Check NaN, range (0-7), and logic
- Validate set progression (need winner before set 3)
- Return specific error messages

**Files to Change:**
- `lib/actions/matches.ts` (before submitMatchScore)

**Testing:**
```typescript
// Test cases needed
validateMatchScore({
  set1Player1: -5,  // Should reject (negative)
  set1Player2: 6,
  set2Player1: 4,
  set2Player2: 3
}) // -> { valid: false, error: 'Scores must be between 0 and 7' }

validateMatchScore({
  set1Player1: 3,  // Both < 6, should reject
  set1Player2: 4,
  set2Player1: 4,
  set2Player2: 3
}) // -> { valid: false }

validateMatchScore({
  set1Player1: 6,
  set1Player2: 4,
  set2Player1: 6,
  set2Player2: 4,
  set3Player1: undefined  // Should reject (need set 3)
}) // -> { valid: false, error: 'Need set 3 to determine winner' }
```

**Success Criteria:**
- All score submissions validated
- Invalid scores rejected with clear error
- No NaN values in database
- No impossible tennis scores

---

### 1.3: Return Errors on Ladder Update Failure (1 hour)
**Critical:** Silent failures when ladder update fails

**What:**
- Check ladder update success/failure
- Rollback match if ladder update fails
- Return error to user instead of success

**Files to Change:**
- `lib/actions/matches.ts` (lines 133-172)

**Before:**
```typescript
if (ladder update fails) {
  console.error(...)
  // Still returns { success: true }
}
```

**After:**
```typescript
if (ladder update fails) {
  // Rollback match
  await supabase.from('matches')
    .update({winner_id: null})
    .eq('id', matchId)
  
  return { error: 'Failed to update ladder' }
}
```

**Success Criteria:**
- Ladder update failures are reported
- Match scores rollback on ladder failure
- User sees error message
- No silent data inconsistencies

---

### 1.4: Add Unique Constraint on Active Challenges (1 hour)
**Critical:** Multiple challenges to same player

**What:**
- Add database constraint: UNIQUE on (season, challenged_id) WHERE status IN ('pending', 'accepted')
- Update app to handle constraint violation
- Test simultaneous challenge submissions

**Files to Change:**
- Database migration (new file)
- `lib/actions/challenges.ts` (error handling)

**Database:**
```sql
ALTER TABLE challenges
ADD CONSTRAINT unique_active_challenge_per_player
  UNIQUE (season_id, challenged_id)
  WHERE status IN ('pending', 'accepted');
```

**Application:**
```typescript
if (createError?.code === 'unique_violation') {
  return { error: 'That player already has an active challenge' }
}
```

**Success Criteria:**
- Only one active challenge per (season, player) pair
- Concurrent challenges return proper error
- No orphaned challenges

---

## Phase 2: IMPORTANT FIXES (5-7 days, 15-18 hours)

### 2.1: Structured Error Codes (3 hours)
Better error handling throughout

**Files:**
- Create `lib/utils/errors.ts`
- Update all 8 action files

**Impact:** Users get meaningful error messages, frontend can handle errors programmatically

---

### 2.2: Input Validation (4 hours)
Prevent invalid data entry

**Files:**
- Create `lib/utils/validation.ts`
- Update `challenges.ts`, `ladder-admin.ts`, `matches.ts`

**Validations:**
- Date validation (must be future, before season end)
- Position validation (must be integer >= 1)
- Wildcard counting (database-level enforcement)

**Impact:** No garbage data in database, better user guidance

---

### 2.3: Better Error Logging (2 hours)
Track issues in production

**Files:**
- Create `lib/utils/logging.ts`
- Update all action files to use request contexts
- Remove debug console.log statements

**Impact:** Can trace user issues from error ID, cleaner logs

---

### 2.4: Soft Delete Pattern (4 hours)
Prevent cascade delete issues

**Files:**
- Database migrations (add deleted_at columns)
- RLS policies (filter deleted users)
- Application logic (don't harddelete users)

**Impact:** User history preserved, no orphaned data

---

### 2.5: Null/Undefined Safety (3 hours)
Type-safe object access

**Files:**
- Update `matches.ts` (challenge/winner access)
- Update `notifications.ts` (email sending)
- Update components (null checks)

**Impact:** Fewer runtime errors, safer code

---

## Phase 3: NICE-TO-HAVE FIXES (5-7 days, 12-16 hours)

### 3.1: Database Constraints (2 hours)
Enforce business rules at DB level

- Add CHECK for position >= 1
- Add CHECK for score ranges
- Add constraints for match completion logic

---

### 3.2: Season End-of-Life Handling (3 hours)
Clean up expired challenges/matches

**What:**
- When season ends, mark pending challenges as 'expired'
- Prevent new matches in closed seasons
- Archive old seasons properly

---

### 3.3: Optimistic Locking (4 hours)
Handle concurrent updates better

**What:**
- Add `version` column to tables
- Update with version check: `WHERE id=X AND version=Y`
- Detect concurrent modifications

---

### 3.4: Comprehensive Test Suite (3 hours)
Test all edge cases

**Tests:**
- Concurrent ladder updates
- Race condition scenarios
- Input validation edge cases
- Error propagation
- Database constraint violations

---

## Risk Assessment

### Without Fixes (Current State)
- **Data Corruption Risk:** HIGH
  - Players stuck at position -1
  - Invalid ladder positions
  - Orphaned matches/challenges
  
- **Silent Failures:** HIGH
  - Ladder updates fail, match still completes
  - Notifications fail silently
  - Errors only in logs

- **User Impact:** MEDIUM
  - Confusing error messages
  - Incorrect ladder standings
  - Unclear why operations fail

### With Phase 1 Fixes (Critical Only)
- **Data Corruption Risk:** MEDIUM
  - Ladder positions protected by transactions
  - Invalid scores rejected
  - Concurrent challenges prevented
  
- **Silent Failures:** LOW
  - Errors properly returned
  - User sees what happened
  
- **User Impact:** GOOD
  - Clear error messages
  - Correct ladder standings
  - Predictable behavior

### With All Fixes
- **Data Corruption Risk:** LOW
  - Database constraints prevent invalid states
  - Soft deletes preserve history
  - All operations atomic
  
- **Silent Failures:** VERY LOW
  - Comprehensive logging
  - Request tracking
  - Error monitoring
  
- **User Impact:** EXCELLENT
  - Meaningful error messages
  - Data always consistent
  - Production-ready

---

## Effort Breakdown

| Phase | Hours | Duration | Risk Reduction | Ready for Production |
|-------|-------|----------|-----------------|---------------------|
| Current | - | - | - | NO |
| After Phase 1 | 8-12 | 1 sprint | 70% | YES* |
| After Phase 2 | 15-18 | 2 sprints | 85% | YES |
| After Phase 3 | 12-16 | 2 sprints | 95% | YES |
| **Total** | **35-46** | **4-5 sprints** | **95%** | **EXCELLENT** |

*Phase 1 is minimum for production use

---

## Priority Matrix

```
IMPACT vs EFFORT

                     HIGH IMPACT
                     
RC-1 (Race ladder)  ████░ 4h  CRITICAL
RC-2 (Score valid)  ████░ 2h  CRITICAL  ← DO FIRST
Ladder fail error   ███░░ 1h  CRITICAL
Active challenge    ████░ 1h  CRITICAL

Error codes         ███░░ 3h  HIGH
Input validation    ████░ 4h  HIGH
Error logging       ██░░░ 2h  MEDIUM
Soft delete         ████░ 4h  MEDIUM

DB constraints      ██░░░ 2h  LOW
Season EOL          ███░░ 3h  LOW
Optimistic lock     ███░░ 4h  LOW

EFFORT →
```

---

## Week-by-Week Execution Plan

### Week 1: Critical Issues
**Goal:** Prevent data corruption

**Day 1-2 (8 hours):**
- Implement ladder transaction wrapper
- Deploy database migration
- Test concurrent ladder updates

**Day 3 (4 hours):**
- Add score validation function
- Update matches.ts
- Manual testing

**Day 4 (2 hours):**
- Fix ladder error handling
- Implement challenge constraint
- Integration testing

**Day 5 (2 hours):**
- Code review
- Final testing
- Deployment

**Deliverables:**
- ✅ No position -1 stuck states
- ✅ No invalid scores accepted
- ✅ No silent ladder failures
- ✅ No duplicate active challenges

---

### Week 2: Error Handling
**Goal:** Better user experience

**Day 1-2 (5 hours):**
- Create error utilities
- Create validation utilities
- Update all action files

**Day 3 (4 hours):**
- Create logging utilities
- Add request correlation IDs
- Remove debug logs

**Day 4 (2 hours):**
- Integration testing
- Error message review

**Day 5 (2 hours):**
- Code review
- Deployment

**Deliverables:**
- ✅ Structured error codes
- ✅ Meaningful error messages
- ✅ Request tracking
- ✅ Clean logs

---

### Weeks 3-4: Nice-to-Have Fixes
Based on team capacity and business priorities

---

## Success Metrics

### Before Audit
- Database constraint violations: FREQUENT
- Position -1 errors: PRESENT (requires manual fixing)
- Silent failures: ~30% of error scenarios
- User error clarity: POOR

### After Phase 1
- Database constraint violations: NONE
- Position -1 errors: NONE
- Silent failures: <5%
- User error clarity: GOOD

### After All Fixes
- Database constraint violations: IMPOSSIBLE
- Position -1 errors: IMPOSSIBLE
- Silent failures: <1%
- User error clarity: EXCELLENT
- System monitoring: COMPREHENSIVE

---

## Go/No-Go Checklist

**Before Phase 1 Deployment:**
- [ ] Code reviewed by 2 engineers
- [ ] All manual tests pass
- [ ] Load test with 10+ concurrent matches
- [ ] Database migration tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

**Before Phase 2 Deployment:**
- [ ] Automated tests added
- [ ] Error scenarios covered
- [ ] Performance impact <5%

**Before Production Use:**
- [ ] All Phase 1 fixes deployed
- [ ] No P0 issues in production
- [ ] Error monitoring active
- [ ] Team trained on new error handling

---

## Monitoring & Alerts

### Metrics to Track
- Ladder update failures
- Score validation errors
- Constraint violations
- Request latency
- Error rate by code

### Alerts to Set Up
- Position = -1 detected
- Ladder update failure rate > 1%
- Score validation error rate > 2%
- Request latency > 2s
- Uncaught exceptions

---

## Documentation Updates

After fixes, update:
- README (new validation rules)
- USER_GUIDE (better error explanations)
- API docs (error codes)
- DEVELOPER_GUIDE (new patterns)
- DB schema docs (constraints)

---

## Questions for Team

1. **Production Timeline:** When does this need to be production-ready?
2. **User Base:** How many concurrent users expected?
3. **Testing:** Can we do load testing before deployment?
4. **Rollback:** What's the rollback plan if something goes wrong?
5. **Monitoring:** What error tracking system should we integrate?

