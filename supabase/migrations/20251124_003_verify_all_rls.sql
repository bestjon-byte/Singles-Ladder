-- Comprehensive RLS verification and fix for all public tables
-- This ensures ALL tables have RLS enabled to prevent the HTTP 556 error

-- Check and enable RLS on all public tables that should have it
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables in public schema
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        -- Enable RLS on each table
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
                      table_record.schemaname,
                      table_record.tablename);

        RAISE NOTICE 'Enabled RLS on %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- Verify RLS is enabled on playoff_brackets specifically
ALTER TABLE playoff_brackets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view playoff brackets" ON playoff_brackets;
DROP POLICY IF EXISTS "Admins can insert playoff brackets" ON playoff_brackets;
DROP POLICY IF EXISTS "Admins can update playoff brackets" ON playoff_brackets;
DROP POLICY IF EXISTS "Admins can delete playoff brackets" ON playoff_brackets;

-- Recreate policies for playoff_brackets
CREATE POLICY "Anyone can view playoff brackets"
ON playoff_brackets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert playoff brackets"
ON playoff_brackets
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update playoff brackets"
ON playoff_brackets
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete playoff brackets"
ON playoff_brackets
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Display summary
SELECT
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
