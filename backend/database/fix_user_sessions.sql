-- Fix user sessions and RLS policies for Clerk integration
-- Run this script in your Supabase SQL editor

-- 1. Add clerk_user_id column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- 2. Create index for clerk_user_id in sessions
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- 3. Update existing sessions to have clerk_user_id (if any exist)
UPDATE sessions 
SET clerk_user_id = u.clerk_user_id 
FROM users u 
WHERE sessions.user_id = u.id;

-- 4. Fix RLS policies to allow user creation
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create more permissive policies for user management
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow users to insert their own profile (for new user creation)
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 5. Update sessions policies to use clerk_user_id
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 6. Add clerk_user_id to other tables for consistency
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- 7. Create indexes for clerk_user_id in other tables
CREATE INDEX IF NOT EXISTS idx_reservations_clerk_user_id ON reservations(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_clerk_user_id ON payments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_clerk_user_id ON analytics_events(clerk_user_id);

-- 8. Update policies for other tables
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create own reservations" ON reservations;

CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 9. Make sure booths are publicly readable (no RLS for booths)
DROP POLICY IF EXISTS "Booths are publicly readable" ON booths;
CREATE POLICY "Booths are publicly readable" ON booths
  FOR SELECT USING (true);

-- 10. Add a function to automatically set clerk_user_id when inserting sessions
CREATE OR REPLACE FUNCTION set_clerk_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If clerk_user_id is not provided, get it from the users table
    IF NEW.clerk_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
        SELECT clerk_user_id INTO NEW.clerk_user_id 
        FROM users 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically set clerk_user_id
DROP TRIGGER IF EXISTS set_clerk_user_id_trigger ON sessions;
CREATE TRIGGER set_clerk_user_id_trigger
    BEFORE INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_clerk_user_id();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
