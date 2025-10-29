-- Fix existing receipts to use actual session costs instead of hardcoded values

-- Update receipts with actual session costs
UPDATE receipts 
SET 
  amount = COALESCE(s.cost, 0),
  receipt_data = jsonb_set(
    receipt_data, 
    '{amount}', 
    to_jsonb(COALESCE(s.cost, 0))
  )
FROM sessions s
WHERE receipts.session_id = s.id
  AND s.status = 'completed';

-- Also update the receipt_data JSON with correct values
UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        receipt_data,
        '{amount}',
        to_jsonb(COALESCE(s.cost, 0))
      ),
      '{duration_minutes}',
      to_jsonb(COALESCE(s.total_minutes, 0))
    ),
    '{booth_name}',
    to_jsonb(COALESCE(b.name, 'Booth'))
  )
FROM sessions s
LEFT JOIN booths b ON s.booth_id = b.id
WHERE receipts.session_id = s.id
  AND s.status = 'completed';
