const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in environment variables.');
  process.exit(1);
}

// Use anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log('🔧 Testing Supabase queries...');
  
  try {
    // Test 1: Simple users query
    console.log('\n📊 Test 1: Simple users query');
    const { data: users1, error: error1 } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .limit(1);
    
    console.log('Result:', { users1, error1 });

    // Test 2: Query with clerk_user_id filter (the failing one)
    console.log('\n📊 Test 2: Query with clerk_user_id filter');
    const { data: users2, error: error2 } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj');
    
    console.log('Result:', { users2, error2 });

    // Test 3: Sessions query
    console.log('\n📊 Test 3: Sessions query');
    const { data: sessions, error: error3 } = await supabase
      .from('sessions')
      .select('*')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj')
      .eq('status', 'completed');
    
    console.log('Result:', { sessions, error3 });

    // Test 4: Sessions query by user_id
    console.log('\n📊 Test 4: Sessions query by user_id');
    const { data: sessions2, error: error4 } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', '72cb825b-1543-4a6b-a587-492199a0e025')
      .eq('status', 'completed');
    
    console.log('Result:', { sessions2, error4 });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testQueries();
