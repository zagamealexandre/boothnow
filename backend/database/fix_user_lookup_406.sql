-- Fix user lookup 406 error for session creation
-- This script addresses the 406 Not Acceptable error when looking up users

-- 1. Ensure RLS is properly configured for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Create a permissive policy for user lookups (needed for session creation)
DROP POLICY IF EXISTS "Allow user lookups for session creation" ON users;
CREATE POLICY "Allow user lookups for session creation" ON users
  FOR SELECT
  USING (true);

-- 3. Ensure clerk_user_id column exists and is indexed
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- 4. Update any existing users to have clerk_user_id if missing
UPDATE users 
SET clerk_user_id = id::text 
WHERE clerk_user_id IS NULL AND id IS NOT NULL;

-- 5. Ensure sessions table has clerk_user_id column
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- 6. Create a policy for sessions table to allow inserts
DROP POLICY IF EXISTS "Allow session creation" ON sessions;
CREATE POLICY "Allow session creation" ON sessions
  FOR INSERT
  WITH CHECK (true);

-- 7. Create a policy for sessions table to allow reads
DROP POLICY IF EXISTS "Allow session reads" ON sessions;
CREATE POLICY "Allow session reads" ON sessions
  FOR SELECT
  USING (true);

-- 8. Verify the setup
SELECT 
  table_name, 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'sessions') 
  AND column_name IN ('clerk_user_id', 'user_id')
ORDER BY table_name, column_name;
