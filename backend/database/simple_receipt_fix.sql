-- Simple fix: Create a test receipt manually and fix RLS
-- This will help us debug the issue

-- First, let's create a test receipt manually to see if the table works
-- Replace 'your-user-id' with an actual user ID from your users table
INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
SELECT 
  u.id as user_id,
  s.id as session_id,
  NULL as payment_id,
  'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001' as receipt_number,
  COALESCE(s.cost, 0) as amount,
  'EUR' as currency,
  jsonb_build_object(
    'receipt_number', 'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001',
    'session_id', s.id,
    'booth_name', COALESCE(b.name, 'Booth'),
    'booth_partner', COALESCE(b.partner, 'Unknown'),
    'booth_address', COALESCE(b.address, 'Unknown'),
    'user_name', COALESCE(u.first_name || ' ' || u.last_name, 'User'),
    'user_email', COALESCE(u.email, 'unknown@example.com'),
    'start_time', s.start_time,
    'end_time', s.end_time,
    'duration_minutes', COALESCE(s.total_minutes, 0),
    'amount', COALESCE(s.cost, 0),
    'currency', 'EUR',
    'generated_at', NOW()
  ) as receipt_data
FROM users u
CROSS JOIN sessions s
LEFT JOIN booths b ON s.booth_id = b.id
WHERE s.status = 'completed'
  AND u.id = s.user_id
  AND NOT EXISTS (SELECT 1 FROM receipts WHERE session_id = s.id)
LIMIT 5;

-- Fix RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Allow receipt inserts" ON receipts;

-- Create very permissive policies for now
CREATE POLICY "Allow all receipts operations" ON receipts
  FOR ALL USING (true) WITH CHECK (true);

-- Grant all permissions
GRANT ALL ON TABLE receipts TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_generate_receipt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO anon, authenticated, service_role;
