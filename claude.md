# Claude Development Context - Tennis Singles Ladder

This file contains essential context, variables, and information for AI-assisted development sessions.

---

## Project Overview

**Tennis Singles Ladder** - A mobile-optimized web application for managing tennis club ladders independently, featuring player challenges, automated ladder updates, match scheduling, playoffs, and comprehensive statistics tracking.

**Current Status:** Phase 1 - MOSTLY COMPLETE
- ✅ Authentication & User Management
- ✅ Admin Panel (full GUI)
- ✅ Ladder Display & Management
- ⏳ User Profile Page (remaining)

---

## Environment Variables

### Supabase Configuration

```bash
# Required for all environments (development, production)
NEXT_PUBLIC_SUPABASE_URL=https://cgvertskdkebxukrehyn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmVydHNrZGtlYnh1a3JlaHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTgzMzcsImV4cCI6MjA3ODg3NDMzN30.0hB-hZWLLL41B_pxhAtMumD5VPyypravP3uTFvDa9qg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmVydHNrZGtlYnh1a3JlaHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI5ODMzNywiZXhwIjoyMDc4ODc0MzM3fQ.staJgXdn-Q7EzfIpOnIQmJUDjB49EDMdFQ6s-DhB15s
```

### Application Configuration

```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (Vercel)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Email Service (To be configured - Phase 4)

```bash
# Resend API (not yet configured)
RESEND_API_KEY=
FROM_EMAIL=noreply@tennisladder.com
```

---

## Supabase Project Details

**Project URL:** https://supabase.com/dashboard/project/cgvertskdkebxukrehyn
**Project ID:** cgvertskdkebxukrehyn
**Region:** US (likely)

### Database Configuration

**Authentication:**
- Provider: Supabase Auth (Email/Password)
- Email Confirmation: DISABLED (for easier development)
- Auto-create user profiles via database trigger

**Row Level Security (RLS):** ENABLED on all tables
- Users can view their own data
- Admins have full access (checked via `is_admin()` function)

---

## Database Schema

### Core Tables

1. **users** - User profiles (auto-created via trigger)
   - id (uuid, references auth.users)
   - email, name, whatsapp_number
   - notification preferences
   - is_active status

2. **admins** - Admin users
   - user_id (references users.id, nullable)
   - email

3. **seasons** - Tennis seasons
   - name, start_date, end_date
   - is_active (only one active at a time)
   - wildcards_allowed (default: 2)
   - status (active/playoffs/completed)

4. **ladder_positions** - Player positions in ladder
   - season_id, user_id, position
   - is_active (for soft deletes)
   - Unique constraints on active positions

5. **challenges** - Challenge records
   - challenger_id, challenged_id
   - season_id, match_id
   - status, is_wildcard, proposed dates/times/locations

6. **challenge_negotiations** - Negotiation history
   - challenge_id, proposed_by
   - proposed_date, proposed_time, proposed_location

7. **matches** - Completed matches
   - challenge_id, winner_id, loser_id
   - scores (set1_winner, set1_loser, etc.)
   - final_set_type, is_disputed

8. **wildcard_usage** - Wildcard tracking
   - user_id, season_id, challenge_id
   - used_at timestamp

9. **ladder_history** - Historical ladder changes
   - season_id, user_id, match_id
   - old_position, new_position, change_type

10. **notifications** - Notification log
    - user_id, type, title, message
    - is_read, sent_via

11. **player_stats** - Player statistics
    - user_id, season_id
    - matches_played, wins, losses, etc.

12. **head_to_head_stats** - Head-to-head records
    - user_id, opponent_id, season_id
    - matches_played, wins, losses

### Key Database Functions

**`handle_new_user()`** - Trigger function (SECURITY DEFINER)
- Automatically creates user profile in `users` table when user signs up
- Bypasses RLS to allow profile creation
- Attached to `auth.users` table

**`is_admin()`** - Helper function
- Checks if current user is an admin
- Used in RLS policies

---

## Admin Account

**Email:** best.jon@gmail.com
**Setup:** Created via SQL in Supabase

### Creating Additional Admins

```sql
-- After user signs up, run in Supabase SQL Editor:
INSERT INTO admins (email, user_id)
SELECT email, id FROM auth.users WHERE email = 'new-admin@example.com';
```

---

## File Structure

```
Singles-Ladder/
├── app/
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   ├── reset-password/# Password reset
│   │   └── signout/       # Sign out
│   ├── dashboard/         # Main dashboard (ladder view)
│   │   └── page.tsx       # Server component - fetches ladder data
│   └── admin/             # Admin panel
│       ├── layout.tsx     # Admin layout with navigation
│       ├── page.tsx       # Admin dashboard (stats)
│       ├── users/         # View all users
│       ├── ladder/        # Manage ladder positions
│       └── seasons/       # Manage seasons
├── components/
│   ├── admin/
│   │   ├── LadderManagement.tsx    # Add/remove players
│   │   └── SeasonsManagement.tsx   # Create/manage seasons
│   └── ladder/
│       ├── LadderTable.tsx         # Pure presentation component
│       └── LadderView.tsx          # Client wrapper with refresh
├── lib/
│   ├── actions/           # Server actions
│   │   ├── ladder-admin.ts        # Add/remove players from ladder
│   │   └── seasons-admin.ts       # Create/activate seasons
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client (with cookies)
│   └── utils/
│       └── admin.ts               # isAdmin(), requireAdmin()
├── supabase/
│   └── migrations/
│       ├── 20250116_001_initial_schema.sql       # Tables, indexes
│       ├── 20250116_002_rls_policies.sql         # RLS policies
│       ├── 20250116_003_functions.sql            # Database functions
│       └── 20250116_005_auto_create_user_profile.sql  # User trigger
├── middleware.ts          # Supabase auth session refresh
├── .env.local             # Environment variables (gitignored)
├── PROJECT_PLAN.md        # Comprehensive implementation plan
└── claude.md              # This file
```

---

## Development Workflow

### Starting Development

```bash
npm run dev            # Start dev server at localhost:3000
npm run build          # Build for production
npm run lint           # Run ESLint
```

### Database Migrations

All migrations are in `supabase/migrations/` and have been applied to production.

To apply to a fresh Supabase project:
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order (001, 002, 003, 005)

### Making Changes

1. **Frontend Changes:**
   - Server components: `app/**/page.tsx` (for data fetching)
   - Client components: `components/**/*.tsx` (for interactivity)
   - Use `'use client'` directive for client components

2. **Backend Changes:**
   - Server actions: `lib/actions/**/*.ts`
   - Always use `'use server'` directive
   - Check admin authorization: `requireAdmin()` or manual check

3. **Database Changes:**
   - Create new migration file in `supabase/migrations/`
   - Apply via Supabase SQL Editor
   - Update RLS policies if needed

---

## Important Technical Details

### Authentication Flow

1. User signs up at `/auth/signup`
2. Supabase creates auth.users record
3. Database trigger automatically creates users profile
4. User can log in at `/auth/login`
5. Session managed via middleware (cookie refresh)

### Admin Authorization

Protected routes use `requireAdmin()`:
```typescript
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

