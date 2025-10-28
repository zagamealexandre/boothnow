-- Clean sessions table schema to fix user_id conflicts
-- This is a comprehensive fix for the duplicate user_id column issue

-- 1. First, let's see what we're working with
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;

-- 2. Drop the problematic constraint if it exists
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS check_user_reference;

-- 3. Make user_id nullable (this should fix the NOT NULL constraint issue)
ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;

-- 4. Ensure clerk_user_id exists and is properly indexed
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- 5. Update existing sessions to populate clerk_user_id where missing
UPDATE sessions 
SET clerk_user_id = u.clerk_user_id 
FROM users u 
WHERE sessions.user_id = u.id 
  AND (sessions.clerk_user_id IS NULL OR sessions.clerk_user_id = '');

-- 6. Add a constraint that ensures at least one user reference exists
ALTER TABLE sessions ADD CONSTRAINT check_user_reference 
  CHECK (user_id IS NOT NULL OR clerk_user_id IS NOT NULL);

-- 7. Verify the final state
SELECT 
  'sessions' as table_name,
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name IN ('user_id', 'clerk_user_id')
ORDER BY column_name;

-- 8. Test that we can insert a session with just clerk_user_id
-- (This is just a test - we'll roll it back)
BEGIN;
  INSERT INTO sessions (booth_id, start_time, end_time, total_minutes, status, clerk_user_id)
  VALUES (
    (SELECT id FROM booths LIMIT 1),
    NOW(),
    NOW() + INTERVAL '1 hour',
    60,
    'active',
    'test_user_123'
  );
  
  -- Check if it worked
  SELECT id, user_id, clerk_user_id, status FROM sessions WHERE clerk_user_id = 'test_user_123';
  
  -- Rollback the test
ROLLBACK;
