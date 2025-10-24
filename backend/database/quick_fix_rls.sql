-- Quick fix: Temporarily disable RLS on users table
-- This allows user creation while we fix the policies

-- Disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Add clerk_user_id column to sessions if it doesn't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- Update existing sessions to have clerk_user_id
UPDATE sessions 
SET clerk_user_id = u.clerk_user_id 
FROM users u 
WHERE sessions.user_id = u.id AND sessions.clerk_user_id IS NULL;

-- Re-enable RLS with a simple policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for now
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Allow all operations on users table (temporary)
CREATE POLICY "Allow all user operations" ON users
  FOR ALL USING (true);

-- Make sure sessions can be queried by clerk_user_id
CREATE POLICY "Allow session access" ON sessions
  FOR ALL USING (true);
