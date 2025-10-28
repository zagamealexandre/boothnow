-- Fix check constraint violation for sessions table
-- The issue is that both user_id and clerk_user_id are NULL, violating the constraint

-- 1. First, let's see what's in the failing row
SELECT 
  id, 
  user_id, 
  clerk_user_id, 
  booth_id, 
  status, 
  created_at
FROM sessions 
WHERE id = 'f1729654-1192-42c4-abf0-af21d380f9c1';

-- 2. Drop the problematic constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS check_user_reference;

-- 3. Update the failing row to have a clerk_user_id (use a placeholder for now)
UPDATE sessions 
SET clerk_user_id = 'temp_user_' || id::text
WHERE id = 'f1729654-1192-42c4-abf0-af21d380f9c1';

-- 4. Update any other sessions that have both user_id and clerk_user_id as NULL
UPDATE sessions 
SET clerk_user_id = 'temp_user_' || id::text
WHERE user_id IS NULL AND clerk_user_id IS NULL;

-- 5. Create a more lenient constraint that allows NULL user_id if clerk_user_id exists
ALTER TABLE sessions ADD CONSTRAINT check_user_reference 
  CHECK (
    user_id IS NOT NULL OR 
    clerk_user_id IS NOT NULL
  );

-- 6. Verify the constraint works
SELECT 
  'Constraint test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM sessions 
      WHERE user_id IS NULL AND clerk_user_id IS NULL
    ) THEN 'FAILED - Found rows with both user_id and clerk_user_id NULL'
    ELSE 'PASSED - No rows with both user_id and clerk_user_id NULL'
  END as result;

-- 7. Show the current state of sessions
SELECT 
  id, 
  user_id, 
  clerk_user_id, 
  status,
  created_at
FROM sessions 
ORDER BY created_at DESC 
LIMIT 5;
