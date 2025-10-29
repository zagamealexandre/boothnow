-- Fix session costs to show real values based on actual duration
-- This will correct the cost values in the sessions table

-- Step 1: Check current session costs
SELECT 
  id,
  total_minutes,
  cost,
  status,
  created_at
FROM sessions 
WHERE status = 'completed'
ORDER BY created_at DESC;

-- Step 2: Update session costs to real values (5 SEK per minute)
UPDATE sessions 
SET cost = total_minutes * 5.00
WHERE status = 'completed' 
  AND total_minutes IS NOT NULL;

-- Step 3: Update receipts to match the corrected session costs
UPDATE receipts 
SET 
  amount = s.cost,
  receipt_data = jsonb_set(
    jsonb_set(receipt_data, '{amount}', to_jsonb(s.cost)),
    '{currency}', '"SEK"'::jsonb
  )
FROM sessions s
WHERE receipts.session_id = s.id
  AND s.status = 'completed';

-- Step 4: Verify the corrected values
SELECT 
  s.id as session_id,
  s.total_minutes,
  s.cost as corrected_cost,
  r.amount as receipt_amount,
  r.currency as receipt_currency,
  r.receipt_number
FROM sessions s
LEFT JOIN receipts r ON s.id = r.session_id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC;
