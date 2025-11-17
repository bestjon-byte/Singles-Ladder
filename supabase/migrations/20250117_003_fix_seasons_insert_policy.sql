-- Fix seasons RLS policy to allow INSERT operations
-- The original policy only had USING clause, which doesn't work for INSERT
-- INSERT operations require WITH CHECK clause

DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;

CREATE POLICY "Admins can manage seasons"
  ON seasons FOR ALL
  USING (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())))
  WITH CHECK (is_admin((SELECT email FROM auth.users WHERE id = auth.uid())));
