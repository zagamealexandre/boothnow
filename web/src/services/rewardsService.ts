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
  // Award points to a user (by Clerk user id)
  async addPoints(
    clerkUserId: string,
    amount: number,
    source: string,
    sourceId?: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!amount || amount <= 0) {
        return { success: false, error: 'Invalid amount' }
      }

      // Look up internal user id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'User not found' }
      }

      // Record an earn transaction for audit and to support virtual balance
      const { error: txError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: 'earned',
          source,
          source_id: sourceId,
          description: description || `Points earned from ${source}`,
        })

      if (txError) {
        console.warn('⚠️ RewardsService - addPoints: failed inserting transaction', txError)
      }

      // Try to update persisted balance if present; if not, create it
      const { data: existing, error: pointsReadError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!pointsReadError && existing) {
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            available_points: (existing.available_points || 0) + amount,
            lifetime_earned: (existing.lifetime_earned || 0) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.warn('⚠️ RewardsService - addPoints: failed updating user_points', updateError)
        }
      } else {
        // Insert a starting balance row if it does not exist
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: user.id,
            available_points: amount,
            lifetime_earned: amount,
            total_points: amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.warn('⚠️ RewardsService - addPoints: failed inserting user_points', insertError)
        }
      }

      return { success: true }
    } catch (e: any) {
      console.error('❌ RewardsService - addPoints: Exception', e)
      return { success: false, error: 'Failed to add points' }
    }
  }
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

      // Try primary table first
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!pointsError && points) {
        return {
          id: 'existing-points-id',
          user_id: user.id,
          points: points.available_points,
          total_earned: points.lifetime_earned,
          total_spent: points.lifetime_earned - points.available_points,
          created_at: points.created_at,
          updated_at: points.updated_at
        }
      }

      // Fallback: hardcode baseline 250 and compute deltas from transactions
      console.warn('⚠️ RewardsService - getUserPoints: Falling back to baseline + transactions due to missing user_points row. Details:', pointsError)

      const { data: txAgg, error: txError } = await supabase
        .from('points_transactions')
        .select('amount')
        .eq('user_id', user.id)

      let delta = 0
      if (!txError && Array.isArray(txAgg)) {
        delta = txAgg.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)
      }

      const baseline = 250
      const computedAvailable = Math.max(0, baseline + delta)

      return {
        id: 'virtual-points',
        user_id: user.id,
        points: computedAvailable,
        total_earned: Math.max(0, baseline + Math.max(0, delta)),
        total_spent: Math.max(0, -Math.min(0, delta)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
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

      // Try to read persisted points (may not exist)
      const { data: userPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned')
        .eq('user_id', user.id)
        .maybeSingle()

      let canAfford = false
      let newAvailable = 0

      if (!pointsError && userPoints) {
        canAfford = userPoints.available_points >= reward.cost
        newAvailable = userPoints.available_points - reward.cost
      } else {
        // Virtual balance path: baseline 250 + transactions
        const { data: txAgg, error: txError } = await supabase
          .from('points_transactions')
          .select('amount')
          .eq('user_id', user.id)
        const delta = !txError && Array.isArray(txAgg) ? txAgg.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0) : 0
        const virtual = 250 + delta
        canAfford = virtual >= reward.cost
        newAvailable = virtual - reward.cost
      }

      if (!canAfford) {
        return { success: false, error: 'Insufficient points' }
      }

      // If persisted points exists, update it; otherwise log a spend transaction only
      if (userPoints) {
        const { error: deductError } = await supabase
          .from('user_points')
          .update({
            available_points: newAvailable,
            total_points: newAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (deductError) {
          return { success: false, error: 'Failed to deduct points' }
        }
      }

      // Record spend transaction for audit and for virtual balance path
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -reward.cost,
          transaction_type: 'spent',
          source: 'reward_claim',
          source_id: String(rewardId),
          description: `Claimed reward ${rewardId}`
        })

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