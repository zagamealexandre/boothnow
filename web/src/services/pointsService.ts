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

      // Call the Edge Function to initialize points
      const { data, error } = await supabase.functions.invoke('initialize-user-points', {
        body: { user_id: user.id }
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
        .single()

      if (pointsError) {
        console.error('❌ PointsService - addPoints: Could not fetch current points:', pointsError);
        return { success: false, error: 'Could not fetch current points' };
      }

      // Calculate new values
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
        console.error('❌ PointsService - addPoints: Failed to update points:', updateError);
        return { success: false, error: 'Failed to update points' };
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
          description: transaction.description
        })

      if (transactionError) {
        console.warn('⚠️ PointsService - addPoints: Failed to record transaction:', transactionError);
        // Don't fail the whole operation for transaction logging failure
      }

      console.log('✅ PointsService - addPoints: Points added successfully');
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
