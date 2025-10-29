-- Fix RLS policies for receipts table to allow automatic receipt generation
-- The trigger needs to bypass RLS when inserting receipts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can create own receipts" ON receipts;

-- Create new policies that work with the trigger
CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Allow system to create receipts (bypass RLS for inserts)
CREATE POLICY "System can create receipts" ON receipts
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own receipts (for download status)
CREATE POLICY "Users can update own receipts" ON receipts
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Grant necessary permissions to the service role
GRANT ALL ON TABLE receipts TO service_role;
GRANT EXECUTE ON FUNCTION auto_generate_receipt() TO service_role;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO service_role;
