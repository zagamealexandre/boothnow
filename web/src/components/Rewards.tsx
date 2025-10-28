"use client";

import { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Clock, Gift, Calendar, Coffee } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '@clerk/nextjs';
import { rewardsService, Reward, UserReward, RewardUsageHistory, UserPoints } from '../services/rewardsService';
import { mockRewards, mockUserData, iconMap } from '../data/rewardsData';

// Updated: 7-Eleven rewards - v2.0

// Mock data now imported from shared file

interface RewardCardProps {
  reward: typeof mockRewards[0];
  onClaim: (rewardId: number) => void;
}

function RewardCard({ reward, onClaim }: RewardCardProps) {
  const IconComponent = reward.icon;
  const isTimeActive = reward.isActive ? reward.isActive() : true;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative">
      {/* Badge */}
      {reward.badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
            {reward.badge}
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className={`w-16 h-16 rounded-lg ${reward.iconColor} flex items-center justify-center`}>
          <IconComponent className={`w-8 h-8 ${reward.iconBgColor}`} />
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 text-lg mb-2">{reward.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
      <p className="text-gray-500 text-sm mb-4">From {reward.partner}</p>
      
      {/* Time-based availability indicator */}
      {reward.isActive && (
        <div className={`text-xs mb-3 px-2 py-1 rounded-full inline-block ${
          isTimeActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}>
          {isTimeActive ? 'Available now' : 'Not available at this time'}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-gray-900">
            {reward.points_required === 0 ? 'Auto Reward' : `${reward.points_required} points`}
          </span>
        </div>
        {reward.points_required === 0 ? (
          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
            Auto Reward
          </span>
        ) : (
          <button
            onClick={() => onClaim(reward.id)}
            disabled={reward.isActive && !reward.isActive()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reward.isActive && !reward.isActive()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2E6A9C] hover:bg-[#244E73] text-white'
            }`}
          >
            Claim
          </button>
        )}
      </div>
    </div>
  );
}

interface MyRewardCardProps {
  reward: typeof mockUserData.myRewards[0];
  onUse: (rewardId: number) => void;
}

function MyRewardCard({ reward, onUse }: MyRewardCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{reward.title}</h3>
          <p className="text-gray-600 text-sm mb-1">{reward.partner}</p>
          <p className="text-gray-500 text-xs">Expires {reward.expiresAt}</p>
        </div>
        <button
          onClick={() => onUse(reward.id)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Use Now
        </button>
      </div>
    </div>
  );
}

