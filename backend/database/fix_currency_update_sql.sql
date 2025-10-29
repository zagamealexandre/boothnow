-- Fixed SQL to update currency from EUR to SEK
-- This avoids the polymorphic type error

-- Update sessions table
UPDATE sessions 
SET cost = cost * 10 -- Convert from EUR to SEK (1 EUR ≈ 10 SEK)
WHERE cost IS NOT NULL;

-- Update receipts table - simpler approach
UPDATE receipts 
SET 
  amount = amount * 10, -- Convert from EUR to SEK
  currency = 'SEK'
WHERE currency = 'EUR';

-- Update the receipt_data JSON field separately
UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    receipt_data,
    '{amount}',
    to_jsonb(amount)
  )
WHERE currency = 'SEK';

UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    receipt_data,
    '{currency}',
    to_jsonb('SEK')
  )
WHERE currency = 'SEK';

-- Update payments table
UPDATE payments 
SET 
  amount = amount * 10, -- Convert from EUR to SEK
  currency = 'SEK'
WHERE currency = 'EUR';
