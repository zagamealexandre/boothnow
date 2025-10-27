-- Final fix for Supabase RLS policies
-- This script completely resolves the user creation issues

-- 1. Drop ALL existing RLS policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to view all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view all sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update sessions" ON sessions;
DROP POLICY IF EXISTS "Allow authenticated users to view all reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated users to insert reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated users to update reservations" ON reservations;
DROP POLICY IF EXISTS "Allow authenticated users to view all payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow authenticated users to view all analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Allow authenticated users to insert analytics_events" ON analytics_events;

-- 2. Temporarily disable RLS for development (more permissive)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE booths DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON sessions TO authenticated;
GRANT ALL ON booths TO authenticated;
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON analytics_events TO authenticated;

-- 4. Grant permissions to anon users for public access (if needed)
GRANT SELECT ON booths TO anon;
GRANT SELECT ON users TO anon;

-- 5. Create very permissive policies (if RLS is re-enabled later)
CREATE POLICY "Allow all authenticated operations on users" ON users
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on sessions" ON sessions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on booths" ON booths
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on reservations" ON reservations
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on payments" ON payments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on subscriptions" ON subscriptions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated operations on analytics_events" ON analytics_events
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS creem_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method_setup BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'pay_per_use';
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_creem_customer_id ON users(creem_customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_creem_payment_intent_id ON payments(creem_payment_intent_id);

-- 8. Update existing records to have default values
UPDATE users SET payment_type = 'pay_per_use' WHERE payment_type IS NULL;
UPDATE users SET clerk_user_id = id WHERE clerk_user_id IS NULL AND id IS NOT NULL;

COMMIT;
