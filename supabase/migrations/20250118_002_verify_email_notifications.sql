-- Check current email notification status for all users
SELECT id, name, email, email_notifications_enabled
FROM users
ORDER BY created_at DESC;

-- Enable email notifications for all users (run this if any are FALSE or NULL)
UPDATE users
SET email_notifications_enabled = TRUE
WHERE email_notifications_enabled = FALSE OR email_notifications_enabled IS NULL;

-- Verify the update worked
SELECT id, name, email, email_notifications_enabled
FROM users
ORDER BY created_at DESC;
