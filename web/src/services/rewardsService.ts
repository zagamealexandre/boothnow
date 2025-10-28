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
  earned_at: string
  used_at?: string
  is_used: boolean
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
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (pointsError) {
        console.error('❌ RewardsService - getUserPoints: Error fetching points:', pointsError);
        return null;
      }

      return points;
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
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('❌ RewardsService - getAvailableRewards: Error fetching rewards:', error);
        return [];
      }

      return rewards || [];
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
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

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
      console.log('🔧 RewardsService - claimReward: Claiming reward:', rewardId, 'for user:', clerkUserId);

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
        .from('rewards')
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
        .select('points')
        .eq('user_id', user.id)
        .single()

      if (pointsError || !userPoints) {
        return { success: false, error: 'Could not fetch user points' };
      }

      if (userPoints.points < reward.points_required) {
        return { success: false, error: 'Insufficient points' };
      }

      // Deduct points and create user reward
      const { error: deductError } = await supabase
        .from('user_points')
        .update({
          points: userPoints.points - reward.points_required,
          total_spent: userPoints.points - reward.points_required,
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
          earned_at: new Date().toISOString(),
          is_used: false
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

  // Add points to user (used by boothService)
  async addPoints(clerkUserId: string, points: number, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 RewardsService - addPoints: Adding', points, 'points to user:', clerkUserId, 'for:', reason);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Get current points
      const { data: currentPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('points, total_earned')
        .eq('user_id', user.id)
        .single()

      if (pointsError) {
        // Create new points record if doesn't exist
        const { error: createError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            points: points,
            total_earned: points,
            total_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (createError) {
          return { success: false, error: 'Failed to create points record' };
        }
      } else {
        // Update existing points
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            points: (currentPoints.points || 0) + points,
            total_earned: (currentPoints.total_earned || 0) + points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          return { success: false, error: 'Failed to update points' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ RewardsService - addPoints: Exception:', error);
      return { success: false, error: 'An error occurred' };
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