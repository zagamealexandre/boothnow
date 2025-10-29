-- Generate missing receipts for completed sessions that don't have receipts
-- This will create receipts for all completed sessions regardless of cost

-- First, let's see which sessions are missing receipts
SELECT 
  s.id,
  s.user_id,
  s.cost,
  s.total_minutes,
  s.status,
  s.created_at,
  CASE WHEN r.id IS NULL THEN 'MISSING RECEIPT' ELSE 'HAS RECEIPT' END as receipt_status
FROM sessions s
LEFT JOIN receipts r ON s.id = r.session_id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC;

-- Generate receipts for sessions that don't have them
INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
SELECT 
  s.user_id,
  s.id,
  NULL as payment_id,
  'RCP-' || TO_CHAR(s.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::text, 4, '0') as receipt_number,
  COALESCE(s.cost, 0) as amount,
  'SEK' as currency,
  jsonb_build_object(
    'receipt_number', 'RCP-' || TO_CHAR(s.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY s.created_at)::text, 4, '0'),
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
    'currency', 'SEK',
    'generated_at', NOW()
  ) as receipt_data
FROM sessions s
LEFT JOIN receipts r ON s.id = r.session_id
LEFT JOIN booths b ON s.booth_id = b.id
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status = 'completed' 
  AND r.id IS NULL  -- Only sessions without receipts
ORDER BY s.created_at;

-- Verify the results
SELECT 
  s.id as session_id,
  s.cost as session_cost,
  s.total_minutes,
  r.amount as receipt_amount,
  r.currency as receipt_currency,
  r.receipt_number
FROM sessions s
LEFT JOIN receipts r ON s.id = r.session_id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC;
