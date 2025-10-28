-- Temporarily allow NULL user_id in sessions table for immediate bookings
-- This is a quick fix while we resolve the user lookup issues

-- 1. Make user_id nullable in sessions table
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add a check constraint to ensure either user_id or clerk_user_id is provided
ALTER TABLE sessions ADD CONSTRAINT check_user_reference 
  CHECK (user_id IS NOT NULL OR clerk_user_id IS NOT NULL);

-- 3. Update existing sessions that might have NULL user_id
UPDATE sessions 
SET clerk_user_id = u.clerk_user_id 
FROM users u 
WHERE sessions.user_id = u.id 
  AND sessions.clerk_user_id IS NULL;

-- 4. Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name = 'user_id';
