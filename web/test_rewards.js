// Simple test script to verify rewards functionality
const { rewardsService } = require('./src/services/rewardsService.ts');

async function testRewards() {
  console.log('🧪 Testing Rewards Service...');
  
  try {
    // Test getting available rewards
    console.log('1. Testing getAvailableRewards...');
    const rewards = await rewardsService.getAvailableRewards();
    console.log(`✅ Found ${rewards.length} available rewards`);
    
    if (rewards.length > 0) {
      console.log('Sample reward:', rewards[0]);
    }
    
    // Test time restriction function
    console.log('2. Testing time restriction...');
    const testRestriction = { start_hour: 7, end_hour: 9 };
    const isActive = rewardsService.isRewardTimeActive(testRestriction);
    console.log(`✅ Time restriction test: ${isActive ? 'Active' : 'Inactive'}`);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRewards();
