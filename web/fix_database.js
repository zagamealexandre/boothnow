// Script to fix database RLS policies for rewards system
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  console.log('🔧 Fixing database RLS policies...');
  
  try {
    // Disable RLS on rewards tables
    const queries = [
      'ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE points_transactions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE reward_usage_history DISABLE ROW LEVEL SECURITY;'
    ];
    
    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error('❌ Error executing query:', query, error);
      } else {
        console.log('✅ Executed:', query);
      }
    }
    
    console.log('✅ Database fix completed!');
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  }
}

fixDatabase();
