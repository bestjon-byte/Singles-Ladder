# PRODUCTION READINESS ACTION PLAN
## Singles Ladder - Prioritized Implementation Checklist

**Last Updated:** January 18, 2025
**Status:** Ready for Implementation

---

## 🎯 EXECUTIVE DECISION REQUIRED

Choose your launch strategy:

- **[ ] Option A: Fast Launch (1-2 weeks, 65 hours)** - Beta with 10-50 users
- **[ ] Option B: Proper Launch (4-6 weeks, 160 hours)** - Full production ready
- **[ ] Option C: Phased Launch (2-3 months)** - Iterative with real feedback

---

## 🔴 PHASE 1: CRITICAL BLOCKERS (44 hours)
**Must complete before ANY production deployment**

### Security (16 hours)

- [ ] **Enable email verification** (1 hour)
  - Go to Supabase Dashboard → Authentication → Settings
  - Enable "Confirm email" option
  - Update signup flow to show email confirmation message

- [ ] **Strengthen password policy** (30 mins)
  - Update `/app/auth/signup/page.tsx`
  - Implement Zod schema with 12+ chars, uppercase, lowercase, number
  - Update validation messages

- [ ] **Fix RLS policies** (3 hours)
  - Update `20250116_002_rls_policies.sql`
  - Fix `wildcard_usage` policy: Remove `WITH CHECK (TRUE)`
  - Fix `player_stats` policy: Restrict to own stats only
  - Test policies thoroughly

- [ ] **Remove XSS vulnerability** (30 mins)
  - Install react-markdown: `npm install react-markdown`
  - Update `/components/UserGuideContent.tsx`
  - Replace dangerouslySetInnerHTML with ReactMarkdown component

- [ ] **Implement rate limiting** (4 hours)
  - Set up Upstash Redis account
  - Install: `npm install @upstash/redis @upstash/ratelimit`
  - Create `/middleware.ts` rate limiting
  - Limit: 10 requests/minute for auth, 30/minute for API

- [ ] **Remove debug logs** (2 hours)
  - Search codebase for `console.log`, `console.debug`
  - Remove all 35+ instances in:
    - `/lib/actions/matches.ts`
    - `/lib/actions/disputes.ts`
    - `/components/matches/MatchCard.tsx`
  - Create conditional logging utility for future use

- [ ] **Add input validation** (3 hours)
  - Create Zod schemas in `/lib/validations/schemas.ts`
  - Add validation to all server actions:
    - `createChallenge()` - date, location, players
    - `submitMatchScore()` - score ranges, set validation
    - Admin actions - position numbers, IDs

- [ ] **HTML escape email templates** (2 hours)
  - Update all notification functions in `/lib/services/notifications.ts`
  - Escape user names, locations, dates
  - Use template literal escaping or library

### Monitoring (4 hours)

- [ ] **Set up Sentry** (2 hours)
  - Create Sentry account: https://sentry.io
  - Install: `npm install @sentry/nextjs`
  - Run: `npx @sentry/wizard@latest -i nextjs`
  - Configure error tracking for both client and server
  - Test error reporting

- [ ] **Configure uptime monitoring** (1 hour)
  - Sign up for Uptime Robot (free): https://uptimerobot.com
  - Add monitor for production URL
  - Set up email/Slack alerts
  - Check every 5 minutes

- [ ] **Add structured logging** (1 hour)
  - Create `/lib/utils/logger.ts`
  - Implement log levels (error, warn, info, debug)
  - Use environment variable for log level
  - Replace remaining console.logs

### Performance (8 hours)

- [ ] **Add database indexes** (1 hour)
  - Create migration: `20250118_add_performance_indexes.sql`
  ```sql
  CREATE INDEX idx_ladder_season_user_active ON ladder_positions(season_id, user_id, is_active);
  CREATE INDEX idx_matches_season_winner ON matches(season_id, winner_id);
  CREATE INDEX idx_matches_season_player1 ON matches(season_id, player1_id);
  CREATE INDEX idx_matches_season_player2 ON matches(season_id, player2_id);
  CREATE INDEX idx_challenges_season_challenger ON challenges(season_id, challenger_id, status);
  CREATE INDEX idx_challenges_season_challenged ON challenges(season_id, challenged_id, status);
  ```
  - Run migration in Supabase
  - Verify with EXPLAIN ANALYZE

- [ ] **Fix ladder update transaction** (4 hours)
  - Create PostgreSQL function: `update_ladder_positions_atomic()`
  - Use single transaction with bulk update
  - Replace loop-based approach in `/lib/actions/matches.ts`
  - Replace loop in `/lib/actions/ladder-admin.ts`
  - Add proper error handling and rollback
  - Test with 32+ player ladder

