const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPaymentColumns() {
  try {
    console.log('🔧 Adding payment columns to users table...');
    
    // Try to add columns using raw SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS customer_email TEXT,
        ADD COLUMN IF NOT EXISTS customer_name TEXT;
      `
    });
    
    if (error) {
      console.log('📝 Manual SQL required. Please run this in your Supabase SQL editor:');
      console.log('');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_email TEXT;');
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_name TEXT;');
      console.log('');
      console.log('UPDATE users SET payment_type = \'pay_per_use\' WHERE payment_type IS NULL;');
      console.log('');
    } else {
      console.log('✅ Columns added successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('📝 Please run this SQL manually in Supabase:');
    console.log('');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_email TEXT;');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_name TEXT;');
    console.log('');
    console.log('UPDATE users SET payment_type = \'pay_per_use\' WHERE payment_type IS NULL;');
  }
}

addPaymentColumns();
