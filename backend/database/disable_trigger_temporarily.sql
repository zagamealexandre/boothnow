-- Temporarily disable the trigger to allow sessions to end
-- We'll create receipts manually for now

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS trigger_auto_generate_receipt ON sessions;

-- Create receipts for existing completed sessions
INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
SELECT 
  s.user_id,
  s.id as session_id,
  NULL as payment_id,
  'RCP-' || TO_CHAR(s.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::TEXT, 4, '0') as receipt_number,
  COALESCE(s.cost, 0) as amount,
  'EUR' as currency,
  jsonb_build_object(
    'receipt_number', 'RCP-' || TO_CHAR(s.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::TEXT, 4, '0'),
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
FROM sessions s
LEFT JOIN booths b ON s.booth_id = b.id
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM receipts WHERE session_id = s.id);

-- Fix RLS policies to be permissive
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all receipts operations" ON receipts;
CREATE POLICY "Allow all receipts operations" ON receipts
  FOR ALL USING (true) WITH CHECK (true);
