# Tennis Singles Ladder - AI Development Context

## Project Overview

**Tennis Singles Ladder** is a comprehensive web application for managing tennis club ladder competitions. Players can challenge opponents, schedule matches, submit scores, and track statistics across seasons. The app features automated ladder updates, email notifications, admin tools, and a complete dispute resolution system.

**Status**: Production-ready, actively deployed
**Production URL**: https://singles-ladder.vercel.app
**Tech Stack**: Next.js 15 + TypeScript + Supabase + Tailwind CSS

---

## Quick Reference

### Essential Links
- **Production**: https://singles-ladder.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/cgvertskdkebxukrehyn
- **Vercel Dashboard**: https://vercel.com/bestjon-byte/singles-ladder
- **GitHub**: https://github.com/bestjon-byte/Singles-Ladder

### Admin Account
- **Email**: best.jon@gmail.com
- **Role**: Super admin (manage users, seasons, disputes)

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cgvertskdkebxukrehyn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmVydHNrZGtlYnh1a3JlaHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTgzMzcsImV4cCI6MjA3ODg3NDMzN30.0hB-hZWLLL41B_pxhAtMumD5VPyypravP3uTFvDa9qg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmVydHNrZGtlYnh1a3JlaHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI5ODMzNywiZXhwIjoyMDc4ODc0MzM3fQ.staJgXdn-Q7EzfIpOnIQmJUDjB49EDMdFQ6s-DhB15s

# Email (Resend)
RESEND_API_KEY=[your-key-from-resend-dashboard]
FROM_EMAIL=ladder@jlbweb.co.uk

