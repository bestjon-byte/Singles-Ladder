# Phase 4: Notifications - Setup Guide

This guide will help you complete the setup for Phase 4: Notifications system.

## Overview

Phase 4 implements a comprehensive notification system including:
- ✅ Email notifications via Resend
- ✅ In-app notifications with real-time UI
- ✅ WhatsApp message sharing
- ✅ Notification center with full history
- ✅ Notification bell with dropdown in navigation

## Prerequisites

- Phase 1-3 completed
- Resend account (for email notifications)
- Supabase project with database access

## Setup Steps

### 1. Install Dependencies ✅ DONE

All required dependencies have been installed:
```bash
npm install resend @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-dialog
```

### 2. Configure Resend (Email Service)

#### A. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

#### B. Get API Key

1. Navigate to API Keys section in Resend dashboard
2. Click "Create API Key"
3. Give it a name (e.g., "Tennis Ladder Production")
4. Copy the API key (it starts with `re_`)

#### C. Configure Domain (Optional but Recommended)

**For Development:**
- You can use Resend's test domain: `onboarding@resend.dev`
- This has a limit of 100 emails/day

**For Production:**
1. Add your domain in Resend dashboard
2. Add DNS records as instructed
3. Verify domain
4. Use your verified email (e.g., `noreply@yourdomain.com`)

#### D. Add Environment Variables

**Local Development (.env.local):**
```bash
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=onboarding@resend.dev  # or your verified email
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `RESEND_API_KEY`: Your Resend API key
   - `FROM_EMAIL`: Your verified sender email

### 3. Apply Database Migration

The RLS policies for notifications need to be applied to your database.

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to SQL Editor
4. Run the migration file: `supabase/migrations/20250117_001_notifications_rls.sql`
5. Click "Run"

**Option B: Via Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db push
```

**What this migration does:**
- Enables RLS on notifications table
- Allows users to view only their own notifications
- Allows users to update/delete their own notifications
- Allows admins to view all notifications (for support)

### 4. Test the Implementation

#### A. Test Email Notifications

1. Create a challenge as one user
2. Check if the challenged user receives an email
3. Accept the challenge
4. Check if the challenger receives an acceptance email

**Debugging Emails:**
- Check Resend dashboard for sent emails
- Check browser console for any errors
- Check server logs for notification errors
- Verify environment variables are set correctly

#### B. Test In-App Notifications

1. Log in as a user
2. Look for the bell icon in navigation (should show a red badge if unread)
3. Click the bell icon to see notifications dropdown
4. Click "View all notifications" to see full history
5. Test "Mark all as read" functionality

#### C. Test WhatsApp Sharing

1. Go to an active challenge
2. Click "Share via WhatsApp" button
3. Verify the message preview looks correct
4. Test "Copy Message" button
5. Test "Open WhatsApp" button (opens WhatsApp Web or app)

### 5. Verify All Notification Triggers

Make sure notifications are sent for all these events:

- [x] Challenge received (when someone challenges you)
- [x] Challenge accepted (when opponent accepts your challenge)
- [x] Challenge rejected/declined (when opponent rejects)
- [x] Challenge withdrawn (when challenger withdraws)
- [x] Match score submitted (both players notified)

### 6. User Experience Checklist

- [ ] Notification bell shows unread count
- [ ] Notifications are marked as read when clicked
- [ ] Clicking a notification navigates to relevant page
- [ ] Email notifications are well-formatted and professional
- [ ] WhatsApp messages are properly formatted
- [ ] Mobile responsive design works on all screens
- [ ] Dark mode support (if applicable)

## Troubleshooting

### Emails Not Sending

**Problem:** Users not receiving emails

