import { useAuth } from '@clerk/nextjs';
import { pointsService } from '../services/pointsService';

export const usePointsEarning = () => {
  const { userId } = useAuth();

  const awardBoothSessionPoints = async (sessionId: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await pointsService.awardBoothSessionPoints(userId, sessionId);
      if (result.success) {
        console.log('✅ Awarded 50 points for booth session');
      }
      return result;
    } catch (error) {
      console.error('❌ Error awarding booth session points:', error);
      return { success: false, error: 'Failed to award points' };
    }
  };

  const awardAdvanceBookingPoints = async (bookingId: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await pointsService.awardAdvanceBookingPoints(userId, bookingId);
      if (result.success) {
        console.log('✅ Awarded 25 points for advance booking');
      }
      return result;
    } catch (error) {
      console.error('❌ Error awarding advance booking points:', error);
      return { success: false, error: 'Failed to award points' };
    }
  };

  const awardFriendInvitePoints = async (inviteId: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await pointsService.awardFriendInvitePoints(userId, inviteId);
      if (result.success) {
        console.log('✅ Awarded 100 points for friend invite');
      }
      return result;
    } catch (error) {
      console.error('❌ Error awarding friend invite points:', error);
      return { success: false, error: 'Failed to award points' };
    }
  };

  const awardReviewPoints = async (reviewId: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await pointsService.awardReviewPoints(userId, reviewId);
      if (result.success) {
        console.log('✅ Awarded 10 points for review');
      }
      return result;
    } catch (error) {
      console.error('❌ Error awarding review points:', error);
      return { success: false, error: 'Failed to award points' };
    }
  };

  return {
    awardBoothSessionPoints,
    awardAdvanceBookingPoints,
    awardFriendInvitePoints,
    awardReviewPoints
  };
};
