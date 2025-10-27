-- Add payment method columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS creem_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method_setup BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'pay_per_use';

-- Add payment intent column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS creem_payment_intent_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'session_charge';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_creem_customer_id ON users(creem_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_creem_payment_intent_id ON payments(creem_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- Update existing users to have default payment type
UPDATE users SET payment_type = 'pay_per_use' WHERE payment_type IS NULL;

COMMIT;
