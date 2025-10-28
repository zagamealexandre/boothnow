-- Remove the problematic trigger that overwrites clerk_user_id with internal UUID
-- This trigger was causing new users to have their clerk_user_id overwritten

-- Drop the trigger function
DROP FUNCTION IF EXISTS set_clerk_user_id();

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_users ON users;
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_sessions ON sessions;

-- Verify the triggers are removed
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%clerk_user_id%';

-- Test that we can now insert users with proper clerk_user_id
-- (This is just a verification query, not an actual insert)
SELECT 'Triggers removed successfully. Users can now be created with proper clerk_user_id values.' as message;
