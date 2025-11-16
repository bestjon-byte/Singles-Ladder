-- Fix admin RLS policies to allow users to check their own admin status

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

-- Allow users to view their own admin record
CREATE POLICY "Users can view own admin status"
  ON admins FOR SELECT
  USING (user_id = auth.uid());

-- Allow existing admins to view all admin records
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));
