-- Update receipts with the corrected session costs

-- First, update the receipts table with correct amounts
UPDATE receipts 
SET 
  amount = COALESCE(s.cost, 0),
  updated_at = NOW()
FROM sessions s
WHERE receipts.session_id = s.id
  AND s.status = 'completed';

-- Update the receipt_data JSON with correct values
UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    jsonb_set(
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
    ),
    '{booth_partner}',
    to_jsonb(COALESCE(b.partner, 'Unknown'))
  ),
  updated_at = NOW()
FROM sessions s
LEFT JOIN booths b ON s.booth_id = b.id
WHERE receipts.session_id = s.id
  AND s.status = 'completed';
