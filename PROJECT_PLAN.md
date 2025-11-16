# Tennis Ladder Web App - Comprehensive Project Plan

## Executive Summary

A mobile-optimized web application for managing tennis club ladders independently, featuring player challenges, automated ladder updates, match scheduling, playoffs, and comprehensive statistics tracking.

---

## Table of Contents

1. [Technical Stack](#technical-stack)
2. [Database Schema](#database-schema)
3. [Feature Breakdown](#feature-breakdown)
4. [Application Architecture](#application-architecture)
5. [Implementation Phases](#implementation-phases)
6. [User Flows](#user-flows)
7. [Notification Strategy](#notification-strategy)
8. [Security Considerations](#security-considerations)
9. [Timeline & Estimates](#timeline--estimates)
10. [Future Enhancements](#future-enhancements)

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui or Headless UI
- **State Management**: React Context + Zustand (for complex state)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime (optional for future)
- **Storage**: Supabase Storage (for future profile images)

### Infrastructure
- **Hosting**: Vercel
- **Email**: Resend
- **Version Control**: GitHub
- **CI/CD**: Vercel + GitHub Actions

### Development Tools
- **Package Manager**: pnpm or npm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library (Phase 2)
- **E2E Testing**: Playwright (Phase 3)

---

## Database Schema

### Tables

#### 1. **users**
```sql
- id (uuid, primary key) - Supabase auth.users reference
- email (text, unique, not null)
- name (text, not null)
- whatsapp_number (text)
- created_at (timestamp)
- updated_at (timestamp)
- is_active (boolean, default true)
- email_notifications_enabled (boolean, default true)
- whatsapp_notifications_enabled (boolean, default true)
```

#### 2. **admins**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id, nullable)
  -- nullable because admin might not be a player
- email (text, unique, not null)
- created_at (timestamp)
```

#### 3. **seasons**
```sql
- id (uuid, primary key)
- name (text, not null) -- e.g., "Summer 2024"
- start_date (date, not null)
- end_date (date, nullable) -- null means active season
- is_active (boolean, default true)
- wildcards_per_player (integer, default 2)
- playoff_third_place_enabled (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)
- status (enum: 'active', 'playoffs', 'completed')
```

#### 4. **ladder_positions**
```sql
- id (uuid, primary key)
- season_id (uuid, foreign key -> seasons.id)
- user_id (uuid, foreign key -> users.id)
- position (integer, not null)
- joined_at (timestamp, default now())
- is_active (boolean, default true) -- false if withdrawn
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(season_id, position) WHERE is_active = true
- UNIQUE(season_id, user_id) WHERE is_active = true
```

#### 5. **challenges**
```sql
- id (uuid, primary key)
- season_id (uuid, foreign key -> seasons.id)
- challenger_id (uuid, foreign key -> users.id)
- challenged_id (uuid, foreign key -> users.id)
- is_wildcard (boolean, default false)
- status (enum: 'pending', 'accepted', 'withdrawn', 'forfeited', 'completed', 'cancelled')
- proposed_date (timestamp)
- proposed_location (text)
- accepted_date (timestamp, nullable)
- accepted_location (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- forfeited_at (timestamp, nullable)
- completed_at (timestamp, nullable)
```

#### 6. **challenge_negotiations**
```sql
- id (uuid, primary key)
- challenge_id (uuid, foreign key -> challenges.id)
- proposed_by_user_id (uuid, foreign key -> users.id)
- proposed_date (timestamp)
- proposed_location (text)
- created_at (timestamp)
```

#### 7. **matches**
```sql
- id (uuid, primary key)
- challenge_id (uuid, foreign key -> challenges.id, unique)
- season_id (uuid, foreign key -> seasons.id)
- player1_id (uuid, foreign key -> users.id)
- player2_id (uuid, foreign key -> users.id)
- match_type (enum: 'challenge', 'semifinal', 'final', 'third_place')
- match_date (timestamp)
- location (text)
-
- -- Scoring
- set1_player1_score (integer)
- set1_player2_score (integer)
- set2_player1_score (integer)
- set2_player2_score (integer)
- set3_player1_score (integer, nullable)
- set3_player2_score (integer, nullable)
- final_set_type (enum: 'tiebreak', 'full_set', nullable)
-
- winner_id (uuid, foreign key -> users.id, nullable)
- submitted_by_user_id (uuid, foreign key -> users.id, nullable)
- is_disputed (boolean, default false)
- disputed_by_user_id (uuid, foreign key -> users.id, nullable)
- dispute_resolved_by_admin_id (uuid, foreign key -> admins.id, nullable)
-
- created_at (timestamp)
- updated_at (timestamp)
- completed_at (timestamp, nullable)
```

#### 8. **wildcard_usage**
```sql
- id (uuid, primary key)
- season_id (uuid, foreign key -> seasons.id)
- user_id (uuid, foreign key -> users.id)
- challenge_id (uuid, foreign key -> challenges.id)
- used_at (timestamp, default now())
- UNIQUE(season_id, user_id, challenge_id)
```

#### 9. **ladder_history**
```sql
- id (uuid, primary key)
- season_id (uuid, foreign key -> seasons.id)
- user_id (uuid, foreign key -> users.id)
- previous_position (integer)
- new_position (integer)
- match_id (uuid, foreign key -> matches.id, nullable)
- change_reason (enum: 'match_result', 'player_joined', 'player_withdrew', 'admin_adjustment')
- created_at (timestamp)
```

#### 10. **notifications**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- type (enum: 'challenge_received', 'challenge_accepted', 'challenge_counter_proposal',
        'match_reminder', 'forfeit_warning', 'score_submitted', 'score_disputed', 'season_ended')
- title (text)
- message (text)
- is_read (boolean, default false)
- email_sent (boolean, default false)
- created_at (timestamp)
- related_challenge_id (uuid, foreign key -> challenges.id, nullable)
- related_match_id (uuid, foreign key -> matches.id, nullable)
```

#### 11. **player_stats**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- season_id (uuid, foreign key -> seasons.id, nullable) -- null for lifetime stats
-
- matches_played (integer, default 0)
- matches_won (integer, default 0)
- matches_lost (integer, default 0)
- current_win_streak (integer, default 0)
- longest_win_streak (integer, default 0)
- current_loss_streak (integer, default 0)
- longest_loss_streak (integer, default 0)
-
- challenges_initiated (integer, default 0)
- challenges_won (integer, default 0)
- challenges_defended (integer, default 0)
- wildcards_used (integer, default 0)
-
- highest_position (integer, nullable)
- lowest_position (integer, nullable)
- biggest_position_gain (integer, default 0)
- final_position (integer, nullable)
-
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(user_id, season_id)
```

#### 12. **head_to_head_stats**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- opponent_id (uuid, foreign key -> users.id)
- season_id (uuid, foreign key -> seasons.id, nullable) -- null for lifetime
- matches_played (integer, default 0)
- wins (integer, default 0)
- losses (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(user_id, opponent_id, season_id)
```

---

## Feature Breakdown

### Phase 1: Core Foundation (Weeks 1-3)

#### 1.1 Authentication & User Management
- [ ] User signup (name, email, WhatsApp, password)
- [ ] User login
- [ ] Password reset via email
- [ ] User profile page (view/edit details)
- [ ] Admin authentication

#### 1.2 Admin Panel - Basic
- [ ] Admin dashboard
- [ ] View all users
- [ ] Create/manage seasons
- [ ] Set season wildcards count
- [ ] Add players to ladder (set initial position)
- [ ] Adjust ladder positions manually
- [ ] Mark players as inactive/withdrawn

#### 1.3 Ladder Display
- [ ] View current season ladder
- [ ] Show player positions, names
- [ ] Show which players are locked (in active challenge)
- [ ] Show wildcard usage per player
- [ ] Refresh functionality (pull-to-refresh + button)

### Phase 2: Challenge System (Weeks 4-6)

#### 2.1 Creating Challenges
- [ ] Challenge players within 2 positions above
- [ ] Wildcard challenge (any player)
- [ ] Propose date, time, location
- [ ] Validate: player not already in active challenge
- [ ] Validate: challenger has wildcards available (if wildcard challenge)
- [ ] Lock both players from other challenges

#### 2.2 Challenge Negotiation
- [ ] Challenged player receives email notification
- [ ] Accept challenge
- [ ] Counter-propose date/time/location
- [ ] Negotiation history tracking
- [ ] Challenger can withdraw at any time

#### 2.3 Challenge Management
- [ ] View all active challenges
- [ ] View challenge history
- [ ] Auto-forfeit after 2 weeks (in favor of challenger)
- [ ] 10-day warning notification
- [ ] Admin can cancel challenges

### Phase 3: Match & Scoring (Weeks 7-8)

#### 3.1 Match Results
- [ ] Either player can enter score
- [ ] Score entry form:
  - Set 1: Player 1 score, Player 2 score
  - Set 2: Player 1 score, Player 2 score
  - Final set type (if needed): Tiebreak / Full Set
  - Set 3: Score (if applicable)
- [ ] Calculate winner
- [ ] Automatic ladder position update
- [ ] Both players notified of result

#### 3.2 Score Disputes
- [ ] Either player can dispute a submitted score
- [ ] Match status: "Disputed"
- [ ] Admin receives notification
- [ ] Admin can view both perspectives
- [ ] Admin confirms or reverses result
- [ ] If reversed, ladder positions roll back

#### 3.3 Match History
- [ ] View all completed matches
- [ ] Filter by player, season
- [ ] Show detailed scores
- [ ] Show position changes

### Phase 4: Notifications (Week 9)

#### 4.1 Email Notifications (via Resend)
- [ ] Challenge received
- [ ] Challenge accepted
- [ ] Challenge counter-proposal
- [ ] Match reminder (day before)
- [ ] 10-day forfeit warning
- [ ] Score submitted
- [ ] Score disputed
- [ ] Admin actions

#### 4.2 WhatsApp Integration
- [ ] Generate formatted WhatsApp message for challenges
- [ ] Copy-to-clipboard functionality
- [ ] WhatsApp share link (mobile)

#### 4.3 In-App Notifications
- [ ] Notification center
- [ ] Unread notification count
- [ ] Mark as read
- [ ] Notification history

### Phase 5: Playoffs & Season End (Week 10)

#### 5.1 Season Transition
- [ ] Admin can end season (move to playoffs)
- [ ] Cancel all pending challenges
- [ ] Lock ladder positions

#### 5.2 Playoff Generation
- [ ] Generate semi-finals (1 vs 4, 2 vs 3)
- [ ] Admin can schedule dates/locations
- [ ] Generate final (winners of semis)
- [ ] Optional: 3rd place playoff
- [ ] Score entry for playoff matches
- [ ] Crown champion

#### 5.3 Season Completion
- [ ] Archive completed season
- [ ] Finalize all stats
- [ ] Display season results
- [ ] Allow viewing past seasons

### Phase 6: Statistics & Analytics (Weeks 11-12)

#### 6.1 Personal Stats
- [ ] Overall record (W-L)
- [ ] Win streaks (current & longest)
- [ ] Challenges initiated vs defended
- [ ] Wildcard usage
- [ ] Position progression graph
- [ ] Highest/lowest position
- [ ] Biggest leap
- [ ] Final positions per season

#### 6.2 Head-to-Head
- [ ] Nemesis player (most losses against)
- [ ] Favorite opponent (most wins against)
- [ ] Head-to-head record grid

#### 6.3 Leaderboards
- [ ] Most wins (season & lifetime)
- [ ] Longest win streak
- [ ] Most challenges initiated
- [ ] Biggest position gains

### Phase 7: Polish & Testing (Week 13)

- [ ] Mobile optimization
- [ ] Progressive Web App (PWA) setup
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Cross-browser testing
- [ ] Performance optimization

---

## Application Architecture

### Directory Structure

```
singles-ladder/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (ladder view)
│   │   │   ├── challenges/
│   │   │   ├── matches/
│   │   │   ├── stats/
│   │   │   ├── profile/
│   │   │   └── notifications/
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── seasons/
│   │   │   ├── users/
│   │   │   ├── disputes/
│   │   │   └── playoffs/
│   │   ├── api/
│   │   │   ├── challenges/
│   │   │   ├── matches/
│   │   │   ├── notifications/
│   │   │   ├── ladder/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── ladder/
│   │   ├── challenges/
│   │   ├── matches/
│   │   ├── stats/
│   │   └── admin/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── utils/
│   │   │   ├── ladder.ts (position calculations)
│   │   │   ├── match.ts (score calculations)
│   │   │   ├── notifications.ts
│   │   │   └── date.ts
│   │   ├── validations/
│   │   │   └── schemas.ts (Zod schemas)
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useLadder.ts
│   │   ├── useChallenges.ts
│   │   └── useNotifications.ts
│   └── types/
│       └── index.ts
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Key Architectural Patterns

#### 1. Server Components & Server Actions
- Use Next.js Server Components for data fetching
- Server Actions for mutations (create challenge, submit score)
- Client Components only where interactivity needed

#### 2. Supabase Integration
- Row Level Security (RLS) policies for data access
- Server-side client for API routes
- Client-side client for client components
- Database functions for complex operations (ladder reordering)

#### 3. Type Safety
- Generate TypeScript types from Supabase schema
- Zod schemas for form validation
- Shared types across frontend/backend

#### 4. Notification System
- Queue-based approach using database table
- Cron job (Vercel Cron or Supabase Edge Functions) processes queue
- Resend API for email delivery
- Track sent status to avoid duplicates

---

## User Flows

### 1. New Player Signs Up & Joins Ladder

```
1. User visits site → Signup page
2. Fills form (name, email, WhatsApp, password)
3. Creates account (Supabase Auth)
4. Redirected to "Waiting for Admin" page
5. Admin receives notification
6. Admin assigns initial ladder position
7. User can now view ladder and create challenges
```

### 2. Player Creates Challenge

```
1. View ladder → Click "Challenge" next to eligible player
2. Select type: Normal (within 2 positions) or Wildcard
3. Propose date, time, location
4. Submit challenge
5. Both players locked
6. Challenged player receives email + in-app notification
7. Challenged player accepts OR counter-proposes
8. If counter-proposal: negotiation continues
9. Once accepted: Challenge status = "accepted", awaiting score
```

### 3. Match Result Submission

```
1. Either player goes to active matches
2. Clicks "Submit Score"
3. Enters Set 1 & Set 2 scores
4. If needed: selects final set type, enters Set 3
5. System calculates winner
6. If challenger won:
   a. Challenger moves to position above challenged
   b. Challenged player and everyone between shifts down
7. If challenger lost:
   a. No position change
8. Both players unlocked
9. Challenge marked "completed"
10. Both players notified
11. Stats updated
```

### 4. Admin Resolves Score Dispute

```
1. Player disputes submitted score
2. Admin receives notification
3. Admin views match details, both player perspectives
4. Admin decides: Confirm original OR Enter correct score
5. If score changed:
   a. Ladder positions recalculated
   b. Original ladder update reversed
   c. New ladder update applied
6. Both players notified of resolution
```

### 5. Season Ends & Playoffs Begin

```
1. Admin clicks "End Regular Season"
2. All pending challenges cancelled (no penalty)
3. Ladder locked
4. System generates playoffs:
   - Semi 1: Position 1 vs Position 4
   - Semi 2: Position 2 vs Position 3
5. Admin schedules playoff matches
6. Winners advance to Final
7. Optional: Losers play 3rd place match
8. Admin submits final scores
9. Champion crowned
10. Season archived, stats finalized
```

---

## Notification Strategy

### Email Templates (Resend)

1. **Challenge Received**
   - Subject: "🎾 You've been challenged by [Name]!"
   - Content: Player name, proposed date/location, accept/counter links

2. **Challenge Accepted**
   - Subject: "✅ [Name] accepted your challenge"
   - Content: Confirmed date/location, good luck message

3. **Counter Proposal**
   - Subject: "📅 [Name] proposed a new time for your match"
   - Content: New date/location, accept/counter links

4. **10-Day Forfeit Warning**
   - Subject: "⚠️ Match forfeit warning - 4 days remaining"
   - Content: Reminder to schedule, deadline, consequences

5. **Match Forfeited**
   - Subject: "Match forfeited - [Winner] moves up the ladder"
   - Content: Explanation, new positions

6. **Score Submitted**
   - Subject: "🏆 Match result submitted"
   - Content: Score details, new positions, dispute option

7. **Score Disputed**
   - Subject: "⚠️ [Name] disputed the match score"
   - Content: Admin reviewing, expect resolution soon

8. **Season Ended**
   - Subject: "🏁 [Season Name] has ended - Playoffs begin!"
   - Content: Final standings, playoff matchups

### WhatsApp Message Format

```
🎾 Tennis Ladder Challenge

Hi [Name]!

I'd like to challenge you to a match:
📅 Date: [Proposed Date]
📍 Location: [Proposed Location]

Accept or propose a new time here:
[Link to app]

Good luck! 🎾
- [Challenger Name]
```

### In-App Notifications

- Bell icon with unread count
- Dropdown with latest 5 notifications
- Click to navigate to relevant page
- "See All" link to notification center

---

## Security Considerations

### 1. Authentication
- Supabase Auth handles password hashing (bcrypt)
- JWT tokens for session management
- Password reset via secure email links (Supabase Magic Links)

### 2. Authorization
- Row Level Security (RLS) policies:
  - Users can only update own profile
  - Only admins can modify seasons, assign positions
  - Players can only submit scores for their own matches
  - Admins can view all data

### 3. Data Validation
- Server-side validation for all inputs
- Zod schemas enforce data integrity
- Business logic validation (e.g., can't challenge if locked)

### 4. Rate Limiting
- Vercel Edge Middleware for API route protection
- Prevent spam challenges, excessive API calls

### 5. SQL Injection Prevention
- Supabase parameterized queries
- Never concatenate user input into SQL

---

## Timeline & Estimates

### Phase 1: Core Foundation (3 weeks)
- Week 1: Project setup, auth, database schema
- Week 2: Admin panel basics, season management
- Week 3: Ladder display, player management

### Phase 2: Challenge System (3 weeks)
- Week 4: Challenge creation, validation
- Week 5: Challenge negotiation, acceptance
- Week 6: Challenge lifecycle, forfeit system

### Phase 3: Match & Scoring (2 weeks)
- Week 7: Score entry, winner calculation
- Week 8: Ladder updates, dispute system

### Phase 4: Notifications (1 week)
- Week 9: Email integration, WhatsApp formatting, in-app notifications

### Phase 5: Playoffs (1 week)
- Week 10: Playoff generation, season end flow

### Phase 6: Statistics (2 weeks)
- Week 11: Personal stats, head-to-head
- Week 12: Leaderboards, analytics

### Phase 7: Polish (1 week)
- Week 13: Mobile optimization, PWA, testing

**Total Estimated Timeline: 13 weeks (~3 months)**

### Team Size Assumption
- 1 Full-stack developer working full-time

### Velocity Adjustments
- Part-time (20 hrs/week): Double timeline to 6 months
- 2 developers: Reduce to 8-9 weeks with proper coordination

---

## Future Enhancements (Post-MVP)

### Phase 8+: Nice-to-Have Features

1. **Mobile Native Apps**
   - React Native or Flutter
   - Push notifications
   - Native WhatsApp integration

2. **Advanced Stats**
   - Match analytics (sets won/lost, tiebreak performance)
   - Performance trends over time
   - Elo rating system

3. **Social Features**
   - Player profiles with photos
   - Match comments/chat
   - Photo uploads for match results
   - Club news feed

4. **Multi-Club Support**
   - Multiple clubs per installation
   - Cross-club challenges
   - Club vs club leagues

5. **Scheduling Enhancements**
   - Calendar integration (Google, Apple)
   - Court booking integration
   - Weather API integration

6. **Gamification**
   - Achievements/badges
   - Player of the month
   - Milestone celebrations

7. **Payments**
   - Stripe integration for membership fees
   - Match fees for court bookings

8. **Advanced Admin Tools**
   - Analytics dashboard
   - Export data (CSV, PDF reports)
   - Custom season formats (divisions, groups)

9. **Accessibility**
   - Dark mode
   - Font size customization
   - Screen reader optimization

10. **Performance**
    - Real-time updates (Supabase Realtime)
    - Optimistic UI updates
    - Offline support (PWA)

---

## Getting Started - Next Steps

### Immediate Actions

1. **Environment Setup**
   - [ ] Create GitHub repository
   - [ ] Set up Vercel project
   - [ ] Create Supabase project
   - [ ] Set up Resend account
   - [ ] Configure environment variables

2. **Project Initialization**
   - [ ] Initialize Next.js project
   - [ ] Install dependencies
   - [ ] Configure Tailwind CSS
   - [ ] Set up ESLint/Prettier

3. **Database Setup**
   - [ ] Create Supabase tables (run migrations)
   - [ ] Set up RLS policies
   - [ ] Create database functions
   - [ ] Seed initial data (test season, admin user)

4. **Authentication**
   - [ ] Configure Supabase Auth
   - [ ] Create login/signup pages
   - [ ] Set up password reset flow
   - [ ] Test auth flow

### First Milestone: Working Ladder (End of Week 3)

**Deliverables:**
- Users can sign up and log in
- Admin can create a season
- Admin can add players to ladder at specific positions
- Players can view the current ladder
- Basic responsive design

**Success Criteria:**
- 5 test users can be added to ladder
- Ladder displays correctly on mobile and desktop
- Positions update when admin makes changes

---

## Key Technical Decisions

### 1. Ladder Position Updates

Use PostgreSQL function for atomic ladder updates:

```sql
CREATE OR REPLACE FUNCTION update_ladder_positions(
  p_season_id UUID,
  p_winner_id UUID,
  p_loser_id UUID
)
RETURNS void AS $$
BEGIN
  -- Implementation handles position swaps and shifts
  -- Ensures atomicity and consistency
END;
$$ LANGUAGE plpgsql;
```

### 2. Challenge Locking

- Use database constraints to prevent concurrent challenges
- Check in application layer before allowing challenge creation
- Clear lock only when challenge is completed/withdrawn/forfeited

### 3. Forfeit System

- Vercel Cron Job (runs daily at 9 AM):
  - Check all accepted challenges > 10 days old → send warning
  - Check all accepted challenges > 14 days old → auto-forfeit
  - Update ladder positions
  - Send notifications

### 4. Email Queue

- Insert notification records instead of sending immediately
- Separate process (cron/edge function) sends emails
- Retry failed sends with exponential backoff
- Track sent status to avoid duplicates

### 5. Stats Calculation

- Update stats immediately after match completion
- Use database triggers for consistency
- Separate table for season stats vs lifetime stats
- Recalculate on admin dispute resolution

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance with many users | High | Proper indexing, query optimization, consider caching |
| Email delivery failures | Medium | Queue system with retries, fallback to in-app only |
| Concurrent ladder updates (race conditions) | High | Database transactions, row-level locking |
| Mobile performance issues | Medium | Lazy loading, code splitting, image optimization |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| User adoption | High | Simple onboarding, mobile-first design |
| Admin overhead for disputes | Medium | Clear guidelines, minimal disputes expected |
| Seasonal engagement drop-off | Medium | Stats/achievements to maintain interest |

---

## Success Metrics

### MVP Success Criteria

- 20+ active players in first season
- 50+ challenges created
- <5% dispute rate
- 90%+ mobile usage
- <2 second page load time on 4G

### Long-term KPIs

- Active users per season
- Challenges per player per season
- Match completion rate (accepted → scored)
- User retention season-over-season
- Net Promoter Score (NPS)

---

## Questions & Clarifications

Before development begins, confirm:

1. **Branding**: Club name, colors, logo?
2. **Domain**: Do you have a domain name?
3. **Launch timeline**: Hard deadline or flexible?
4. **Beta testing**: How many users for initial testing?
5. **Budget**: Any constraints on infrastructure costs (Supabase/Vercel tiers)?

---

## Conclusion

This comprehensive plan provides a roadmap for building a fully-featured tennis ladder web application. The phased approach ensures early delivery of core functionality while allowing for iterative improvements.

**Recommended Approach:**
1. Start with Phase 1-3 (MVP: 8 weeks)
2. Beta test with 10-15 users
3. Gather feedback
4. Implement Phases 4-7 based on priorities
5. Launch to full club

The architecture is scalable, maintainable, and positions the app for future enhancements including native mobile apps and advanced features.

Ready to begin implementation? Let's start with environment setup and database schema creation!
