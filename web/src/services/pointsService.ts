// Points service for managing user points and rewards
import { supabase } from '../lib/supabase'

export interface PointsTransaction {
  amount: number
  transaction_type: 'earned' | 'spent' | 'bonus' | 'refund'
  source: string
  source_id?: string
  description?: string
}

class PointsService {
  // Initialize user points with welcome bonus
  async initializeUserPoints(clerkUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 PointsService - initializeUserPoints: Initializing points for user:', clerkUserId);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        console.error('❌ PointsService - initializeUserPoints: User not found:', userError);
        return { success: false, error: 'User not found' };
      }

      // Call the Edge Function to initialize points (expects clerkUserId)
      const { data, error } = await supabase.functions.invoke('initialize-user-points', {
        body: { clerkUserId }
      })

      if (error) {
        console.error('❌ PointsService - initializeUserPoints: Edge function error:', error);
        return { success: false, error: 'Failed to initialize points' };
      }

      console.log('✅ PointsService - initializeUserPoints: Points initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ PointsService - initializeUserPoints: Exception:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Add points to user
  async addPoints(clerkUserId: string, transaction: PointsTransaction): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 PointsService - addPoints: Adding', transaction.amount, 'points to user:', clerkUserId, 'for:', transaction.source);

      // Get user's internal ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (userError || !user) {
        console.error('❌ PointsService - addPoints: User not found:', userError);
        return { success: false, error: 'User not found' };
      }

      // Get current points
      const { data: currentPoints, error: pointsError } = await supabase
        .from('user_points')
        .select('available_points, lifetime_earned')
        .eq('user_id', user.id)
        .maybeSingle()

      if (pointsError) {
        if (pointsError.code === 'PGRST116') {
          // No points record exists, initialize with welcome bonus first
          console.log('🔧 PointsService - addPoints: No points record found, initializing first');
          const initResult = await this.initializeUserPoints(clerkUserId);
          if (!initResult.success) {
            return { success: false, error: 'Failed to initialize user points' };
          }
          
          // Now get the newly created points record
          // small retry window after initialization to let row become visible
          const retryFetch = async (retries = 3, delayMs = 250): Promise<{ data: any; error: any }> => {
            for (let i = 0; i < retries; i++) {
              const { data, error } = await supabase
                .from('user_points')
                .select('available_points, lifetime_earned')
                .eq('user_id', user.id)
                .maybeSingle()
              if (data || i === retries - 1) return { data, error }
              await new Promise(res => setTimeout(res, delayMs))
            }
            return { data: null, error: { message: 'Retry failed' } }
          }

          const { data: newPoints, error: newPointsError } = await retryFetch()
            
          if (newPointsError || !newPoints) {
            return { success: false, error: 'Failed to fetch initialized points' };
          }
          
          // Use the newly created points
          const newAvailablePoints = newPoints.available_points + transaction.amount
          const newLifetimeEarned = newPoints.lifetime_earned + (transaction.amount > 0 ? transaction.amount : 0)
          
          // Update points
          const { error: updateError } = await supabase
            .from('user_points')
            .update({
              available_points: newAvailablePoints,
              total_points: newAvailablePoints,
              lifetime_earned: newLifetimeEarned,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (updateError) {
            return { success: false, error: 'Failed to update user points' };
          }
        } else {
          console.error('❌ PointsService - addPoints: Could not fetch current points:', pointsError);
          return { success: false, error: 'Could not fetch current points' };
        }
      } else if (currentPoints) {
        // Points record exists, proceed with normal update
        const newAvailablePoints = currentPoints.available_points + transaction.amount
        const newLifetimeEarned = currentPoints.lifetime_earned + (transaction.amount > 0 ? transaction.amount : 0)
        
        // Update points
        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            available_points: newAvailablePoints,
            total_points: newAvailablePoints,
            lifetime_earned: newLifetimeEarned,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          return { success: false, error: 'Failed to update user points' };
        }
      } else {
        // No points row and no error: fall back to virtual baseline = 250
        console.warn('⚠️ PointsService - addPoints: No points row, using virtual baseline');
        // Just log transaction; computed balances will come from RewardsService
      }

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          source: transaction.source,
          source_id: transaction.source_id,
          description: transaction.description ?? `Points ${transaction.transaction_type}: ${transaction.amount} for ${transaction.source}`
        });

      if (transactionError) {
        console.warn('⚠️ PointsService - addPoints: Failed to log points transaction:', transactionError);
      }

      console.log(`✅ PointsService - addPoints: Updated points by ${transaction.amount} for ${clerkUserId} (${transaction.source})`);
      return { success: true };
    } catch (error) {
      console.error('❌ PointsService - addPoints: Exception:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Deduct points from user
  async deductPoints(clerkUserId: string, amount: number, source: string, sourceId?: string, description?: string): Promise<{ success: boolean; error?: string }> {
    return this.addPoints(clerkUserId, {
      amount: -amount,
      transaction_type: 'spent',
      source,
      source_id: sourceId,
      description
    });
  }

  // Award points for specific actions
  async awardBoothSessionPoints(clerkUserId: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
    return this.addPoints(clerkUserId, {
      amount: 50,
      transaction_type: 'earned',
      source: 'booth_session',
      source_id: sessionId,
      description: 'Completed a booth session'
    });
  }

  async awardAdvanceBookingPoints(clerkUserId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
    return this.addPoints(clerkUserId, {
      amount: 25,
      transaction_type: 'earned',
      source: 'advance_booking',
      source_id: bookingId,
      description: 'Booked in advance'
    });
  }

  async awardFriendInvitePoints(clerkUserId: string, inviteId: string): Promise<{ success: boolean; error?: string }> {
    return this.addPoints(clerkUserId, {
      amount: 100,
      transaction_type: 'earned',
      source: 'friend_invite',
      source_id: inviteId,
      description: 'Invited a friend'
    });
  }

  async awardReviewPoints(clerkUserId: string, reviewId: string): Promise<{ success: boolean; error?: string }> {
    return this.addPoints(clerkUserId, {
      amount: 10,
      transaction_type: 'earned',
      source: 'review',
      source_id: reviewId,
      description: 'Left a review'
    });
  }
}

export const pointsService = new PointsService()