### Ladder Position Management

**Adding Players:**
- Shifts existing players down from target position
- Processes positions in reverse order to avoid conflicts
- Revalidates paths after mutation

**Removing Players:**
- Marks position as `is_active = false`
- Shifts players above down to fill gap
- Preserves history for statistics

### Key Architectural Decisions

1. **Server Components by Default:** Fetch data server-side for better performance
2. **Client Components for Interactivity:** Forms, buttons, user interactions
3. **Server Actions for Mutations:** Secure backend operations with auth checks
4. **RLS for Security:** Database-level access control
5. **Soft Deletes:** Mark records inactive rather than deleting (preserves history)

---

## Common Tasks

### Add a New Admin

```sql
INSERT INTO admins (email, user_id)
SELECT email, id FROM auth.users WHERE email = 'user@example.com';
```

### Create a Season (GUI)

1. Log in as admin
2. Go to `/admin/seasons`
3. Click "Create New Season"
4. Fill in: name, start date, wildcards allowed
5. Click "Create Season"
6. Activate via "Activate" button

### Add Players to Ladder (GUI)

1. Go to `/admin/ladder`
2. Select user from dropdown
3. Enter position number
4. Click "Add to Ladder"
5. Players at/below that position shift down

### Trigger Vercel Deployment

```bash
git push origin main         # Automatic deployment
# OR redeploy from Vercel dashboard
```

