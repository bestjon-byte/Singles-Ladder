-- Enable RLS on playoff_brackets table
-- This fixes the critical security issue where RLS was not enabled

-- 1. Enable Row Level Security
ALTER TABLE playoff_brackets ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow authenticated users to read playoff brackets
CREATE POLICY "Anyone can view playoff brackets"
ON playoff_brackets
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy: Allow admins to insert playoff brackets
CREATE POLICY "Admins can insert playoff brackets"
ON playoff_brackets
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- 4. Policy: Allow admins to update playoff brackets
CREATE POLICY "Admins can update playoff brackets"
ON playoff_brackets
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 5. Policy: Allow admins to delete playoff brackets
CREATE POLICY "Admins can delete playoff brackets"
ON playoff_brackets
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
