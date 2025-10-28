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
    // Update each session individually by ID
    const sessionIds = [
      '61a4e1c8-56a8-4399-9c61-f6bbabbbb034',
      'c726659a-aa7b-4d5d-ae93-1ef3ad989e70'
    ];

    for (const sessionId of sessionIds) {
      const { data: updateResult, error: updateError } = await supabase
        .from('sessions')
        .update({ 
          clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj' 
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error(`❌ Error updating session ${sessionId}:`, updateError);
      } else {
        console.log(`✅ Session ${sessionId} updated successfully`);
      }
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