---

## Known Issues & Fixes

### Issue: Vercel Build Fails with Font Error
**Fix:** Removed Google Font import, using system fonts
- Changed in `app/layout.tsx`
- Uses `className="font-sans"` instead of Inter font

### Issue: RLS Policy Violation on Signup
**Fix:** Database trigger with SECURITY DEFINER
- `handle_new_user()` bypasses RLS
- Automatically creates user profile
- Disable email confirmation in Supabase settings

### Issue: SQL Syntax Error with Partial Unique Constraints
**Fix:** Use CREATE UNIQUE INDEX with WHERE clause
```sql
-- Don't use table-level constraint with WHERE
-- Do use separate index:
CREATE UNIQUE INDEX unique_active_position
ON ladder_positions(season_id, position)
WHERE is_active = TRUE;
```

### Issue: Prerender Error on Auth Pages
**Fix:** Add `export const dynamic = 'force-dynamic'`
- Prevents static generation of pages that need runtime env vars

---

## Deployment

### Vercel Configuration

**Project:** Singles-Ladder
**GitHub Repo:** bestjon-byte/Singles-Ladder
**Production Branch:** main

**Environment Variables (set in Vercel dashboard):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Deployment Process

1. Merge PR to main
2. Vercel automatically builds and deploys
3. Check build logs for errors
4. Verify deployment at production URL

---

## Next Steps (Phase 2)

### Challenge System Implementation

**Priority Features:**
1. Challenge creation (normal + wildcard)
2. Challenge validation (position rules, player locks)
3. Challenge negotiation (date/time/location proposals)
4. Challenge acceptance/rejection
5. Auto-forfeit after 2 weeks

**Required Files:**
- `app/challenges/page.tsx` - Challenge list
- `app/challenges/create/page.tsx` - Create challenge form
- `components/challenges/ChallengeCard.tsx` - Challenge display
- `lib/actions/challenges.ts` - Challenge server actions
- Update dashboard to show active challenges

**Database Usage:**
- `challenges` table
- `challenge_negotiations` table
- `wildcard_usage` table
- Update `ladder_positions` to track locked players

---

## Helpful Commands

```bash
# Git
git status
git log --oneline -10
git checkout -b feature-branch-name

# Development
npm run dev
npm run build
npm run lint

# Supabase (if CLI installed)
supabase status
supabase db push

# Vercel (if CLI installed)
vercel --prod
vercel logs
```

---

## Contact & Resources

**GitHub Repo:** https://github.com/bestjon-byte/Singles-Ladder
**Supabase Dashboard:** https://supabase.com/dashboard/project/cgvertskdkebxukrehyn
**Vercel Dashboard:** https://vercel.com/bestjon-byte/singles-ladder

**Key Documentation:**
- Next.js 14: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

## Session Notes

**Last Updated:** 2025-01-16
**Phase:** 1 - Core Foundation (MOSTLY COMPLETE)
**Recent Work:** Admin Panel implementation with full GUI management

**Important Context for Future Sessions:**
- All database migrations are applied to production
- Admin panel is fully functional (create seasons, manage ladder, view users)
- User authentication working with auto-profile creation
- Main branch has all Phase 1 features except user profile page
- Next priority is Phase 2: Challenge System
