const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in environment variables.');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSessions() {
  console.log('🔧 Checking sessions...');
  
  try {
    // Check all sessions
    const { data: allSessions, error: allError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, user_id, status');

    if (allError) {
      console.error('❌ Error fetching sessions:', allError);
      return;
    }

    console.log('📊 All sessions:', allSessions);

    // Check sessions with the correct clerk_user_id
    const { data: correctSessions, error: correctError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, status')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj');

    if (correctError) {
      console.error('❌ Error fetching correct sessions:', correctError);
    } else {
      console.log('📊 Sessions with correct clerk_user_id:', correctSessions);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSessions();