# Application URL
NEXT_PUBLIC_APP_URL=https://singles-ladder.vercel.app  # production
NEXT_PUBLIC_APP_URL=http://localhost:3000              # development
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.6 (App Router with Server Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.0 with custom purple theme (#6f5ede)
- **UI Components**: Radix UI (Dialog, Dropdown Menu, Popover)
- **Icons**: Lucide React
- **State**: Zustand 4.4.7 for client state
- **Forms**: React Hook Form 7.49.3 + Zod 3.22.4

### Backend
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (email/password)
- **ORM**: None (direct SQL via Supabase client)
- **Security**: Row Level Security (RLS) policies
- **Email**: Resend 6.4.2 (verified domain: jlbweb.co.uk)

### Infrastructure
- **Hosting**: Vercel (automatic deployments from main)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **Email Service**: Resend

---

## Application Architecture

### Directory Structure
```
Singles-Ladder/
├── app/                          # Next.js App Router
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── reset-password/
│   │   ├── update-password/
│   │   └── signout/
│   ├── dashboard/               # Main user dashboard (ladder view)
│   ├── challenges/              # Challenge management
│   ├── matches/                 # Match viewing/scoring
│   ├── notifications/           # Notification center
│   ├── profile/                 # User profile & settings
│   ├── guide/                   # User guide
│   ├── admin/                   # Admin panel (protected)
│   │   ├── dashboard/          # Admin overview
│   │   ├── seasons/            # Season management
│   │   ├── users/              # User management
│   │   ├── disputes/           # Match dispute resolution
│   │   ├── ladder/             # Ladder position management
│   │   └── layout.tsx          # Admin role check wrapper
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
│
├── components/                  # React components (22 total)
│   ├── Navigation.tsx          # Main nav with notification bell
│   ├── UserGuideContent.tsx    # Help content
│   ├── admin/                  # 6 admin components
│   │   ├── AdminNav.tsx
│   │   ├── AdminToggle.tsx
│   │   ├── DisputedMatchCard.tsx
│   │   ├── LadderManagement.tsx
│   │   ├── SeasonsManagement.tsx
│   │   └── UsersTable.tsx
│   ├── challenges/             # 5 challenge components
│   │   ├── ChallengeCard.tsx
│   │   ├── ChallengesList.tsx
│   │   ├── CreateChallengeButton.tsx
│   │   ├── CreateChallengeModal.tsx
│   │   └── WhatsAppShareDialog.tsx
│   ├── ladder/
│   │   └── InteractiveLadder.tsx
│   ├── matches/                # 3 match components
│   │   ├── MatchCard.tsx
│   │   ├── MatchesHeader.tsx
│   │   └── MatchesList.tsx
│   ├── notifications/          # 3 notification components
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationCenter.tsx
│   │   └── NotificationItem.tsx
│   └── profile/                # 2 profile components
│       ├── PasswordChangeForm.tsx
│       └── ProfileForm.tsx
│
├── lib/                        # Core utilities & business logic
│   ├── supabase/
│   │   ├── server.ts          # Server-side Supabase client
│   │   └── client.ts          # Browser Supabase client
│   ├── actions/               # Server Actions (10 files)
│   │   ├── auth.ts           # Auth notifications
│   │   ├── challenges.ts     # Challenge CRUD (15KB)
│   │   ├── matches.ts        # Match scoring (12KB)
│   │   ├── disputes.ts       # Dispute resolution (12KB)
│   │   ├── notifications.ts  # Notification management
│   │   ├── profile.ts        # Profile updates
│   │   ├── admin-management.ts  # User admin promotion
│   │   ├── ladder-admin.ts   # Ladder position admin
│   │   ├── ladder-fix.ts     # Ladder repair utilities
│   │   └── seasons-admin.ts  # Season management
│   ├── services/              # Business logic services
│   │   ├── email.ts          # Email sending via Resend (7.8KB)
│   │   └── notifications.ts  # Notification creation (17KB)
│   ├── templates/
│   │   └── email-html.ts     # HTML email generators
│   ├── utils/
│   │   ├── admin.ts          # Admin role checks
│   │   └── whatsapp.ts       # WhatsApp integration
│   └── constants.ts          # App constants
│
├── types/
│   └── index.ts              # TypeScript type definitions
│
├── supabase/                  # Database & migrations
│   ├── migrations/           # 12 SQL migration files
│   │   ├── 20250116_001_initial_schema.sql
│   │   ├── 20250116_002_rls_policies.sql
│   │   ├── 20250116_003_functions.sql
│   │   └── [9 more migrations]
│   └── README.md
│
├── middleware.ts             # Session refresh middleware
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind theme
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

---

## Core Features

### 1. Authentication & User Management
- **Signup/Login**: Supabase Auth (email/password)
- **Password Reset**: Email-based reset flow
- **Auto Profile Creation**: Database trigger creates user profile on signup
- **Admin System**: Role-based access via `admins` table
- **User Preferences**: Email/WhatsApp notification toggles

### 2. Ladder System
- **Dynamic Positions**: Players ranked 1 (top) to N (bottom)
- **Challenge Rules**:
  - Can challenge up to 2 positions above (normal)
  - Can challenge anyone above with wildcard (limited per season)
  - Only one active challenge per player at a time
- **Position Updates**: Winner takes loser's position, others shift down
- **History Tracking**: All position changes logged in `ladder_history`

### 3. Challenge System
- **Create Challenge**: Propose date/location
- **Accept/Reject**: No negotiation (simplified workflow)
- **Wildcard Challenges**: Use wildcard to challenge >2 positions above
- **Player Locking**: Players locked while challenge is active
- **Status Tracking**: pending → accepted → completed
- **Withdrawal**: Can withdraw before match is played

### 4. Match Management
- **Score Format**: Best of 3 sets (standard tennis)
- **Third Set Options**: Full set or match tiebreak
- **Score Submission**: Either player can submit
- **Winner Calculation**: Automatic from set scores
- **Ladder Updates**: Automatic position changes on completion
- **Match History**: View all completed matches with scores

### 5. Dispute Resolution
- **Dispute Submission**: Either player can dispute a score
- **Admin Review**: Admin sees both player perspectives
- **Resolution**: Admin can correct score or confirm original
- **Ladder Rollback**: If winner changes, positions recalculated
- **Notifications**: Both players notified of resolution

### 6. Notification System
- **In-App Notifications**:
  - Bell icon with unread count
  - Dropdown with 5 most recent
  - Full notification center (/notifications)
  - Mark as read functionality
  - Auto-refresh every 30 seconds
- **Email Notifications**:
  - Sent via Resend API
  - HTML formatted emails
  - User can toggle on/off
  - Verified sender: ladder@jlbweb.co.uk
- **WhatsApp Integration**:
  - Generate formatted messages
  - Copy to clipboard or open WhatsApp
  - User can toggle on/off

### 7. Admin Panel
- **User Management**:
  - View all users
  - Promote/demote admins
  - View user statistics
- **Season Management**:
  - Create new seasons
  - Edit season details
  - End seasons (move to playoffs)
  - Set wildcard limits
- **Ladder Management**:
  - Add players at specific positions
  - Remove players from ladder
  - Manual position adjustments
- **Dispute Resolution**:
  - View disputed matches
  - See both player perspectives
  - Resolve with correct score
  - Automatic ladder rollback if needed

### 8. Statistics & Analytics
- **Player Stats**: Matches played, won, lost, win streaks
- **Challenge Stats**: Initiated, won, defended
- **Position Tracking**: Highest, lowest, biggest gain
- **Head-to-Head**: Performance vs specific opponents
- **Season vs Lifetime**: Separate stats tracking

---

## Database Schema

**Full details**: See `DATABASE_SCHEMA.md`

### Core Tables (12)
1. **users** - User profiles & preferences
2. **admins** - Admin role mapping
3. **seasons** - Competitive seasons
4. **ladder_positions** - Active ladder state
5. **challenges** - Challenge records
6. **challenge_negotiations** - *(NOT USED - feature removed)*
7. **matches** - Match results & scores
8. **wildcard_usage** - Wildcard consumption tracking
9. **ladder_history** - Position change audit log
10. **notifications** - In-app notification log
11. **player_stats** - Aggregate statistics
12. **head_to_head_stats** - Opponent-specific stats

### Key Database Functions
- `update_ladder_after_match()` - Atomic ladder position updates
- `add_player_to_ladder()` - Add player with position shifts
- `remove_player_from_ladder()` - Remove with soft delete
- `get_available_wildcards()` - Count remaining wildcards
- `can_challenge()` - Validate challenge eligibility
- `update_player_stats_after_match()` - Update stats
- `is_admin()` - Check admin status (used in RLS)

### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- Authenticated users (read ladder, challenges, matches)
- Challenge participants (update challenges, submit scores)
- Own data (read/update notifications, profile)
- Admins (full access to all tables)

---

## Key Architectural Patterns

### 1. Server Actions Over API Routes
- All backend logic in `/lib/actions/` as TypeScript server functions
- Uses Next.js Server Actions (`'use server'` directive)
- Direct database access with RLS security
- No traditional REST API - cleaner, type-safe approach

### 2. Row Level Security (RLS)
- Database-level access control
- Policies enforce who can SELECT, INSERT, UPDATE, DELETE
- `is_admin()` function used in policies
- Service role key bypasses RLS for system operations

### 3. Server vs Client Components
- **Server Components**: Data fetching, auth checks (default)
- **Client Components**: Interactivity, forms, state (`'use client'`)
- Minimizes client-side JavaScript
- Better performance and SEO

### 4. Service Client Pattern
- Separate Supabase client with service role key
- Used for system operations (notifications, stats updates)
- Bypasses RLS when needed
- Located in `/lib/services/`

### 5. Middleware for Session Management
- `middleware.ts` refreshes Supabase session on every request
- Handles cookie management
- Keeps users logged in
- Runs on all routes

### 6. Optimistic UI + Revalidation
- `revalidatePath()` after mutations
- Forces Next.js to re-fetch data
- No stale cache issues
- Most pages use `export const dynamic = 'force-dynamic'`

### 7. Email Queue Pattern
- Create notification in database first
- Send email asynchronously
- Track `email_sent` status
- Doesn't block user actions

---

## Development Workflow

### Local Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
# Open http://localhost:3000
```

### Making Changes

**Frontend Changes**:
- Server components: `app/**/page.tsx` (data fetching)
- Client components: `components/**/*.tsx` (interactivity)
- Use `'use client'` directive for client components

**Backend Changes**:
- Server actions: `lib/actions/**/*.ts`
- Always use `'use server'` directive
- Check admin authorization where needed
- Use `revalidatePath()` after mutations

**Database Changes**:
1. Create migration: `supabase/migrations/YYYYMMDD_###_description.sql`
2. Test locally (Supabase SQL Editor)
3. Apply to production (Supabase dashboard)
4. Update `DATABASE_SCHEMA.md` with changes

### Testing
- **Manual**: Test in browser at localhost:3000
- **Admin Features**: Create test admin account
- **Email**: Use Resend test mode or check Resend dashboard
- **Database**: Query Supabase SQL Editor to verify data

### Deployment
```bash
# Commit changes
git add .
git commit -m "Description"

# Push to main (auto-deploys to Vercel)
git push origin main

# Check deployment at Vercel dashboard
# Verify at https://singles-ladder.vercel.app
```

---

## Important Technical Details

### Authentication Flow
1. User signs up at `/auth/signup`
2. Supabase creates `auth.users` record
3. Database trigger (`handle_new_user()`) creates `users` profile
4. Admin receives notification
5. Admin adds user to ladder
6. User can now create challenges

### Admin Authorization
```typescript
// Server-side check
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
const { data: admin } = await supabase
  .from('admins')
  .select('id')
  .eq('user_id', user.id)
  .single()

if (!admin) {
  redirect('/dashboard')
}
```

### Ladder Position Logic
- **Position 1** = Top player
- **Higher number** = Lower rank
- **Challenger wins**: Takes challenged player's position
- **Challenged wins**: No position changes
- **Everyone between**: Shifts down by 1

**Example**:
```
Before: [1: Alice, 2: Bob, 3: Carol, 4: David, 5: Eve]
Eve challenges Bob (wildcard)
Eve wins
After:  [1: Alice, 2: Eve, 3: Bob, 4: Carol, 5: David]
```

### Wildcard System
- **Reserved** when challenge created (`challenges.is_wildcard = TRUE`)
- **Consumed** when match completed (row in `wildcard_usage`)
- **Refunded** if challenge withdrawn/rejected (no row in `wildcard_usage`)
- **Default**: 2 per player per season

### Email Notifications
```typescript
// Sent for:
- Challenge received
- Challenge accepted
- Challenge withdrawn
- Match score submitted
- Score disputed
- Admin actions (promote, demote)

// Using Resend:
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: process.env.FROM_EMAIL,
  to: user.email,
  subject: 'You\'ve been challenged!',
  html: generateEmailHtml(...)
})
```

---

## Common Tasks

### Add a New Admin
```sql
-- Run in Supabase SQL Editor
-- First get user_id from signup, then:
INSERT INTO admins (email, user_id)
SELECT email, id FROM auth.users WHERE email = 'new-admin@example.com';
```

### Create a Season (GUI)
1. Log in as admin
2. Navigate to `/admin/seasons`
3. Click "Create New Season"
4. Fill in: name, start date, wildcards allowed
5. Click "Create Season"

### Add Player to Ladder (GUI)
1. Go to `/admin/ladder`
2. Select user from dropdown
3. Enter position number
4. Click "Add to Ladder"
5. Players at/below shift down automatically

### View Database Directly
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select table to view/edit data
4. Or use SQL Editor for queries

### Check Logs
- **Vercel**: Vercel Dashboard → Project → Logs
- **Supabase**: Supabase Dashboard → Logs
- **Email**: Resend Dashboard → Logs

---

## Known Issues & Solutions

### Issue: RLS Policy Violations
**Symptoms**: "new row violates row-level security policy"
**Solution**: Use service role client for system operations
```typescript
import { createServiceClient } from '@/lib/supabase/service'
const supabase = createServiceClient() // bypasses RLS
```

### Issue: Stale Data After Mutation
**Symptoms**: UI doesn't update after action
**Solution**: Add `revalidatePath()` to server action
```typescript
'use server'
export async function updateSomething() {
  // ... mutation
  revalidatePath('/dashboard')
}
```

### Issue: Email Not Sending
**Symptoms**: Email notifications not received
**Solution**:
1. Check `RESEND_API_KEY` is set
2. Verify sender email is verified in Resend
3. Check user has `email_notifications_enabled = true`
4. Look for errors in Resend dashboard logs

### Issue: Wildcard Not Refunded
**Symptoms**: Wildcard consumed when challenge rejected
**Solution**: Wildcard only consumed on match completion
- Check `wildcard_usage` table - should be empty if rejected
- Wildcard reserved in `challenges.is_wildcard` but not consumed

---

## Configuration Files

### next.config.js
```javascript
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // For score submission with large data
    },
  },
}
```

### tailwind.config.ts
```typescript
theme: {
  extend: {
    colors: {
      primary: '#6f5ede', // Riccall Tennis Club purple
    },
  },
}
```

### middleware.ts
```typescript
// Refreshes Supabase session on every request
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

---

## Environment-Specific Configuration

### Development
- URL: http://localhost:3000
- Supabase: Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
- Email: Can use Resend test mode or real emails
- Auth redirects: Configured in Supabase dashboard

### Production
- URL: https://singles-ladder.vercel.app
- Supabase: Same project, production RLS policies active
- Email: Real emails via Resend
- Auth redirects: Must include production URL in Supabase

**Supabase URL Configuration** (CRITICAL for Auth):
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `https://singles-ladder.vercel.app`
3. Add Redirect URLs:
   - `https://singles-ladder.vercel.app/**`
   - `http://localhost:3000/**` (for dev)

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- All types defined in `/types/index.ts`
- Prefer interfaces over types for objects
- Use Zod for runtime validation

### Components
- One component per file
- Named exports preferred
- Props interface named `[Component]Props`
- Server components by default, add `'use client'` only when needed

### Server Actions
- File-level `'use server'` directive
- Always export async functions
- Return `{ success: boolean, error?: string }` pattern
- Call `revalidatePath()` after mutations

### Database Queries
- Use parameterized queries (Supabase handles this)
- Never concatenate user input into SQL
- Use RLS policies instead of manual auth checks
- Prefer database functions for complex operations

---

## Security Checklist

### Authentication
- ✅ Supabase Auth handles password hashing
- ✅ JWT tokens for sessions
- ✅ Email-based password reset
- ✅ Middleware refreshes sessions

### Authorization
- ✅ RLS policies on all tables
- ✅ Admin checks in protected routes
- ✅ Service client only for system operations
- ✅ No sensitive data in client-side code

### Data Validation
- ✅ Zod schemas for form validation
- ✅ Server-side validation in all actions
- ✅ Database constraints (CHECK, UNIQUE, FK)
- ✅ Type safety with TypeScript

### XSS/CSRF Protection
- ✅ Next.js escapes all rendered content
- ✅ Server Actions include CSRF protection
- ✅ No dangerouslySetInnerHTML used
- ✅ Content Security Policy headers

---

## Troubleshooting Guide

### "User not authorized" Error
1. Check if user is logged in: `supabase.auth.getUser()`
2. Verify RLS policies allow the operation
3. For admin actions, check `admins` table
4. Try using service client if it's a system operation

### Ladder Positions Not Updating
1. Check if `update_ladder_after_match()` was called
2. Query `ladder_history` to see if change was logged
3. Verify `is_active = TRUE` on positions
4. Check for race conditions (two updates at once)

### Notifications Not Appearing
1. Check `notifications` table in database
2. Verify RLS policy allows user to see their notifications
3. Check browser console for errors
4. Verify NotificationBell component is polling (30s interval)

### Email Not Sent
1. Check Resend API key is set in environment
2. Verify `FROM_EMAIL` is from verified domain
3. Check user has `email_notifications_enabled = true`
4. Look in Resend dashboard for delivery status
5. Check spam folder

---

## Performance Optimization

### Database
- Use indexes on foreign keys (already done)
- Avoid SELECT * - specify columns
- Use partial indexes for filtered queries
- Consider caching for ladder queries

### Frontend
- Server Components for data fetching
- Client Components only when needed
- Image optimization (next/image)
- Code splitting (dynamic imports)

### Caching
- `revalidatePath()` after mutations
- Most pages use `force-dynamic` to prevent stale data
- Consider adding Redis for frequently accessed data

---

## Future Enhancements

### Planned Features
- **Playoffs**: Semi-finals, finals, third-place matches
- **Advanced Stats**: Elo ratings, performance trends
- **Social Features**: Player photos, match comments
- **Mobile App**: React Native with push notifications
- **Calendar Integration**: Google Calendar, Apple Calendar
- **WhatsApp API**: Automatic WhatsApp notifications

### Technical Debt
- Add unit tests (Jest + React Testing Library)
- Add E2E tests (Playwright)
- Implement real-time updates (Supabase Realtime)
- Add error monitoring (Sentry)
- Implement rate limiting

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run type-check             # TypeScript check (if added)

# Git
git status
git log --oneline -10
git checkout -b feature-name

# Database (if Supabase CLI installed)
supabase status
supabase db push
supabase db dump -f backup.sql

# Vercel (if CLI installed)
vercel --prod
vercel logs
```

---

## Documentation Files

- **`claude.md`** (this file): AI development context
- **`DATABASE_SCHEMA.md`**: Complete database documentation
- **`USER_GUIDE.md`**: End-user guide for players
- **`README.md`**: Project overview & setup instructions
- **`supabase/README.md`**: Database migration instructions

---

## Session Notes

**Last Updated**: 2025-11-18
**Current Version**: 1.0 (Production)
**Recent Changes**:
- Comprehensive documentation overhaul
- Database schema fully documented
- All features production-ready
- Email notifications active
- Admin panel complete
- Dispute resolution implemented

**Implementation Status**:
- ✅ Phase 1: Core Foundation (Auth, Admin, Ladder)
- ✅ Phase 2: Challenge System
- ✅ Phase 3: Match & Scoring
- ✅ Phase 4: Notifications
- ⏳ Phase 5: Playoffs (framework ready, not activated)
- ⏳ Phase 6: Advanced Statistics (basic stats done)
- ⏳ Phase 7: Mobile Optimization (responsive, not PWA yet)

**Important Context**:
- Challenge negotiation was **removed** - challenges are accept/reject only
- `challenge_negotiations` table exists but is **NOT USED** in code
- All migrations applied to production database
- Email domain verified (jlbweb.co.uk)
- Admin account: best.jon@gmail.com
- Production URL: https://singles-ladder.vercel.app

---

## Getting Help

### For Development Issues
1. Check this file (`claude.md`) for context
2. Review `DATABASE_SCHEMA.md` for database questions
3. Check Supabase logs for database errors
4. Check Vercel logs for deployment issues
5. Review Resend dashboard for email issues

### For User Issues
- Direct users to `USER_GUIDE.md`
- Check `/guide` page in the app
- Admin can resolve via admin panel

### For Deployment Issues
- Check Vercel dashboard for build logs
- Verify environment variables are set
- Ensure Supabase is accessible
- Check DNS/domain configuration

---

**End of Development Context**

This file is maintained for AI-assisted development sessions and should be updated whenever significant changes are made to the application architecture, database schema, or key features.
