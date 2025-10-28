-- Complete fix for clerk_user_id issues
-- This script removes all problematic triggers and fixes existing data

-- 1. Remove ALL triggers that might affect clerk_user_id
DROP FUNCTION IF EXISTS set_clerk_user_id() CASCADE;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_users ON users;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_sessions ON sessions;
DROP TRIGGER IF EXISTS set_clerk_user_id_trigger ON sessions;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id ON users;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id ON sessions;

-- 2. Check what triggers still exist
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%clerk%' OR trigger_name LIKE '%user%';

-- 3. Check current users and their clerk_user_id values
SELECT id, clerk_user_id, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Fix any users that have UUID as clerk_user_id instead of actual Clerk ID
-- (This will need to be done manually for each user)
-- UPDATE users SET clerk_user_id = 'actual_clerk_id_here' WHERE id = 'user_uuid_here';

-- 5. Verify the users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 6. Test that we can insert a user with proper clerk_user_id
-- (This is just a test - don't actually insert)
SELECT 'Triggers removed. You can now manually fix clerk_user_id values for existing users.' as message;
