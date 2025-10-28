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

async function fixSessionsClerkUserId() {
  console.log('🔧 Fixing sessions clerk_user_id...');
  
  try {
    // Update sessions to have the correct clerk_user_id
    const { data: updateResult, error: updateError } = await supabase
      .from('sessions')
      .update({ 
        clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj' 
      })
      .eq('clerk_user_id', '72cb825b-1543-4a6b-a587-492199a0e025');

    if (updateError) {
      console.error('❌ Error updating sessions:', updateError);
    } else {
      console.log('✅ Sessions updated successfully');
    }

    // Verify the update
    const { data: sessions, error: verifyError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, status')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj');

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification successful. Sessions found:', sessions.length);
      console.log('Sessions:', sessions);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixSessionsClerkUserId();