**Solutions:**
1. Check Resend API key is set: `echo $RESEND_API_KEY`
2. Check Resend dashboard for error logs
3. Verify sender email is verified (if using custom domain)
4. Check user has `email_notifications_enabled = true` in database
5. Look for errors in server logs (they won't fail the operation but will be logged)

### Notifications Not Appearing

**Problem:** In-app notifications not showing

**Solutions:**
1. Check browser console for JavaScript errors
2. Verify user is logged in
3. Check database - run: `SELECT * FROM notifications WHERE user_id = 'user-id'`
4. Verify RLS policies are applied correctly
5. Check notification service logs

### WhatsApp Link Not Working

**Problem:** WhatsApp button doesn't open WhatsApp

**Solutions:**
1. On desktop, it opens WhatsApp Web (user must be logged in)
2. On mobile, it should open the WhatsApp app
3. Try the "Copy Message" button as a fallback
4. Check browser console for errors

### Build Errors

**Problem:** TypeScript or build errors

**Solutions:**
1. Run `npm install` to ensure all dependencies are installed
2. Check TypeScript errors: `npx tsc --noEmit`
3. The build might fail without environment variables - this is expected
4. Set environment variables before building for production

## Configuration Options

### Notification Polling

The NotificationBell component polls for new notifications every 30 seconds by default.

To change this, edit `/components/notifications/NotificationBell.tsx`:
```typescript
// Change 30000 (30 seconds) to your preferred interval
const interval = setInterval(fetchNotifications, 30000)
```

### Email Templates

Email templates are located in `/lib/templates/email-html.ts`

You can customize:
- Colors and styling (inline CSS)
- Content and copy
- Add company logo/branding
- Add social media links

### Notification Types

Current notification types (defined in `/types/index.ts`):
- `challenge_received`
- `challenge_accepted`
- `challenge_counter_proposal` (not yet implemented)
- `match_reminder` (not yet implemented)
- `forfeit_warning` (Phase 5 - auto-forfeit system)
- `score_submitted`
- `score_disputed` (Phase 3.2 - dispute system)
- `season_ended` (Phase 5)

## Next Steps

### Future Enhancements (Post-Phase 4)

1. **Real-time Notifications**
   - Use Supabase Realtime instead of polling
   - Instant notification updates

2. **Push Notifications**
   - Web Push API for browser notifications
   - Works even when tab is closed

3. **Email Digest**
   - Daily/weekly summary emails
   - Reduce email fatigue

4. **Notification Preferences**
   - Per-notification-type settings
   - Email vs in-app preferences
   - Quiet hours

5. **WhatsApp API Integration**
   - Automatic WhatsApp messages (requires WhatsApp Business API)
   - Two-way communication

## File Reference

### New Files Created

```
lib/
├── services/
│   ├── email.ts                  # Email sending via Resend
│   └── notifications.ts          # Notification creation & management
├── templates/
│   └── email-html.ts             # Email HTML templates
├── actions/
│   └── notifications.ts          # Server actions for UI
└── utils/
    └── whatsapp.ts               # WhatsApp message formatting

components/
└── notifications/
    ├── NotificationBell.tsx      # Bell icon with dropdown
    ├── NotificationItem.tsx      # Single notification display
    ├── NotificationCenter.tsx    # Full notification history
    └── WhatsAppShareDialog.tsx   # WhatsApp sharing modal

components/challenges/
└── WhatsAppShareDialog.tsx       # Challenge WhatsApp sharing

app/
└── notifications/
    └── page.tsx                  # Notifications page

supabase/migrations/
└── 20250117_001_notifications_rls.sql  # RLS policies
```

### Modified Files

```
lib/actions/
├── challenges.ts                 # Added 4 notification triggers
└── matches.ts                    # Added 1 notification trigger

components/
├── Navigation.tsx                # Added NotificationBell
└── challenges/
    └── ChallengeCard.tsx         # Added WhatsApp share button
```

## Success Criteria

Phase 4 is complete when:

✅ Email notifications are sent for all challenge/match events
✅ In-app notification bell shows unread count
✅ Users can view notification history
✅ Users can mark notifications as read
✅ WhatsApp sharing works for challenges
✅ All notifications are properly styled and mobile-responsive
✅ RLS policies protect user privacy
✅ No TypeScript errors
✅ All features tested end-to-end

## Support

For issues or questions:
1. Check Resend dashboard for email delivery status
2. Check Supabase logs for database errors
3. Check browser console for client-side errors
4. Check server logs for notification service errors

## Deployment

Before deploying to production:
1. Set up Resend API key in Vercel environment variables
2. Verify custom email domain in Resend (optional but recommended)
3. Apply database migration in production Supabase
4. Test thoroughly in staging environment first
5. Monitor error logs after deployment

---

**Phase 4 Implementation: COMPLETE** 🎉

Next up: Phase 5 - Playoffs & Season Management
