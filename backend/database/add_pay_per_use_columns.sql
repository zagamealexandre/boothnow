-- Add columns for pay-per-use payment model
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Update existing users to have payment_type if not set
UPDATE users 
SET payment_type = 'pay_per_use' 
WHERE payment_type IS NULL;