export default function Rewards() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeReward, setQrCodeReward] = useState<Reward | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [userData, setUserData] = useState(mockUserData);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [usageHistory, setUsageHistory] = useState<RewardUsageHistory[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  // Load rewards data from database
  useEffect(() => {
    const loadRewardsData = async () => {
      if (!userId) {
        setLoading(false);
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
              expiresAt: ur.used_at ? new Date(ur.used_at).toISOString().split('T')[0] : 'Never',
              status: ur.is_used ? 'used' : 'available'
            })),
            usageHistory: usageHistoryData.map(uh => ({
              id: uh.reward_id.toString(),
              title: 'Used Reward',
              partner: '7-Eleven',
              usedDate: uh.used_at
            }))
          }));
        }

        console.log('✅ Rewards: Data loaded successfully');
      } catch (error) {
        console.error('❌ Rewards: Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRewardsData();
  }, [userId]);

  // Clear QR code when modal closes
  useEffect(() => {
    if (!showQrModal) {
      setQrCodeDataUrl('');
      setQrCodeReward(null);
    }
  }, [showQrModal]);

  // Generate QR code for reward
  const generateQRCode = async (reward: Reward) => {
    try {
      // Create a unique reward code that includes reward ID, user ID, and timestamp
      const rewardCode = `BOOTHNOW_REWARD_${reward.id}_${Date.now()}`;
      
      // Generate QR code as data URL
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

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

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
            status: ur.is_used ? 'used' : 'available'
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
            status: ur.is_used ? 'used' : 'available'
          })),
          usageHistory: usageHistoryData.map(uh => ({
            id: uh.reward_id.toString(),
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

  const stats = [
    {
      label: "Available Points",
      value: userData.availablePoints.toString(),
      icon: Trophy,
      iconColor: "bg-amber-100",
      iconBgColor: "text-amber-600"
    },
    {
      label: "Member Tier",
      value: userData.memberTier,
      icon: Star,
      iconColor: "bg-purple-100",
      iconBgColor: "text-purple-600"
    },
    {
      label: "Sessions Completed",
      value: userData.sessionsCompleted.toString(),
      icon: Clock,
      iconColor: "bg-green-100",
      iconBgColor: "text-green-600"
    },
    {
      label: "Rewards Used",
      value: userData.rewardsUsed.toString(),
      icon: Gift,
      iconColor: "bg-blue-100",
      iconBgColor: "text-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-4 md:p-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Scan to Use Reward</h3>
            <p className="text-gray-700 text-center mb-6">{qrCodeReward.title}</p>
            <div className="flex justify-center mb-6">
              {/* QR Code display */}
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
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Rewards Program</h1>
          <p className="text-gray-600 text-lg">
            Earn points with every booth session and redeem them for exclusive discounts and offers.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.iconColor} flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${stat.iconBgColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="bg-[#F9FAFB] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Use Booths</h3>
              <p className="text-gray-600 text-sm">Earn 10 points for every minute in a booth session</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Collect Points</h3>
              <p className="text-gray-600 text-sm">Points accumulate automatically and never expire</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Redeem Rewards</h3>
              <p className="text-gray-600 text-sm">Exchange points for 7-Eleven discounts and exclusive offers</p>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-[#2E6A9C] text-[#2E6A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Available Rewards
              </button>
              <button
                onClick={() => setActiveTab('my-rewards')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-rewards'
                    ? 'border-[#2E6A9C] text-[#2E6A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Rewards ({userData.myRewards.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-[#2E6A9C] text-[#2E6A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Usage History
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-2 text-gray-600">Loading rewards...</span>
              </div>
            ) : activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map((reward) => {
                  const IconComponent = Coffee; // Default icon since Reward interface doesn't have icon_name
                  const isTimeActive = rewardsService.isRewardTimeActive(reward.time_restriction);
                  const isClaimed = userRewards.some(ur => ur.reward_id === reward.id);
                  
                  return (
                    <div key={reward.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative">
                      {/* Badge */}
                      {/* Badge removed - not in Reward interface */}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-orange-600" />
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{reward.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                      <p className="text-gray-500 text-sm mb-4">From {reward.partner}</p>
                      
                      {/* Time-based availability indicator */}
                      {reward.time_restriction && (
                        <div className={`text-xs mb-3 px-2 py-1 rounded-full inline-block ${
                          isTimeActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isTimeActive ? 'Available now' : 'Not available at this time'}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">
                          {reward.points_required === 0 ? 'Free' : `${reward.points_required} points`}
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
                            disabled={!isTimeActive || (userPoints && reward.points_required > userPoints.points)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              !isTimeActive || (userPoints && reward.points_required > userPoints.points)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'my-rewards' && (
              <div className="space-y-4">
                {userData.myRewards.length > 0 ? (
                  userData.myRewards.map((reward) => (
                    <MyRewardCard
                      key={reward.id}
                      reward={reward}
                      onUse={handleUseReward}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-gray-200">
                    <Gift className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No claimed rewards yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {userData.usageHistory.length > 0 ? (
                  userData.usageHistory.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-1">From {item.partner}</p>
                      <p className="text-gray-500 text-xs">Used on: {new Date(item.usedDate).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-xl border border-gray-200">
                    <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg font-medium">No usage history yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
