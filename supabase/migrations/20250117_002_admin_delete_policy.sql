-- Add DELETE policy for admins table
-- This allows admins to demote other users from admin status

CREATE POLICY "Admins can delete admins"
  ON admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );
