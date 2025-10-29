-- Add receipts system for automatic receipt generation
-- This adds a receipts table and related functionality

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'downloaded')),
  receipt_data JSONB NOT NULL, -- Contains all receipt details
  pdf_url TEXT, -- URL to generated PDF
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_session_id ON receipts(session_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Receipts policies
CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own receipts" ON receipts
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  receipt_number TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  receipt_number := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get count of receipts for today
  SELECT COUNT(*) + 1 INTO counter
  FROM receipts 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format as YYYYMMDD-XXXX
  receipt_number := receipt_number || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate receipt for completed sessions
CREATE OR REPLACE FUNCTION auto_generate_receipt()
RETURNS TRIGGER AS $$
DECLARE
  receipt_data JSONB;
  booth_data RECORD;
  user_data RECORD;
  payment_data RECORD;
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
    
    -- Get payment information if exists
    SELECT amount, currency, transaction_id, created_at INTO payment_data
    FROM payments 
    WHERE session_id = NEW.id 
    AND status = 'completed'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Build receipt data
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
      'amount', COALESCE(payment_data.amount, NEW.cost),
      'currency', COALESCE(payment_data.currency, 'EUR'),
      'transaction_id', payment_data.transaction_id,
      'payment_date', COALESCE(payment_data.created_at, NEW.created_at),
      'generated_at', NOW()
    );
    
    -- Insert receipt
    INSERT INTO receipts (user_id, session_id, payment_id, receipt_number, amount, currency, receipt_data)
    VALUES (
      NEW.user_id,
      NEW.id,
      (SELECT id FROM payments WHERE session_id = NEW.id AND status = 'completed' ORDER BY created_at DESC LIMIT 1),
      (receipt_data->>'receipt_number'),
      (receipt_data->>'amount')::DECIMAL,
      (receipt_data->>'currency'),
      receipt_data
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate receipts
DROP TRIGGER IF EXISTS trigger_auto_generate_receipt ON sessions;
CREATE TRIGGER trigger_auto_generate_receipt
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_receipt();

-- Grant permissions
GRANT ALL ON TABLE receipts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_receipt() TO anon, authenticated;
