const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixClerkIntegration() {
  console.log('🔧 Starting Clerk Integration Fix...');
  
  try {
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current state...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id, email');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('Current users:', users);
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, user_id, status');
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      return;
    }
    
    console.log('Current sessions:', sessions);
    
    // Step 2: Get the correct Clerk user ID from environment or prompt
    // For now, we'll use the one from the fix script
    const correctClerkUserId = 'user_34eCo6WWGGvVDF1aLaxb4caJZMj';
    const userEmail = 'alexbacelo@gmail.com';
    
    console.log(`\n🔧 Step 2: Fixing user with email: ${userEmail}`);
    console.log(`Setting clerk_user_id to: ${correctClerkUserId}`);
    
    // Step 3: Update the user's clerk_user_id
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('users')
      .update({ clerk_user_id: correctClerkUserId })
      .eq('email', userEmail)
      .select('id, clerk_user_id, email');
    
    if (updateUserError) {
      console.error('❌ Error updating user:', updateUserError);
      return;
    }
    
    console.log('✅ User updated:', updatedUser);
    
    // Step 4: Update all sessions to use the correct clerk_user_id
    console.log('\n🔧 Step 3: Updating sessions...');
    
    const { data: updatedSessions, error: updateSessionsError } = await supabase
      .from('sessions')
      .update({ clerk_user_id: correctClerkUserId })
      .eq('clerk_user_id', '4c035c6f-b0cb-4e9f-8cb1-99b0d9aad6c1')
      .select('id, clerk_user_id, user_id, status');
    
    if (updateSessionsError) {
      console.error('❌ Error updating sessions:', updateSessionsError);
      return;
    }
    
    console.log('✅ Sessions updated:', updatedSessions);
    
    // Step 5: Verify the fix
    console.log('\n📊 Step 4: Verifying the fix...');
    
    const { data: verifyUsers, error: verifyUsersError } = await supabase
      .from('users')
      .select('id, clerk_user_id, email')
      .eq('clerk_user_id', correctClerkUserId);
    
    if (verifyUsersError) {
      console.error('❌ Error verifying users:', verifyUsersError);
    } else {
      console.log('✅ Users with correct clerk_user_id:', verifyUsers);
    }
    
    const { data: verifySessions, error: verifySessionsError } = await supabase
      .from('sessions')
      .select('id, clerk_user_id, user_id, status')
      .eq('clerk_user_id', correctClerkUserId);
    
    if (verifySessionsError) {
      console.error('❌ Error verifying sessions:', verifySessionsError);
    } else {
      console.log('✅ Sessions with correct clerk_user_id:', verifySessions);
    }
    
    console.log('\n🎉 Clerk integration fix completed!');
    console.log('\nNext steps:');
    console.log('1. Test user authentication and booking creation');
    console.log('2. Verify that new bookings are properly associated with users');
    console.log('3. Monitor the console logs for any remaining issues');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixClerkIntegration();
