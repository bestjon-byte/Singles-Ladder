-- Add availability column to users table
ALTER TABLE users
ADD COLUMN availability JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.availability IS 'User availability preferences stored as {"days": ["monday", "friday"], "timeSlots": ["morning", "evening"]}';

-- Optional: Create GIN index for querying (can add later if needed)
-- CREATE INDEX idx_users_availability ON users USING GIN (availability);
