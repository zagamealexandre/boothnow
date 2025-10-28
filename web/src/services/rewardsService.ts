// Rewards service for managing user points and rewards
import { supabase } from '../lib/supabase'

export interface UserPoints {
  id: string
  user_id: string
  points: number
  total_earned: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Reward {
  id: number
  title: string
  description: string
  partner: string
  points_required: number
  is_active: boolean
  time_restriction?: {
    start: string
    end: string
  }
}

export interface UserReward {
  id: string
  user_id: string
  reward_id: number
  claimed_at: string
  expires_at: string
  status: 'active' | 'used' | 'expired'
  used_at?: string
  created_at: string
  reward?: Reward
}

export interface RewardUsageHistory {
  id: string
  user_id: string
  reward_id: number
  used_at: string
  booth_id?: string
}

class RewardsService {
  // Get user's current points
  async getUserPoints(clerkUserId: string): Promise<UserPoints | null> {
    try {
      console.log('🔧 RewardsService - getUserPoints: Fetching points for user:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        console.error('❌ RewardsService - getUserPoints: User not found:', userError);
        return null;
      }

      // Get user's points
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned, created_at, updated_at')
        .eq('user_id', user.id)
        .single()

      if (pointsError) {
        // Respect RLS: if no row yet, return a zeroed structure instead of inserting
        console.warn('⚠️ RewardsService - getUserPoints: No points row or fetch error, falling back to zeros:', pointsError);
        return {
          id: 'temp',
          user_id: user.id,
          points: 0,
          total_earned: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return {
        id: 'existing-points-id',
        user_id: user.id,
        points: points.available_points,
        total_earned: points.lifetime_earned,
        total_spent: points.lifetime_earned - points.available_points,
        created_at: points.created_at,
        updated_at: points.updated_at
      };
    } catch (error) {
      console.error('❌ RewardsService - getUserPoints: Exception:', error);
      return null;
    }
  }

  // Get all available rewards
  async getAvailableRewards(): Promise<Reward[]> {
    try {
      console.log('🔧 RewardsService - getAvailableRewards: Fetching available rewards');

      const { data: rewards, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true });

      if (error) {
        console.error('❌ RewardsService - getAvailableRewards: Error fetching rewards:', error);
        return [];
      }

      // Transform the data to match the Reward interface
      const transformedRewards = (rewards || []).map(reward => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        partner: reward.partner,
        points_required: reward.cost,
        is_active: reward.is_active,
        time_restriction: reward.time_restriction
      }));

      return transformedRewards;
    } catch (error) {
      console.error('❌ RewardsService - getAvailableRewards: Exception:', error);
      return [];
    }
  }

  // Get user's earned rewards
  async getUserRewards(clerkUserId: string): Promise<UserReward[]> {
    try {
      console.log('🔧 RewardsService - getUserRewards: Fetching user rewards for:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        console.error('❌ RewardsService - getUserRewards: User not found:', userError);
        return [];
      }

      // Get user's rewards with reward details
      const { data: userRewards, error: rewardsError } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false });

      if (rewardsError) {
        console.error('❌ RewardsService - getUserRewards: Error fetching user rewards:', rewardsError);
        return [];
      }

      return userRewards || [];
    } catch (error) {
      console.error('❌ RewardsService - getUserRewards: Exception:', error);
      return [];
    }
  }

  // Claim a reward (earn it with points)
  async claimReward(clerkUserId: string, rewardId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 RewardsService - claimReward: Starting claim process for reward:', rewardId, 'for user:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single()

      if (rewardError || !reward) {
        return { success: false, error: 'Reward not found or inactive' };
      }

      // Check if user has enough points
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned')
        .eq('user_id', user.id)
        .single()

      if (pointsError || !userPoints) {
        return { success: false, error: 'Could not fetch user points' };
      }

      if (userPoints.available_points < reward.cost) {
        return { success: false, error: 'Insufficient points' };
      }

      // Deduct points and create user reward
      const { error: deductError } = await supabase
        .from('user_points')
        .update({
          available_points: userPoints.available_points - reward.cost,
          total_points: userPoints.available_points - reward.cost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (deductError) {
        return { success: false, error: 'Failed to deduct points' };
      }

      // Create user reward
      const { error: createError } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          claimed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          status: 'active'
        })

      if (createError) {
        return { success: false, error: 'Failed to create user reward' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ RewardsService - claimReward: Exception:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Use a reward (mark as used)
  async useReward(clerkUserId: string, userRewardId: string, qrCodeDataUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 RewardsService - useReward: Using reward:', userRewardId, 'for user:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Update user reward as used
      const { error: updateError } = await supabase
        .from('user_rewards')
        .update({
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', userRewardId)
        .eq('user_id', user.id)

      if (updateError) {
        return { success: false, error: 'Failed to mark reward as used' };
      }

      // Add to usage history
      const { error: historyError } = await supabase
        .from('reward_usage_history')
        .insert({
          user_id: user.id,
          reward_id: userRewardId,
          used_at: new Date().toISOString()
        })

      if (historyError) {
        console.warn('⚠️ RewardsService - useReward: Failed to add to usage history:', historyError);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ RewardsService - useReward: Exception:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Get reward usage history
  async getRewardUsageHistory(clerkUserId: string): Promise<RewardUsageHistory[]> {
    try {
      console.log('🔧 RewardsService - getRewardUsageHistory: Fetching usage history for:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        console.error('❌ RewardsService - getRewardUsageHistory: User not found:', userError);
        return [];
      }

      // Get usage history
      const { data: history, error: historyError } = await supabase
        .from('reward_usage_history')
        .select('*')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (historyError) {
        console.error('❌ RewardsService - getRewardUsageHistory: Error fetching history:', historyError);
        return [];
      }

      return history || [];
    } catch (error) {
      console.error('❌ RewardsService - getRewardUsageHistory: Exception:', error);
      return [];
    }
  }


  // Check if reward time restriction is active
  isRewardTimeActive(timeRestriction?: { start: string; end: string }): boolean {
    if (!timeRestriction) return true;

    const now = new Date();
    const start = new Date(timeRestriction.start);
    const end = new Date(timeRestriction.end);

    return now >= start && now <= end;
  }
}

export const rewardsService = new RewardsService()