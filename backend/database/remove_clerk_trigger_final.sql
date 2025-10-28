-- Remove the problematic trigger and fix clerk_user_id data
-- This script removes the trigger that automatically sets clerk_user_id = id

-- 1. Remove the trigger
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_users ON users;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_sessions ON sessions;

-- 2. Remove the function
DROP FUNCTION IF EXISTS set_clerk_user_id() CASCADE;

-- 3. Check current state
SELECT 'Current users:' as status;
SELECT id, clerk_user_id, email FROM users;

SELECT 'Current sessions:' as status;
SELECT id, clerk_user_id, user_id, status FROM sessions;

-- 4. Update the user with the correct clerk_user_id
UPDATE users 
SET clerk_user_id = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj',
    updated_at = NOW()
WHERE email = 'alexbacelo@gmail.com';

-- 5. Update sessions to use the correct clerk_user_id
UPDATE sessions 
SET clerk_user_id = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj'
WHERE user_id = (SELECT id FROM users WHERE email = 'alexbacelo@gmail.com');

-- 6. Verify the fix
SELECT 'After fix - users:' as status;
SELECT id, clerk_user_id, email FROM users WHERE clerk_user_id = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj';

SELECT 'After fix - sessions:' as status;
SELECT id, clerk_user_id, user_id, status FROM sessions WHERE clerk_user_id = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj';

-- 7. Test that we can now update clerk_user_id
SELECT 'Testing update capability:' as status;
UPDATE users 
SET clerk_user_id = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj',
    updated_at = NOW()
WHERE email = 'alexbacelo@gmail.com';

SELECT 'Final verification:' as status;
SELECT id, clerk_user_id, email FROM users WHERE email = 'alexbacelo@gmail.com';
