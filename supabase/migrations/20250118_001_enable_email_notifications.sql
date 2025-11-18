-- Enable email notifications for all existing users
-- The default is already TRUE in the schema, but this ensures all existing users have it enabled
UPDATE users
SET email_notifications_enabled = TRUE
WHERE email_notifications_enabled = FALSE OR email_notifications_enabled IS NULL;
