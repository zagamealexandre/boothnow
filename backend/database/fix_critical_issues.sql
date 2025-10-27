-- Fix Critical Database Issues
-- This script addresses the high-priority errors from the console

-- 1. Add missing clerk_user_id column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- 2. Add missing clerk_user_id column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- 4. Drop existing RLS policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;

-- 5. Create more permissive RLS policies for development
-- Users table policies
CREATE POLICY "Allow authenticated users to view all users" ON users
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users" ON users
    FOR UPDATE TO authenticated
    USING (true);

-- Sessions table policies
CREATE POLICY "Allow authenticated users to view all sessions" ON sessions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert sessions" ON sessions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sessions" ON sessions
    FOR UPDATE TO authenticated
    USING (true);

-- 6. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON booths TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON analytics_events TO authenticated;

-- 7. Update existing sessions to have clerk_user_id if missing
UPDATE sessions 
SET clerk_user_id = user_id 
WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;

-- 8. Update existing users to have clerk_user_id if missing
UPDATE users 
SET clerk_user_id = id 
WHERE clerk_user_id IS NULL AND id IS NOT NULL;

-- 9. Create a function to automatically set clerk_user_id
CREATE OR REPLACE FUNCTION set_clerk_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- For users table
    IF TG_TABLE_NAME = 'users' THEN
        NEW.clerk_user_id = NEW.id;
    END IF;
    
    -- For sessions table
    IF TG_TABLE_NAME = 'sessions' THEN
        NEW.clerk_user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers to automatically set clerk_user_id
DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_users ON users;
CREATE TRIGGER trigger_set_clerk_user_id_users
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_clerk_user_id();

DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_sessions ON sessions;
CREATE TRIGGER trigger_set_clerk_user_id_sessions
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_clerk_user_id();

-- 11. Ensure RLS is enabled but with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 12. Add missing columns to other tables if needed
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- 13. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_reservations_clerk_user_id ON reservations(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_clerk_user_id ON payments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_clerk_user_id ON subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_clerk_user_id ON analytics_events(clerk_user_id);

-- 14. Create policies for other tables
CREATE POLICY "Allow authenticated users to view all reservations" ON reservations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert reservations" ON reservations
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reservations" ON reservations
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view all payments" ON payments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert payments" ON payments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all subscriptions" ON subscriptions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert subscriptions" ON subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all analytics_events" ON analytics_events
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert analytics_events" ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 15. Grant permissions for all tables
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON analytics_events TO authenticated;

COMMIT;
