const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixClerkIntegration() {
  console.log('🔧 Starting Clerk Integration Fix...');
  
  try {
    // Step 1: Get all users
    console.log('\n📊 Step 1: Getting all users...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.clerk_user_id} (ID: ${user.id})`);
    });
    
    // Step 2: Find the target user
    const targetUser = allUsers.find(u => u.email === 'alexbacelo@gmail.com');
    if (!targetUser) {
      console.error('❌ Target user not found');
      return;
    }
    
    console.log(`\n🎯 Target user: ${targetUser.email} (ID: ${targetUser.id})`);
    console.log(`Current clerk_user_id: ${targetUser.clerk_user_id}`);
    
    // Step 3: Check if there are any conflicts
    const conflictingUser = allUsers.find(u => 
      u.id !== targetUser.id && 
      u.clerk_user_id === 'user_34eCo6WWGGvVDF1aLaxb4caJZMj'
    );
    
    if (conflictingUser) {
      console.log(`⚠️  Found conflicting user: ${conflictingUser.email}`);
      console.log('Clearing conflicting clerk_user_id...');
      
      const { error: clearError } = await supabase
        .from('users')
        .update({ clerk_user_id: null })
        .eq('id', conflictingUser.id);
      
      if (clearError) {
        console.error('❌ Error clearing conflict:', clearError);
        return;
      }
      
      console.log('✅ Conflict cleared');
    }
    
    // Step 4: Update the target user
    console.log('\n🔧 Step 2: Updating target user...');
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUser.id)
      .select('id, clerk_user_id, email');
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }
    
    console.log('✅ User updated:', updatedUser);
    
    // Step 5: Update sessions
    console.log('\n🔧 Step 3: Updating sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .update({ clerk_user_id: 'user_34eCo6WWGGvVDF1aLaxb4caJZMj' })
      .eq('user_id', targetUser.id)
      .select('id, clerk_user_id, user_id, status');
    
    if (sessionsError) {
      console.error('❌ Error updating sessions:', sessionsError);
    } else {
      console.log(`✅ Updated ${sessions.length} sessions:`, sessions);
    }
    
    // Step 6: Verify the fix
    console.log('\n📊 Step 4: Verifying the fix...');
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

fixClerkIntegration();
