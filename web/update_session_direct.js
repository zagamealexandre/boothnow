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

async function updateSessionsDirectly() {
  console.log('🔧 Updating sessions directly...');
  
  try {
    // Try to update with a different approach - using raw SQL if possible
    // First, let's try updating one session at a time with more verbose error handling
    
    const sessionId = '61a4e1c8-56a8-4399-9c61-f6bbabbbb034';
    
    console.log(`📊 Updating session ${sessionId}...`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('sessions')
      .update({ 
        clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj' 
      })
      .eq('id', sessionId)
      .select();

    console.log('Update result:', { updateResult, updateError });

    if (updateError) {
      console.error(`❌ Error updating session ${sessionId}:`, updateError);
      
      // Try to get more details about the error
      console.log('Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log(`✅ Session ${sessionId} updated successfully:`, updateResult);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateSessionsDirectly();
