"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  MapPin, 
  Clock, 
  Gift, 
  HelpCircle, 
  ChevronRight,
  Edit3,
  Shield,
  Star,
  Activity,
  Calendar,
  TrendingUp,
  Award,
  MessageSquare,
  Phone,
  Mail,
  LogOut,
  X,
  Coffee,
  Croissant,
  Sandwich,
  CupSoda,
  Candy,
  Timer,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { SignOutButton, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { UserProfile, UserStats, SessionHistory } from '../services/userService';
import { rewardsService, Reward, UserReward, RewardUsageHistory, UserPoints } from '../services/rewardsService';
import { pointsService } from '../services/pointsService';
import { mockRewards, mockUserData, iconMap } from '../data/rewardsData';

interface Subscription {
  id: string;
  status: string;
  product_name: string;
  current_period_end: string;
  next_transaction_date: string;
}

interface ProfileTabProps {
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  sessionHistory: SessionHistory[];
  subscriptions: Subscription[];
  onProfileUpdate: (profile: UserProfile) => void;
  initialActiveSection?: string;
}

// Reward data now imported from shared file

export default function ProfileTab({ 
  userProfile, 
  userStats, 
  sessionHistory, 
  subscriptions,
  onProfileUpdate,
  initialActiveSection = 'overview'
}: ProfileTabProps) {
  const { signOut } = useClerk()
  const router = useRouter()
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }
  const { userId } = useAuth();
  const [activeSection, setActiveSection] = useState(initialActiveSection);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    phone_number: userProfile?.phone_number || '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });
  
  // Reward states
  const [userData, setUserData] = useState({
    availablePoints: 0,
    memberTier: "Bronze",
    sessionsCompleted: 0,
    rewardsUsed: 0,
    myRewards: [],
    usageHistory: []
  });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [usageHistory, setUsageHistory] = useState<RewardUsageHistory[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeReward, setQrCodeReward] = useState<Reward | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [rewardsTab, setRewardsTab] = useState<'available' | 'my-rewards' | 'past-rewards'>('available');
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Initialize user points on first load
  useEffect(() => {
    const initializePoints = async () => {
      if (!userId) return;

      try {
        // Try to get user points first
        const userPointsData = await rewardsService.getUserPoints(userId);
        
        // If no points exist (returns zeroed object), initialize them
        if (userPointsData && userPointsData.points === 0 && userPointsData.total_earned === 0) {
          console.log('🔧 ProfileTab: No points found, initializing with welcome bonus');
          await pointsService.initializeUserPoints(userId);
        }
      } catch (error) {
        console.error('❌ ProfileTab: Error initializing points:', error);
      }
    };

    initializePoints();
  }, [userId]);

  // Load rewards data when rewards section is opened
  useEffect(() => {
    const loadRewardsData = async () => {
      if (!userId || activeSection !== 'rewards') {
        return;
      }

      try {
        setLoading(true);
        
        // Load all data in parallel
        const [rewardsData, userRewardsData, usageHistoryData, userPointsData] = await Promise.all([
          rewardsService.getAvailableRewards(),
          rewardsService.getUserRewards(userId),
          rewardsService.getRewardUsageHistory(userId),
          rewardsService.getUserPoints(userId)
        ]);

        setRewards(rewardsData);
        setUserRewards(userRewardsData);
        setUsageHistory(usageHistoryData);
        setUserPoints(userPointsData);

        // Update userData with real points
        if (userPointsData) {
          setUserData(prev => ({
            ...prev,
            availablePoints: userPointsData.points,
            myRewards: userRewardsData.map(ur => ({
              id: ur.reward_id,
              title: ur.reward?.title || 'Unknown Reward',
              partner: ur.reward?.partner || 'Unknown',
              expiresAt: ur.expires_at ? new Date(ur.expires_at).toISOString().split('T')[0] : 'Never',
              status: ur.status
            })),
            usageHistory: usageHistoryData.map(uh => ({
              id: uh.reward_id.toString(),
              title: 'Used Reward',
              partner: '7-Eleven',
              usedDate: uh.used_at
            }))
          }));
        }

        console.log('✅ ProfileTab: Rewards data loaded successfully');
      } catch (error) {
        console.error('❌ ProfileTab: Error loading rewards data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRewardsData();
  }, [userId, activeSection]);

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onProfileUpdate(updatedProfile.user);
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getActivityScore = () => {
    if (!userStats) return 0;
    const sessions = userStats.total_sessions;
    const minutes = userStats.total_time_minutes;
    
    // Calculate score based on usage patterns
    let score = 0;
    if (sessions > 0) score += 20;
    if (sessions > 5) score += 20;
    if (sessions > 20) score += 20;
    if (minutes > 300) score += 20;
    if (minutes > 1000) score += 20;
    
    return Math.min(score, 100);
  };

  const getActivityLevel = (score: number) => {
    if (score >= 80) return { 
      level: 'Booth Master', 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      tier: 'GOLD',
      nextTier: null,
      sessionsNeeded: 0
    };
    if (score >= 60) return { 
      level: 'Booth Pro', 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      tier: 'SILVER',
      nextTier: 'GOLD',
      sessionsNeeded: 20
    };
    if (score >= 40) return { 
      level: 'Booth Regular', 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      tier: 'BRONZE',
      nextTier: 'SILVER',
      sessionsNeeded: 15
    };
    return { 
      level: 'Booth Newcomer', 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      tier: 'STARTER',
      nextTier: 'BRONZE',
      sessionsNeeded: 5
    };
  };

  const activityScore = getActivityScore();
  const activityLevel = getActivityLevel(activityScore);

  // Reward functions
  const generateQRCode = async (reward: Reward) => {
    try {
      const rewardCode = `BOOTHNOW_REWARD_${reward.id}_${Date.now()}`;
      const qrDataUrl = await QRCode.toDataURL(rewardCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeDataUrl('');
    }
  };

  const handleClaimReward = async (rewardId: number) => {
    if (!userId) {
      setToastMessage('Please log in to claim rewards!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Prevent multiple simultaneous claims
    if (loading) {
      console.log('⚠️ ProfileTab: Already processing a claim, ignoring duplicate');
      return;
    }

    console.log('🔧 ProfileTab: handleClaimReward called for reward:', rewardId, 'type:', typeof rewardId);

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      console.log('❌ ProfileTab: Reward not found for ID:', rewardId);
      return;
    }

    // Check if reward is currently available (time-based validation)
    if (!rewardsService.isRewardTimeActive(reward.time_restriction)) {
      setToastMessage('This reward is not available at this time!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Check if user has enough points
    if (userPoints && reward.points_required > userPoints.points) {
      setToastMessage('Not enough points!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setLoading(true);
      console.log('🔧 ProfileTab: Calling claimReward for user:', userId, 'reward:', rewardId);
      const result = await rewardsService.claimReward(userId, rewardId);
      
      if (result.success) {
        // Reload data to get updated points and rewards
        const [userRewardsData, userPointsData] = await Promise.all([
          rewardsService.getUserRewards(userId),
          rewardsService.getUserPoints(userId)
        ]);

        setUserRewards(userRewardsData);
        setUserPoints(userPointsData);

        // Update userData
        setUserData(prev => ({
          ...prev,
          availablePoints: userPointsData?.points || prev.availablePoints,
          myRewards: userRewardsData.map(ur => ({
            id: ur.reward_id,
            title: ur.reward?.title || 'Unknown Reward',
            partner: ur.reward?.partner || 'Unknown',
            expiresAt: ur.used_at ? new Date(ur.used_at).toISOString().split('T')[0] : 'Never',
            status: ur.status
          }))
        }));
        
        setToastMessage(`"${reward.title}" claimed!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage(result.error || 'Failed to claim reward!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setToastMessage('An error occurred while claiming the reward!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUseReward = async (rewardId: number) => {
    if (!userId) {
      setToastMessage('Please log in to use rewards!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const rewardToUse = userRewards.find(r => r.reward_id === rewardId);
    
    if (rewardToUse && rewardToUse.reward) {
      setQrCodeReward(rewardToUse.reward);
      await generateQRCode(rewardToUse.reward);
      setShowQrModal(true);
    } else {
      setToastMessage('Reward not found or not available!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleQrScan = async () => {
    if (!qrCodeReward || !userId) return;

    try {
      // Find the user reward to mark as used
      const userReward = userRewards.find(r => r.reward_id === qrCodeReward.id);
      if (!userReward) {
        setToastMessage('Reward not found!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      const result = await rewardsService.useReward(userId, userReward.id, qrCodeDataUrl);
      
      if (result.success) {
        // Reload data to get updated rewards and usage history
        const [userRewardsData, usageHistoryData] = await Promise.all([
          rewardsService.getUserRewards(userId),
          rewardsService.getRewardUsageHistory(userId)
        ]);

        setUserRewards(userRewardsData);
        setUsageHistory(usageHistoryData);

        // Update userData
        setUserData(prev => ({
          ...prev,
          myRewards: userRewardsData.map(ur => ({
            id: ur.reward_id,
            title: ur.reward?.title || 'Unknown Reward',
            partner: ur.reward?.partner || 'Unknown',
            expiresAt: ur.used_at ? new Date(ur.used_at).toISOString().split('T')[0] : 'Never',
            status: ur.status
          })),
          usageHistory: usageHistoryData.map(uh => ({
            id: uh.reward_id,
            title: 'Used Reward',
            partner: '7-Eleven',
            usedDate: uh.used_at
          }))
        }));

        setToastMessage(`"${qrCodeReward.title}" used!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setShowQrModal(false);
        setQrCodeReward(null);
      } else {
        setToastMessage(result.error || 'Failed to use reward!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error using reward:', error);
      setToastMessage('An error occurred while using the reward!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Clear QR code when modal closes
  useEffect(() => {
    if (!showQrModal) {
      setQrCodeDataUrl('');
      setQrCodeReward(null);
    }
  }, [showQrModal]);

  return (
    <div className="h-full bg-[#F3F3F3] p-4 pb-24 overflow-y-auto">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && qrCodeReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Scan to Use Reward</h3>
            <p className="text-gray-700 text-center mb-6">{qrCodeReward.title}</p>
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg border border-gray-200">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Reward QR Code" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                    <p className="text-gray-500 text-sm">Generating QR Code...</p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleQrScan}
              className="w-full bg-[#2E6A9C] hover:bg-[#244E73] text-white px-4 py-3 rounded-lg text-base font-medium transition-colors mb-3"
            >
              Simulate Cashier Scan
            </button>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg text-base font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : 'Hi there!'}
              </h2>
              <p className="text-sm text-gray-500">{userProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
          </button>
        </div>

        {/* Enhanced Activity Score Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Booth Loyalty Hub</h3>
                <p className="text-sm text-gray-600">{activityLevel.tier} MEMBER</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{userStats?.total_sessions || 0}</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
          </div>

          {/* Progress Bar with Visual Elements */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress to {activityLevel.nextTier || 'MAX'}</span>
              <span className="text-sm font-medium text-gray-700">
                {userStats?.total_sessions || 0}/{activityLevel.sessionsNeeded || userStats?.total_sessions || 0}
              </span>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      activityLevel.tier === 'GOLD' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      activityLevel.tier === 'SILVER' ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      activityLevel.tier === 'BRONZE' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.min((userStats?.total_sessions || 0) / (activityLevel.sessionsNeeded || 1) * 100, 100)}%` }}
                  />
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activityLevel.tier === 'GOLD' ? 'bg-yellow-400' :
                  activityLevel.tier === 'SILVER' ? 'bg-gray-300' :
                  activityLevel.tier === 'BRONZE' ? 'bg-orange-400' :
                  'bg-blue-400'
                }`}>
                  <div className={`w-4 h-4 rounded ${
                    activityLevel.tier === 'GOLD' ? 'bg-yellow-600' :
                    activityLevel.tier === 'SILVER' ? 'bg-gray-500' :
                    activityLevel.tier === 'BRONZE' ? 'bg-orange-600' :
                    'bg-blue-600'
                  }`}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span className="font-medium">{activityLevel.nextTier || 'MAX'} TIER</span>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-4">
            <h4 className="font-bold text-gray-900 mb-3">YOUR BENEFITS</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Priority booking during peak hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Earn points for every session</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Exclusive discounts on prepaid plans</span>
              </div>
            </div>
          </div>

          {/* Points Display */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900">Points Balance</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(userStats?.total_sessions || 0) * 10}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Earn 10 points per session</p>
          </div>
        </div>
      </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={() => setActiveSection('wallet')}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Wallet</div>
                <div className="text-sm text-gray-500">Payment methods</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setActiveSection('receipts')}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Receipts</div>
                <div className="text-sm text-gray-500">Transaction history</div>
              </div>
            </div>
          </button>
        </div>

        {/* Rewards Section */}
        <div className="bg-white rounded-xl shadow-sm mb-4">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Rewards & Benefits</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => setActiveSection('rewards')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Gift className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">My Rewards</span>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  New
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('referrals')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Invite friends</span>
                <span className="text-sm text-gray-500">Get SEK 50,00 in booth credits</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

      {/* Main Content Sections */}
      <div className="space-y-3">
        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Account Settings</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => setActiveSection('profile')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Personal Information</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('notifications')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Notifications</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('privacy')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Privacy & Security</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Usage Statistics</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats?.total_sessions || 0}</div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats?.total_time_minutes || 0}</div>
                <div className="text-sm text-gray-500">Minutes Used</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">€{userStats?.total_spent?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-500">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {sessionHistory.slice(0, 3).map((session) => (
              <div key={session.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{session.booth_name}</div>
                      <div className="text-sm text-gray-500">{session.booth_address}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {session.duration_minutes || 0} min
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(session.start_time).toLocaleDateString()}
                    </div>
                    {session.cost && (
                      <div className="text-xs font-medium text-green-600 mt-1">
                        ${session.cost.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {sessionHistory.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Pricing & Subscriptions</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => setActiveSection('pricing')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Plans & Pricing</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('subscriptions')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">My Subscriptions</span>
                {subscriptions.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {subscriptions.length}
                  </span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('payment-methods')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Payment Methods</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Support & Help */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Support & Help</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => setActiveSection('help')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Help Center</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('feedback')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Give us feedback</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => setActiveSection('contact')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Contact Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleSignOut}
          className="w-full bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section Modal */}
      {activeSection === 'pricing' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Plans & Pricing</h3>
              <button
                onClick={() => setActiveSection('overview')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Pay as you go */}
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Pay as you go</h4>
                <p className="text-gray-600 mb-4">Stay flexible – pay at standard rates.</p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Stockholm</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">5 kr/minute</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Plans */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Monthly Plans</h4>
                <div className="grid gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-gray-900">Monthly Subscription</h5>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Most Popular</span>
                    </div>
                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">299 kr/month</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-4">Minutes and lower rates included</p>
                    <ul className="space-y-2 text-sm text-gray-700 mb-4">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Unlimited access
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Up to 90 min per session
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Lower minute rate
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Customer support
                      </li>
                    </ul>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Subscribe Now
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-4">Pre-book</h5>
                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">From 40 kr/slot</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-4">Reserve ahead, skip the wait</p>
                    <ul className="space-y-2 text-sm text-gray-700 mb-4">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Book specific time slots
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Priority access at busy hours
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Auto-reminders
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Cancel anytime
                      </li>
                    </ul>
                    <button className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Prepaid Plans */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Prepaid Plans</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-2">30 minutes</h5>
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className="text-xl font-bold text-gray-900">120 kr</span>
                      <span className="text-sm text-gray-500 line-through">150 kr</span>
                    </div>
                    <p className="text-xs text-red-600 font-medium mb-2">Save 20% - 4 kr per minute</p>
                    <div className="flex items-center text-xs text-gray-600 mb-3">
                      <Clock className="w-3 h-3 mr-1" />
                      Valid for 1 day
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Buy Now
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-2">60 minutes</h5>
                    <div className="flex items-baseline space-x-2 mb-2">
                      <span className="text-xl font-bold text-gray-900">240 kr</span>
                      <span className="text-sm text-gray-500 line-through">300 kr</span>
                    </div>
                    <p className="text-xs text-red-600 font-medium mb-2">Save 20% - 4 kr per minute</p>
                    <div className="flex items-center text-xs text-gray-600 mb-3">
                      <Clock className="w-3 h-3 mr-1" />
                      Valid for 3 days
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Section Modal */}
      {activeSection === 'subscriptions' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">My Subscriptions</h3>
              <button
                onClick={() => setActiveSection('overview')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {subscriptions.length > 0 ? (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{subscription.product_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Next billing: {new Date(subscription.next_transaction_date).toLocaleDateString()}</p>
                      <p>Period ends: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                        Manage
                      </button>
                      <button className="text-red-600 text-sm font-medium hover:text-red-700">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No subscriptions</h4>
                  <p className="text-gray-500 mb-4">You don't have any active subscriptions</p>
                  <button 
                    onClick={() => setActiveSection('pricing')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Plans
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Section Modal */}
      {activeSection === 'payment-methods' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Payment Methods</h3>
              <button
                onClick={() => setActiveSection('overview')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">•••• •••• •••• 4242</span>
                  </div>
                  <span className="text-sm text-gray-500">Expires 12/25</span>
                </div>
              </div>
              
              <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Add payment method</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Section Modal */}
      {activeSection === 'rewards' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">My Rewards</h3>
              <button
                onClick={() => setActiveSection('overview')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Rewards Overview */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Rewards Program</h4>
                    <p className="text-sm text-gray-600">Earn points and unlock exclusive benefits</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{userData.availablePoints.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Points Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userData.myRewards.length}</div>
                    <div className="text-sm text-gray-600">Active Rewards</div>
                  </div>
                </div>
              </div>

              {/* Rewards Tabs */}
              <div className="bg-white rounded-xl p-1 mb-4 shadow-sm">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setRewardsTab('available')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      rewardsTab === 'available'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setRewardsTab('my-rewards')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      rewardsTab === 'my-rewards'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    My Rewards ({userData.myRewards.length})
                  </button>
                  <button
                    onClick={() => setRewardsTab('past-rewards')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      rewardsTab === 'past-rewards'
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Past Rewards ({userData.usageHistory.length})
                  </button>
                </div>
              </div>

              {/* Available Rewards Tab */}
              {rewardsTab === 'available' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900">Available Rewards</h5>
                  <div className="grid gap-4">
                  {mockRewards.map((reward) => {
                    const IconComponent = reward.icon;
                    const isTimeActive = reward.isActive ? reward.isActive() : true;
                    const isClaimed = userRewards.some(ur => ur.reward_id === reward.id && ur.status === 'active');
                    
                    return (
                      <div key={reward.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg ${reward.iconColor} flex items-center justify-center`}>
                              <IconComponent className={`w-4 h-4 ${reward.iconBgColor}`} />
                            </div>
                            <h6 className="font-medium text-gray-900">{reward.title}</h6>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            reward.badge === 'Auto Reward' 
                              ? 'bg-green-100 text-green-800'
                              : isTimeActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {reward.badge || (isTimeActive ? 'Available' : 'Not Available')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {reward.points_required === 0 ? 'Auto Reward' : `${reward.points_required} points`}
                          </span>
                          {isClaimed ? (
                            <button 
                              onClick={() => handleUseReward(reward.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Use Now
                            </button>
                          ) : reward.points_required === 0 ? (
                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                              Auto Reward
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleClaimReward(reward.id)}
                              disabled={loading || (reward.isActive && !reward.isActive()) || reward.points_required > userData.availablePoints}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                loading || (reward.isActive && !reward.isActive()) || reward.points_required > userData.availablePoints
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                            >
                              {loading ? 'Claiming...' : 'Claim'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  </div>
                </div>
              )}

              {/* My Rewards Tab */}
              {rewardsTab === 'my-rewards' && (
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">My Rewards</h5>
                  {userData.myRewards.length > 0 ? (
                    <div className="grid gap-4">
                      {userData.myRewards.map((reward) => (
                        <div key={reward.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900 mb-1">{reward.title}</h6>
                              <p className="text-gray-600 text-sm mb-1">{reward.partner}</p>
                              <p className="text-gray-500 text-xs">Expires {reward.expiresAt}</p>
                            </div>
                            <button
                              onClick={() => handleUseReward(reward.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Use Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-gray-200">
                      <Gift className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg font-medium">No claimed rewards yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Past Rewards Tab */}
              {rewardsTab === 'past-rewards' && (
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">Past Rewards</h5>
                  {userData.usageHistory.length > 0 ? (
                    <div className="grid gap-4">
                      {userData.usageHistory.map((item, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900 mb-1">{item.title}</h6>
                              <p className="text-gray-600 text-sm mb-1">From {item.partner}</p>
                              <p className="text-gray-500 text-xs">Used on: {new Date(item.usedDate).toLocaleDateString()}</p>
                            </div>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                              Used
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-gray-200">
                      <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg font-medium">No usage history yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* How to Earn Points */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-3">How to Earn Points</h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Complete a booth session: +50 points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Book in advance: +25 points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Invite a friend: +100 points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Leave a review: +10 points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referrals Section Modal */}
      {activeSection === 'referrals' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Invite Friends</h3>
              <button
                onClick={() => setActiveSection('overview')}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Referral Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Invite Friends & Earn</h4>
                    <p className="text-sm text-gray-600">Get SEK 50,00 in booth credits for each friend you invite</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-gray-600">Friends Invited</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">SEK 150</div>
                    <div className="text-sm text-gray-600">Credits Earned</div>
                  </div>
                </div>
              </div>

              {/* Referral Code */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-3">Your Referral Code</h5>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <code className="text-lg font-mono text-gray-900">Booth2025</code>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Share this code with your friends</p>
              </div>

              {/* Share Options */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900">Share via</h5>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">WhatsApp</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">Email</span>
                  </button>
                </div>
              </div>

              {/* Referral History */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Referral History</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">john@example.com</div>
                      <div className="text-sm text-gray-500">Signed up 2 days ago</div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">sarah@example.com</div>
                      <div className="text-sm text-gray-500">Signed up 1 week ago</div>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
