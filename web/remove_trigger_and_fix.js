const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeTriggerAndFix() {
  console.log('🔧 Removing trigger and fixing data...');
  
  try {
    // Step 1: Remove the problematic trigger
    console.log('\n📊 Step 1: Removing trigger...');
    const { error: dropTriggerError } = await supabase
      .rpc('exec_sql', { 
        sql: 'DROP TRIGGER IF EXISTS trigger_set_clerk_user_id_users ON users;' 
      });
    
    if (dropTriggerError) {
      console.log('⚠️  Could not remove trigger via RPC, trying direct SQL...');
      // Try alternative approach
      const { error: altError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (altError) {
        console.error('❌ Database connection issue:', altError);
        return;
      }
    } else {
      console.log('✅ Trigger removed successfully');
    }
    
    // Step 2: Drop the function as well
    console.log('\n📊 Step 2: Removing function...');
    const { error: dropFunctionError } = await supabase
      .rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS set_clerk_user_id() CASCADE;' 
      });
    
    if (dropFunctionError) {
      console.log('⚠️  Could not remove function via RPC');
    } else {
      console.log('✅ Function removed successfully');
    }
    
    // Step 3: Now try to update the user
    console.log('\n🔧 Step 3: Updating user...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'alexbacelo@gmail.com')
      .select('id, clerk_user_id, email');
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }
    
    console.log('✅ User updated:', updatedUser);
    
    // Step 4: Update sessions
    console.log('\n🔧 Step 4: Updating sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .update({ clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj' })
      .eq('user_id', updatedUser[0].id)
      .select('id, clerk_user_id, user_id, status');
    
    if (sessionsError) {
      console.error('❌ Error updating sessions:', sessionsError);
    } else {
      console.log(`✅ Updated ${sessions.length} sessions:`, sessions);
    }
    
    // Step 5: Verify the fix
    console.log('\n📊 Step 5: Verifying the fix...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, clerk_user_id, email')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj');
    
    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
    } else {
      console.log('✅ User verification:', verifyUser);
    }
    
    const { data: verifySessions, error: verifySessionsError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, user_id, status')
      .eq('clerk_user_id', 'user_34eCo6WWGGvVDF1aLaxb4caJZMj');
    
    if (verifySessionsError) {
      console.error('❌ Error verifying sessions:', verifySessionsError);
    } else {
      console.log(`✅ Sessions verification: ${verifySessions.length} sessions found`);
    }
    
    console.log('\n🎉 Clerk integration fix completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

removeTriggerAndFix();