- [ ] **Implement pagination - Matches** (3 hours)
  - Update `/app/matches/page.tsx`
  - Add query params: `?page=1&limit=25`
  - Update UI with pagination controls
  - Show: Previous | 1 2 3 ... 10 | Next
  - Default to 25 items per page

### Testing (16 hours)

- [ ] **Set up testing infrastructure** (2 hours)
  - Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
  - Create `vitest.config.ts`
  - Create `/tests` directory structure
  - Set up test database (Supabase local or separate test project)

- [ ] **Write ladder update tests** (4 hours)
  - Test position calculations
  - Test transaction rollback on error
  - Test concurrent update handling
  - Test edge cases (player at -1, duplicate positions)

- [ ] **Write challenge creation tests** (4 hours)
  - Test validation (can't challenge self, must be above, etc.)
  - Test wildcard consumption
  - Test player locking
  - Test duplicate challenge prevention

- [ ] **Write RLS policy tests** (4 hours)
  - Test users can only edit own profile
  - Test admins can view all data
  - Test wildcard policy restrictions
  - Test stats policy restrictions

- [ ] **Write critical E2E test** (2 hours)
  - Install: `npm install -D @playwright/test`
  - Write test: signup → add to ladder → create challenge → submit score
  - Verify ladder updates correctly
  - Run in CI

**Phase 1 Checkpoint:** Deploy to staging, test thoroughly, get approval

---

## 🟡 PHASE 2: HIGH PRIORITY (60 hours)
**Complete within 2-3 weeks after Phase 1**

### Performance (16 hours)

- [ ] **Parallelize queries** (4 hours)
  - Update `/lib/actions/challenges.ts`
  - Use Promise.all() for independent queries
  - Reduce challenge creation from 8 queries to 2-3
  - Update other actions similarly

- [ ] **Fix force-dynamic caching** (2 hours)
  - Update `/app/dashboard/page.tsx`: `export const revalidate = 60`
  - Update `/app/matches/page.tsx`: `export const revalidate = 60`
  - Keep `force-dynamic` only on admin pages

- [ ] **Add React.memo to InteractiveLadder** (2 hours)
  - Wrap component in React.memo
  - Use useMemo for getPlayerStatus
  - Prevent unnecessary re-renders

- [ ] **Implement code splitting** (4 hours)
  - Use React.lazy() for modals
  - Wrap in Suspense with loading fallback
  - Split CreateChallengeModal, match forms

- [ ] **Fix over-fetching** (2 hours)
  - Update all queries to select specific columns
  - `/app/admin/ladder/page.tsx`: `user:users(id, name, email)` instead of `users(*)`

- [ ] **Debounce search inputs** (2 hours)
  - Install: `npm install use-debounce`
  - Update `/components/admin/UsersTable.tsx`
  - Debounce search by 300ms

### UX (24 hours)

- [ ] **Fix modal accessibility** (6 hours)
  - Replace div modals with `<dialog>` element
  - Add focus trap (focus-trap-react)
  - Implement ESC key handler
  - Add aria-labelledby, aria-describedby
  - Move focus to modal on open
  - Return focus on close

- [ ] **Add aria-labels to icon buttons** (3 hours)
  - Add aria-label to all close buttons (X)
  - Add to expand/collapse chevrons
  - Add to admin action buttons (up, down, remove)
  - Add to notification bell

- [ ] **Implement score validation** (4 hours)
  - Create tennis score validation rules
  - Valid set scores: 6-4, 7-5, 7-6, etc.
  - Invalid: 6-6, 7-7 (must be tiebreak)
  - Real-time validation on input
  - Show error messages immediately

- [ ] **Add toast notifications** (3 hours)
  - Install: `npm install sonner`
  - Create toast wrapper component
  - Add success toasts for:
    - Challenge accepted/rejected
    - Score submitted
    - Profile updated
    - Admin actions

- [ ] **Fix mobile touch targets** (2 hours)
  - Audit all interactive elements
  - Ensure minimum 44x44px
  - Update button padding: `className="min-h-[44px] min-w-[44px]"`

- [ ] **Replace alert() calls** (1 hour)
  - Update `/components/matches/MatchCard.tsx:101`
  - Use inline error message instead of alert()
  - Style consistently with other errors

- [ ] **Add help tooltips** (3 hours)
  - Install: `npm install @radix-ui/react-tooltip`
  - Add tooltips for:
    - Wildcard badge (explains usage)
    - Lock icon (explains locking)
    - Challenge types
    - Match dispute process

- [ ] **Improve error messages** (2 hours)
  - Replace "An error occurred" with specific messages
  - "Challenge failed: [Player] is already in an active challenge"
  - "Score invalid: Set scores must be 0-7"
  - Update all generic messages

### Code Quality (12 hours)

- [ ] **Extract auth utilities** (2 hours)
  - Create `/lib/utils/auth-helpers.ts`
  - Implement `requireAuth()` and `requireAdminAuth()`
  - Update all 9 action files
  - Remove 26+ duplicate auth checks

- [ ] **Create useAsyncAction hook** (3 hours)
  - Create `/lib/hooks/useAsyncAction.ts`
  - Encapsulate loading/error state
  - Update 10+ components

- [ ] **Consolidate date formatting** (1 hour)
  - Create `/lib/utils/formatting.ts`
  - Export formatDate, formatDateTime
  - Update 5 components

- [ ] **Remove unused code** (2 hours)
  - Remove unused server functions
  - Remove or implement unused notification types
  - Remove unused database tables or document future use

- [ ] **Create cache revalidation constants** (1 hour)
  - Create `/lib/constants/revalidation.ts`
  - Export REVALIDATE_PATHS object
  - Replace hardcoded paths

- [ ] **Add JSDoc comments** (3 hours)
  - Document all utility functions
  - Document server actions
  - Document complex components

### Infrastructure (8 hours)

- [ ] **Create staging environment** (2 hours)
  - Create separate Supabase project for staging
  - Configure Vercel preview deployments
  - Set environment variables
  - Test deployment

- [ ] **Create deployment runbook** (2 hours)
  - Document deployment steps
  - Create pre-deployment checklist
  - Document rollback procedure
  - Document emergency procedures

- [ ] **Configure database backups** (2 hours)
  - Enable Supabase automatic backups
  - Set up weekly exports to S3
  - Document restoration procedure
  - Test restore process

- [ ] **Set up GitHub Actions** (2 hours)
  - Create `.github/workflows/test.yml`
  - Run tests on every PR
  - Block merge if tests fail
  - Add status badge to README

**Phase 2 Checkpoint:** Full regression testing, performance audit

---

## 🟢 PHASE 3: MEDIUM PRIORITY (88 hours)
**Complete within 2-3 months**

### Testing (40 hours)

- [ ] **Component tests** (24 hours)
  - Test ChallengeCard interactions
  - Test MatchCard score submission
  - Test CreateChallengeModal validation
  - Test InteractiveLadder rendering
  - Test admin components
  - Target: 60% component coverage

- [ ] **E2E test suite** (16 hours)
  - Test complete user journey
  - Test admin operations
  - Test authentication flows
  - Test mobile responsive behavior
  - Test error scenarios
  - Target: All critical paths covered

### Performance (16 hours)

- [ ] **Implement Redis caching** (8 hours)
  - Set up Upstash Redis
  - Cache active season data (5 min TTL)
  - Cache ladder positions (1 min TTL)
  - Cache user stats (5 min TTL)
  - Invalidate on updates

- [ ] **Add connection pooling** (2 hours)
  - Enable Supabase connection pooler
  - Update connection strings
  - Test under load

- [ ] **Optimize images** (2 hours)
  - Use next/image for all images
  - Add proper width/height
  - Implement lazy loading
  - Optimize logo sizes

- [ ] **Bundle size optimization** (4 hours)
  - Analyze bundle with @next/bundle-analyzer
  - Remove unused dependencies
  - Implement tree shaking
  - Target: < 500KB first load JS

### UX (16 hours)

- [ ] **Complete accessibility audit** (8 hours)
  - Run axe DevTools on all pages
  - Fix all WCAG 2.1 Level A issues
  - Fix all WCAG 2.1 Level AA issues
  - Add skip navigation links
  - Test with screen reader (NVDA/VoiceOver)

- [ ] **Create onboarding flow** (4 hours)
  - Welcome modal for new users
  - Tour of key features
  - Interactive tutorial
  - Dismissable and replayable

- [ ] **Build contextual help system** (4 hours)
  - Add help icons throughout
  - Create help sidebar
  - Link to relevant USER_GUIDE sections
  - Add keyboard shortcuts guide

### Code Quality (16 hours)

- [ ] **Consolidate notification service** (6 hours)
  - Create generic `notifyUser()` function
  - Reduce 7 notification functions to 1 factory
  - Add notification queue
  - Implement retry logic

- [ ] **Refactor ladder service** (6 hours)
  - Extract to `/lib/services/ladder-service.ts`
  - Consolidate position update logic
  - Add comprehensive tests
  - Document all functions

- [ ] **Create shared component library** (4 hours)
  - Extract base Card component
  - Create Badge component
  - Create StatusIndicator component
  - Standardize all variants

---

## 🔵 PHASE 4: NICE TO HAVE (40+ hours)
**Complete when time permits**

### Features

- [ ] **Complete Phase 4 features** (Notifications)
  - WhatsApp integration
  - Email queue optimization
  - In-app notification center enhancements

- [ ] **Complete Phase 5 features** (Playoffs)
  - Playoff generation
  - Season end flow
  - Championship tracking

- [ ] **Complete Phase 6 features** (Statistics)
  - Personal stats dashboard
  - Head-to-head records
  - Leaderboards

### Infrastructure

- [ ] **Advanced monitoring**
  - Custom Sentry dashboards
  - Performance budgets
  - Real-time alerting

- [ ] **A/B testing framework**
  - Feature flags
  - Variant testing
  - Analytics integration

- [ ] **Load testing**
  - Simulate 1000+ users
  - Identify bottlenecks
  - Optimize database

### Quality

- [ ] **Security audit**
  - Third-party security review
  - Penetration testing
  - Compliance check

- [ ] **90%+ test coverage**
  - Comprehensive unit tests
  - All components tested
  - All edge cases covered

- [ ] **Accessibility certification**
  - WCAG 2.1 AAA compliance
  - Professional audit
  - Certificate of compliance

---

## 📋 DAILY STANDUP TEMPLATE

Use this for tracking progress:

```
## Date: [YYYY-MM-DD]

### Completed Today
- [ ] Task 1
- [ ] Task 2

### In Progress
- [ ] Task 3 (50% complete)

### Blockers
- [ ] Waiting on: [what/who]

### Next Up
- [ ] Task 4
- [ ] Task 5

### Notes
-
```

---

## 🎯 SUCCESS METRICS

Track these metrics weekly:

### Week 1 (Phase 1)
- [ ] All critical security issues resolved
- [ ] Monitoring in place
- [ ] Essential tests passing
- [ ] Staging environment working
- [ ] **Ready for beta launch**

### Week 4 (Phase 2)
- [ ] All high-priority issues resolved
- [ ] UX improvements deployed
- [ ] Performance optimized
- [ ] Code quality improved
- [ ] **Ready for wider beta**

### Month 2-3 (Phase 3)
- [ ] 70%+ test coverage
- [ ] Full accessibility compliance
- [ ] Comprehensive monitoring
- [ ] Documentation complete
- [ ] **Ready for production launch**

---

## 🚨 RISK MONITORING

Check daily during implementation:

- [ ] Are any blockers preventing progress?
- [ ] Have new issues been discovered?
- [ ] Is timeline still realistic?
- [ ] Do we need to re-prioritize?
- [ ] Are dependencies causing delays?

---

## 📞 ESCALATION CONTACTS

Define your escalation path:

**Technical Issues:**
- Developer: [Name/Contact]
- Senior Developer: [Name/Contact]

**Product Decisions:**
- Product Manager: [Name/Contact]
- Stakeholder: [Name/Contact]

**Infrastructure:**
- DevOps: [Name/Contact]
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com

---

## ✅ PRE-LAUNCH CHECKLIST

Complete before announcing to users:

### Security
- [ ] All critical security issues fixed
- [ ] RLS policies tested
- [ ] Email verification enabled
- [ ] Rate limiting active
- [ ] No debug logs in production

### Performance
- [ ] Database indexed
- [ ] Pagination implemented
- [ ] Caching configured
- [ ] Load tested

### Monitoring
- [ ] Sentry configured
- [ ] Uptime monitoring active
- [ ] Logging working
- [ ] Alerts configured

### Quality
- [ ] Essential tests passing
- [ ] Staging tested
- [ ] Mobile tested
- [ ] Accessibility basics met

### Operations
- [ ] Backup strategy in place
- [ ] Runbook documented
- [ ] Rollback plan ready
- [ ] Support process defined

### Communication
- [ ] User guide published
- [ ] Support email set up
- [ ] Status page ready (optional)
- [ ] Announcement prepared

---

## 🎉 LAUNCH DAY PROTOCOL

### Pre-Launch (Day Before)
1. [ ] Deploy to staging
2. [ ] Full regression test
3. [ ] Verify all monitors
4. [ ] Notify stakeholders
5. [ ] Prepare rollback plan

### Launch Day
1. [ ] Deploy to production (low-traffic time)
2. [ ] Monitor Sentry for errors
3. [ ] Check performance metrics
4. [ ] Verify key user flows
5. [ ] Send announcement

### Post-Launch (First 24 Hours)
1. [ ] Monitor continuously
2. [ ] Respond to issues immediately
3. [ ] Collect user feedback
4. [ ] Document any problems
5. [ ] Plan hot-fixes if needed

### Post-Launch (First Week)
1. [ ] Daily standup to review metrics
2. [ ] Track error rates
3. [ ] Monitor performance
4. [ ] Collect user feedback
5. [ ] Plan first iteration

---

## 📊 TRACKING PROGRESS

Current Status: **NOT STARTED**

**Phase 1:** ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% (0/44 hours)
**Phase 2:** ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% (0/60 hours)
**Phase 3:** ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% (0/88 hours)

**Overall:** 0% (0/192 hours)

Update this weekly!

---

**Document Version:** 1.0
**Last Updated:** January 18, 2025
**Next Review:** [Schedule first review]
