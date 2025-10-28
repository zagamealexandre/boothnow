// Fix database cost values
// Run this with: node fix_database_costs.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixSessionsCost() {
  console.log('🔍 Checking current sessions...');
  
  // First, let's see what we have
  const { data: sessions, error: selectError } = await supabase
    .from('sessions')
    .select('id, start_time, cost, cost_per_minute, total_minutes, status, booth_name')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (selectError) {
    console.error('❌ Select error:', selectError);
    return;
  }
  
  console.log('📊 Current active sessions:', sessions.length);
  sessions.forEach(session => {
    console.log('Session:', {
      id: session.id,
      start_time: session.start_time,
      cost: session.cost,
      cost_per_minute: session.cost_per_minute,
      total_minutes: session.total_minutes,
      booth_name: session.booth_name
    });
  });
  
  // Fix cost_per_minute
  console.log('🔧 Updating cost_per_minute to 0.50...');
  const { error: updateCostPerMinute } = await supabase
    .from('sessions')
    .update({ cost_per_minute: 0.50 })
    .or('cost_per_minute.eq.2.50,cost_per_minute.is.null');
  
  if (updateCostPerMinute) {
    console.error('❌ Update cost_per_minute error:', updateCostPerMinute);
    return;
  }
  
  // Clear hardcoded cost
  console.log('🔧 Clearing hardcoded cost values...');
  const { error: updateCost } = await supabase
    .from('sessions')
    .update({ cost: null })
    .not('cost', 'is', null);
  
  if (updateCost) {
    console.error('❌ Update cost error:', updateCost);
    return;
  }
  
  console.log('✅ Database updated successfully!');
  
  // Verify the changes
  console.log('🔍 Verifying changes...');
  const { data: updatedSessions, error: verifyError } = await supabase
    .from('sessions')
    .select('id, start_time, cost, cost_per_minute, total_minutes, status, booth_name')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (verifyError) {
    console.error('❌ Verify error:', verifyError);
    return;
  }
  
  updatedSessions.forEach(session => {
    const startTime = new Date(session.start_time);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    const calculatedCost = elapsedMinutes * session.cost_per_minute;
    
    console.log('Updated Session:', {
      id: session.id,
      start_time: session.start_time,
      cost: session.cost,
      cost_per_minute: session.cost_per_minute,
      elapsed_minutes: Math.round(elapsedMinutes),
      calculated_cost: Math.round(calculatedCost * 100) / 100,
      booth_name: session.booth_name
    });
  });
}

fixSessionsCost().catch(console.error);
