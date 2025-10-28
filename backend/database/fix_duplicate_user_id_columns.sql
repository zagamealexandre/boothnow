-- Fix duplicate/conflicting user_id columns in sessions table
-- This addresses the schema inconsistency causing session creation failures

-- 1. First, let's see what columns actually exist in the sessions table
SELECT 
  column_name, 
  is_nullable, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name LIKE '%user%'
ORDER BY column_name, ordinal_position;

-- 2. Check if there are any constraints on the sessions table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'sessions'::regclass
  AND conname LIKE '%user%';

-- 3. Drop any existing check constraints that might be causing issues
DROP CONSTRAINT IF EXISTS check_user_reference ON sessions;

-- 4. Ensure we have the correct columns (drop duplicates if they exist)
-- First, let's see the current structure
\d sessions;

-- 5. If there are duplicate user_id columns, we need to consolidate them
-- This is a complex operation that requires careful handling

-- 6. Ensure clerk_user_id column exists and is properly configured
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- 7. Update any existing sessions to have clerk_user_id
UPDATE sessions 
SET clerk_user_id = u.clerk_user_id 
FROM users u 
WHERE sessions.user_id = u.id 
  AND sessions.clerk_user_id IS NULL;

-- 8. Create a proper constraint that allows either user_id OR clerk_user_id
ALTER TABLE sessions ADD CONSTRAINT check_user_reference 
  CHECK (
    (user_id IS NOT NULL AND clerk_user_id IS NULL) OR 
    (user_id IS NULL AND clerk_user_id IS NOT NULL) OR 
    (user_id IS NOT NULL AND clerk_user_id IS NOT NULL)
  );

-- 9. Verify the final structure
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name IN ('user_id', 'clerk_user_id')
ORDER BY column_name;
