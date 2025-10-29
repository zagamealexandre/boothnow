-- Fix the auto_generate_receipt function to work without session_id in payments table
-- This fixes the issue where sessions can't be ended due to the trigger error

CREATE OR REPLACE FUNCTION auto_generate_receipt()
RETURNS TRIGGER AS $$
DECLARE
  receipt_data JSONB;
  booth_data RECORD;
  user_data RECORD;
BEGIN
  -- Only generate receipt for completed sessions
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get booth information
    SELECT name, partner, address INTO booth_data
    FROM booths 
    WHERE id = NEW.booth_id;
    
    -- Get user information
    SELECT first_name, last_name, email INTO user_data
    FROM users 
    WHERE id = NEW.user_id;
    
    -- Build receipt data using session information directly
    -- We don't query payments table since it may not have session_id column
    receipt_data := jsonb_build_object(
      'receipt_number', generate_receipt_number(),
      'session_id', NEW.id,
      'booth_name', COALESCE(booth_data.name, 'Booth'),
      'booth_partner', booth_data.partner,
      'booth_address', booth_data.address,
      'user_name', COALESCE(user_data.first_name || ' ' || user_data.last_name, 'User'),
      'user_email', user_data.email,
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'duration_minutes', NEW.total_minutes,
      'amount', COALESCE(NEW.cost, 0),
      'currency', 'EUR',
      'generated_at', NOW()
    );
    
    -- Insert receipt (payment_id will be NULL - we can link it later if needed)
    INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
    VALUES (
      NEW.user_id,
      NEW.id,
      NULL, -- payment_id can be NULL since we're not querying payments table
      (receipt_data->>'receipt_number'),
      (receipt_data->>'amount')::DECIMAL,
      (receipt_data->>'currency'),
      receipt_data
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
