# Supabase Database Setup

This directory contains the database migrations for the Tennis Singles Ladder application.

## Running Migrations

### Option 1: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - `migrations/20250116_001_initial_schema.sql`
   - `migrations/20250116_002_rls_policies.sql`
   - `migrations/20250116_003_functions.sql`
   - `migrations/20250116_004_fix_users_insert_policy.sql`
   - `migrations/20250116_005_auto_create_user_profile.sql`
   - `migrations/20250116_006_fix_admin_rls.sql`
   - `migrations/20250116_007_fix_is_admin_function.sql`
   - `migrations/20250116_008_allow_match_creation.sql`

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref cgvertskdkebxukrehyn

# Push migrations
supabase db push
```

## Migration Files

### 001_initial_schema.sql
Creates all database tables, custom types, and indexes:
- users
- admins
- seasons
- ladder_positions
- challenges
- challenge_negotiations
- matches
- wildcard_usage
- ladder_history
- notifications
- player_stats
- head_to_head_stats

### 002_rls_policies.sql
Sets up Row Level Security (RLS) policies for:
- User access control
- Admin permissions
- Public read access where appropriate
- Secure write operations

### 003_functions.sql
Creates PostgreSQL functions for:
- `update_ladder_after_match()` - Handles ladder position updates
- `add_player_to_ladder()` - Adds new players to the ladder
- `remove_player_from_ladder()` - Removes players from the ladder
- `get_available_wildcards()` - Counts available wildcards
- `can_challenge()` - Validates challenge eligibility
- `update_player_stats_after_match()` - Updates player statistics
- Auto-update triggers for `updated_at` timestamps

### 004_fix_users_insert_policy.sql
Fixes RLS policy to allow user profile creation

### 005_auto_create_user_profile.sql
Adds trigger to automatically create user profiles on signup

### 006_fix_admin_rls.sql
Fixes admin RLS policies for proper permission handling

### 007_fix_is_admin_function.sql
Updates is_admin function and related RLS policies

### 008_allow_match_creation.sql
Adds RLS policy to allow match creation when challenges are accepted

## Post-Migration Steps

After running migrations, you should:

1. **Create your first admin user**:
   ```sql
   -- First, sign up a user through the app or Supabase Auth
   -- Then add them to the admins table:
   INSERT INTO admins (email, user_id)
   VALUES ('your-email@example.com', '<user-id-from-auth-users>');
   ```

2. **Create your first season**:
   ```sql
   INSERT INTO seasons (name, start_date, wildcards_per_player)
   VALUES ('Season 1 - 2025', '2025-01-16', 2);
   ```

## Database Schema Diagram

The database follows this relationship structure:

```
auth.users (Supabase)
    └─> users
        ├─> admins
        ├─> ladder_positions <─> seasons
        ├─> challenges
        │   └─> challenge_negotiations
        ├─> matches
        ├─> wildcard_usage
        ├─> ladder_history
        ├─> notifications
        ├─> player_stats
        └─> head_to_head_stats
```

## Backup

Always backup your database before running migrations:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```
