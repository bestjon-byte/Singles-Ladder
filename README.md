# Tennis Singles Ladder 2

A mobile-optimized web application for managing tennis club ladders independently, featuring player challenges, automated ladder updates, match scheduling, playoffs, and comprehensive statistics tracking.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Email**: Resend (to be configured)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- (Optional) Resend account for email notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Singles-Ladder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   The `.env.local` file is already configured with your Supabase credentials. To add Resend later:
   ```bash
   # Add these to .env.local when ready:
   RESEND_API_KEY=your-resend-api-key
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Set up the database**

   Run the migrations in Supabase:
   - Go to your Supabase project dashboard: https://supabase.com/dashboard/project/cgvertskdkebxukrehyn
   - Navigate to SQL Editor
   - Run each migration file in order:
     1. `supabase/migrations/20250116_001_initial_schema.sql`
     2. `supabase/migrations/20250116_002_rls_policies.sql`
     3. `supabase/migrations/20250116_003_functions.sql`

   See `supabase/README.md` for detailed instructions.

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
singles-ladder/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages (login, signup, reset)
│   ├── dashboard/         # Main app dashboard
│   ├── admin/             # Admin panel (coming soon)
│   └── api/               # API routes (coming soon)
├── components/            # React components
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── supabase/             # Database migrations
    └── migrations/        # SQL migration files
```

## Features

### Phase 1: Core Foundation ✅
- [x] User authentication (signup, login, password reset)
- [x] Database schema
- [x] Basic project structure
- [ ] Admin panel basics
- [ ] Season management
- [ ] Ladder display

### Phase 2-7: Coming Soon
- Challenge system with negotiation
- Match scoring and automated ladder updates
- Email and WhatsApp notifications
- Playoff generation
- Comprehensive statistics
- Mobile PWA optimization

See `PROJECT_PLAN.md` for the complete implementation roadmap.

## Initial Setup Steps

### 1. Create Your First Admin

After running the migrations, create an admin user:

```sql
-- First, sign up through the app at http://localhost:3000/auth/signup
-- Then run this in Supabase SQL Editor, replacing with your details:

INSERT INTO admins (email, user_id)
VALUES ('your-email@example.com', '<your-user-id-from-auth-users>');
```

### 2. Create Your First Season

```sql
INSERT INTO seasons (name, start_date, wildcards_per_player)
VALUES ('Season 1 - 2025', '2025-01-16', 2);
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Migrations

See `supabase/README.md` for detailed database setup and migration instructions.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Optional) `RESEND_API_KEY` and `FROM_EMAIL`
4. Deploy!

## Documentation

- [Project Plan](PROJECT_PLAN.md) - Comprehensive implementation plan
- [Database Setup](supabase/README.md) - Database schema and migration guide

## Support

For issues and questions, please refer to the project documentation or contact the development team.

## License

Private project - All rights reserved.
