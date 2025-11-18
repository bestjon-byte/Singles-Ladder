# Tennis Singles Ladder

A comprehensive web application for managing tennis club ladder competitions. Players can challenge opponents, schedule matches, submit scores, and track statistics across seasons.

[![Production](https://img.shields.io/badge/live-production-success)](https://singles-ladder.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

## Features

- **Ladder System**: Dynamic player rankings with automated position updates
- **Challenge Management**: Players challenge opponents with wildcard options
- **Match Scoring**: Submit scores with automatic winner calculation
- **Notifications**: Email and in-app notifications for all events
- **Admin Panel**: Comprehensive tools for managing seasons, users, and disputes
- **Statistics**: Track performance, win streaks, and head-to-head records
- **Mobile Optimized**: Fully responsive design for on-court score submission

## Tech Stack

- **Frontend**: Next.js 15.5.6, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Email**: Resend API
- **Hosting**: Vercel
- **UI Components**: Radix UI, Lucide React

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account
- (Optional) Resend account for email notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bestjon-byte/Singles-Ladder.git
   cd Singles-Ladder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Email (Resend)
   RESEND_API_KEY=your-resend-api-key
   FROM_EMAIL=your-verified-email@yourdomain.com

   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   Apply migrations in Supabase Dashboard → SQL Editor:
   - Run all files in `supabase/migrations/` in order
   - See `supabase/README.md` for detailed instructions

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Singles-Ladder/
├── app/                   # Next.js App Router pages
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main dashboard (ladder view)
│   ├── challenges/       # Challenge management
│   ├── matches/          # Match viewing/scoring
│   ├── admin/            # Admin panel
│   └── ...
├── components/           # React components
│   ├── admin/           # Admin-specific components
│   ├── challenges/      # Challenge components
│   ├── ladder/          # Ladder display
│   ├── matches/         # Match components
│   └── notifications/   # Notification system
├── lib/
│   ├── actions/         # Server Actions
│   ├── services/        # Business logic
│   ├── supabase/        # Database clients
│   └── utils/           # Utilities
├── supabase/
│   └── migrations/      # Database migrations
└── types/               # TypeScript types
```

## How It Works

### For Players

1. **Join the ladder**: Sign up and wait for admin to add you to the ladder
2. **Challenge opponents**: Challenge players up to 2 positions above you
3. **Use wildcards**: Challenge anyone above you (limited per season)
4. **Schedule matches**: Coordinate with your opponent
5. **Submit scores**: Either player can submit the match result
6. **Track progress**: View your statistics and position history

### For Admins

1. **Manage seasons**: Create and configure competitive seasons
2. **Manage ladder**: Add/remove players, adjust positions
3. **Resolve disputes**: Review and correct disputed match scores
4. **Monitor activity**: View all challenges, matches, and user stats

## Key Features Explained

### Ladder System
- Players ranked 1 (top) to N (bottom)
- Winner of challenge match takes loser's position
- All players between shift down by one
- Complete position history tracked

### Wildcard Challenges
- Each player gets 2 wildcards per season (configurable)
- Use wildcard to challenge any player above you
- Wildcards refunded if challenge is rejected
- Consumed only when match is completed

### Notifications
- **In-app**: Bell icon with unread count, full notification center
- **Email**: HTML formatted emails via Resend
- **WhatsApp**: Share challenge details (manual sharing)

### Dispute Resolution
- Either player can dispute a submitted score
- Admin reviews and resolves with correct score
- Ladder positions automatically recalculated if winner changes

## Documentation

- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)**: Complete database documentation
- **[USER_GUIDE.md](USER_GUIDE.md)**: End-user guide for players
- **[claude.md](claude.md)**: AI development context for contributors
- **[supabase/README.md](supabase/README.md)**: Database setup guide

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (see `.env.local` example)
4. Deploy!

### Supabase Configuration

**Critical**: Configure URL settings in Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Set Site URL to your production URL
3. Add redirect URLs for production and development

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Making Changes

- **Frontend**: Edit files in `app/` and `components/`
- **Backend**: Add server actions in `lib/actions/`
- **Database**: Create migration files in `supabase/migrations/`
- **Styling**: Tailwind CSS classes with custom theme

### Database Migrations

1. Create new file: `supabase/migrations/YYYYMMDD_###_description.sql`
2. Write SQL migration
3. Apply via Supabase SQL Editor
4. Update `DATABASE_SCHEMA.md`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Production Instance

- **URL**: https://singles-ladder.vercel.app
- **Supabase**: Hosted on Supabase Cloud
- **Email**: Sent via Resend (verified domain: jlbweb.co.uk)
- **Status**: Production-ready, actively used

## Support

For issues or questions:
- Check the documentation files listed above
- Review `claude.md` for development context
- Check [issues](https://github.com/bestjon-byte/Singles-Ladder/issues) on GitHub

## License

Private project - All rights reserved

---

**Built with ❤️ for tennis clubs everywhere**
