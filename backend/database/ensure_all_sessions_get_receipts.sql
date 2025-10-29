-- Update trigger to use SEK currency and ensure all completed sessions get receipts
-- This will fix the trigger and backfill missing receipts

-- Step 1: Update the trigger function to use SEK
CREATE OR REPLACE FUNCTION auto_generate_receipt()
RETURNS TRIGGER AS $$
DECLARE
  receipt_data JSONB;
  booth_data RECORD;
  user_data RECORD;
  receipt_number TEXT;
BEGIN
  -- Generate receipt for ALL completed sessions, regardless of cost
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get booth information
    SELECT name, partner, address INTO booth_data
    FROM booths 
    WHERE id = NEW.booth_id;
    
    -- Get user information
    SELECT first_name, last_name, email INTO user_data
    FROM users 
    WHERE id = NEW.user_id;
    
    -- Generate receipt number
    SELECT generate_receipt_number() INTO receipt_number;
    
    -- Build receipt data using session information directly
    receipt_data := jsonb_build_object(
      'receipt_number', receipt_number,
      'session_id', NEW.id,
      'booth_name', COALESCE(booth_data.name, 'Booth'),
      'booth_partner', COALESCE(booth_data.partner, 'Unknown'),
      'booth_address', COALESCE(booth_data.address, 'Unknown'),
      'user_name', COALESCE(user_data.first_name || ' ' || user_data.last_name, 'User'),
      'user_email', COALESCE(user_data.email, 'unknown@example.com'),
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'duration_minutes', COALESCE(NEW.total_minutes, 0),
      'amount', COALESCE(NEW.cost, 0),
      'currency', 'SEK',
      'generated_at', NOW()
    );
    
    -- Insert receipt (with error handling)
    BEGIN
      INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
      VALUES (
        NEW.user_id,
        NEW.id,
        NULL,
        receipt_number,
        COALESCE(NEW.cost, 0),
        'SEK',
        receipt_data
      );
      
      -- Log success
      RAISE NOTICE 'Receipt generated successfully for session %', NEW.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the session update
        RAISE WARNING 'Failed to generate receipt for session %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Temporarily disable RLS to allow system inserts
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Step 3: Generate receipts for all completed sessions that don't have receipts
-- Use a function to generate receipt numbers properly
DO $$
DECLARE
  session_record RECORD;
  receipt_num TEXT;
  receipt_data JSONB;
BEGIN
  FOR session_record IN 
    SELECT 
      s.id as session_id,
      s.user_id,
      s.booth_id,
      s.cost,
      s.total_minutes,
      s.start_time,
      s.end_time,
      s.created_at,
      b.name as booth_name,
      b.partner as booth_partner,
      b.address as booth_address,
      u.first_name,
      u.last_name,
      u.email
    FROM sessions s
    LEFT JOIN receipts r ON s.id = r.session_id
    LEFT JOIN booths b ON s.booth_id = b.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.status = 'completed' 
      AND r.id IS NULL  -- Only sessions without receipts
    ORDER BY s.created_at
  LOOP
    -- Generate receipt number using the function
    SELECT generate_receipt_number() INTO receipt_num;
    
    -- Build receipt data
    receipt_data := jsonb_build_object(
      'receipt_number', receipt_num,
      'session_id', session_record.session_id,
      'booth_name', COALESCE(session_record.booth_name, 'Booth'),
      'booth_partner', COALESCE(session_record.booth_partner, 'Unknown'),
      'booth_address', COALESCE(session_record.booth_address, 'Unknown'),
      'user_name', COALESCE(session_record.first_name || ' ' || session_record.last_name, 'User'),
      'user_email', COALESCE(session_record.email, 'unknown@example.com'),
      'start_time', session_record.start_time,
      'end_time', session_record.end_time,
      'duration_minutes', COALESCE(session_record.total_minutes, 0),
      'amount', COALESCE(session_record.cost, 0),
      'currency', 'SEK',
      'generated_at', NOW()
    );
    
    -- Insert receipt
    INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
    VALUES (
      session_record.user_id,
      session_record.session_id,
      NULL,
      receipt_num,
      COALESCE(session_record.cost, 0),
      'SEK',
      receipt_data
    );
  END LOOP;
END $$;

-- Step 4: Re-enable RLS with proper policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Allow receipt inserts" ON receipts;

-- Create new policies
CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can update own receipts" ON receipts
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Allow inserts (for triggers and system operations)
CREATE POLICY "Allow receipt inserts" ON receipts
  FOR INSERT WITH CHECK (true);

-- Step 5: Verify the results
SELECT 
  s.id as session_id,
  s.cost as session_cost,
  s.total_minutes,
  s.status,
  r.amount as receipt_amount,
  r.currency as receipt_currency,
  r.receipt_number,
  CASE WHEN r.id IS NULL THEN 'MISSING RECEIPT' ELSE 'HAS RECEIPT' END as receipt_status
FROM sessions s
LEFT JOIN receipts r ON s.id = r.session_id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC
LIMIT 20;
