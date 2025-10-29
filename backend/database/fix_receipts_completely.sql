-- Complete fix for receipts system - bypass RLS for triggers
-- This ensures receipts are generated automatically when sessions are completed

-- First, disable RLS temporarily to fix the trigger
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION auto_generate_receipt()
RETURNS TRIGGER AS $$
DECLARE
  receipt_data JSONB;
  booth_data RECORD;
  user_data RECORD;
  receipt_number TEXT;
BEGIN
  -- Only generate receipt for completed sessions
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
      'currency', 'EUR',
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
        'EUR',
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_receipt ON sessions;
CREATE TRIGGER trigger_auto_generate_receipt
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_receipt();

-- Re-enable RLS with proper policies
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "System can create receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;

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

-- Grant permissions
GRANT ALL ON TABLE receipts TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auto_generate_receipt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO anon, authenticated, service_role;
