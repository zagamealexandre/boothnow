-- Update all currency references from EUR to SEK
-- This updates the database to use Swedish Krona instead of Euro

-- Update sessions table
UPDATE sessions 
SET cost = cost * 10 -- Convert from EUR to SEK (1 EUR ≈ 10 SEK)
WHERE cost IS NOT NULL;

-- Update receipts table
UPDATE receipts 
SET 
  amount = amount * 10, -- Convert from EUR to SEK
  currency = 'SEK',
  receipt_data = jsonb_set(
    jsonb_set(
      receipt_data,
      '{amount}',
      to_jsonb(amount * 10)
    ),
    '{currency}',
    to_jsonb('SEK')
  )
WHERE currency = 'EUR';

-- Update payments table
UPDATE payments 
SET 
  amount = amount * 10, -- Convert from EUR to SEK
  currency = 'SEK'
WHERE currency = 'EUR';

-- Update any other tables that might have currency references
-- (Add more updates as needed based on your schema)
