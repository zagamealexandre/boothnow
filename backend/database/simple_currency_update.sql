-- Simple currency update to SEK - avoids polymorphic type errors
-- Run these one by one if needed

-- Step 1: Update sessions table
UPDATE sessions 
SET cost = cost * 10
WHERE cost IS NOT NULL;

-- Step 2: Update receipts table amount and currency
UPDATE receipts 
SET 
  amount = amount * 10,
  currency = 'SEK'
WHERE currency = 'EUR';

-- Step 3: Update payments table
UPDATE payments 
SET 
  amount = amount * 10,
  currency = 'SEK'
WHERE currency = 'EUR';

-- Step 4: Update receipt_data JSON (using explicit casting)
UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    receipt_data,
    '{amount}',
    (amount::text)::jsonb
  )
WHERE currency = 'SEK';

-- Step 5: Update receipt_data currency in JSON
UPDATE receipts 
SET 
  receipt_data = jsonb_set(
    receipt_data,
    '{currency}',
    '"SEK"'::jsonb
  )
WHERE currency = 'SEK';
