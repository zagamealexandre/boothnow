"use client";

import { useState } from 'react';
import { Trophy, Star, Clock, Gift, Coffee, Croissant, Sandwich, CupSoda, Candy, Timer, Calendar } from 'lucide-react';

// Updated: 7-Eleven rewards - v2.0

// Mock data for rewards
const mockRewards = [
  {
    id: 1,
    title: "15% off any coffee",
    description: "Valid for purchases between 7 AM and 9 AM at participating stores.",
    partner: "7-Eleven",
    cost: 120,
    image: "/images/booth/closed.jpg",
    icon: Coffee,
    iconColor: "bg-amber-100",
    iconBgColor: "text-amber-600",
    badge: "7–9 AM",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 7 && hour < 9;
    }
  },
  {
    id: 2,
    title: "Free croissant with any coffee",
    description: "Available all day, one per transaction.",
    partner: "7-Eleven",
    cost: 150,
    image: "/images/booth/closed.jpg",
    icon: Croissant,
    iconColor: "bg-orange-100",
    iconBgColor: "text-orange-600"
  },
  {
    id: 3,
    title: "10% off lunch combo",
    description: "Save on sandwiches and wraps between 11 AM – 2 PM.",
    partner: "7-Eleven",
    cost: 180,
    image: "/images/booth/closed.jpg",
    icon: Sandwich,
    iconColor: "bg-green-100",
    iconBgColor: "text-green-600",
    badge: "Lunch",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 11 && hour < 14;
    }
  },
  {
    id: 4,
    title: "Free iced coffee after 3 PM",
    description: "Cool off after your booth session. One per day.",
    partner: "7-Eleven",
    cost: 250,
    image: "/images/booth/closed.jpg",
    icon: CupSoda,
    iconColor: "bg-blue-100",
    iconBgColor: "text-blue-600",
    badge: "After 3 PM",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 15;
    }
  },
  {
    id: 5,
    title: "Buy 1 get 1 free snack",
    description: "Valid on selected snack items.",
    partner: "7-Eleven",
    cost: 200,
    image: "/images/booth/closed.jpg",
    icon: Candy,
    iconColor: "bg-purple-100",
    iconBgColor: "text-purple-600"
  },
  {
    id: 6,
    title: "20 free minutes",
    description: "Earned automatically after 3 days in a row.",
    partner: "BoothNow",
    cost: 0,
    image: "/images/booth/closed.jpg",
    icon: Timer,
    iconColor: "bg-indigo-100",
    iconBgColor: "text-indigo-600",
    badge: "Bonus"
  },
  {
    id: 7,
    title: "Unlimited coffee subscription",
    description: "Free daily coffee for 30 days. Available for Silver tier and above.",
    partner: "7-Eleven",
    cost: 800,
    image: "/images/booth/closed.jpg",
    icon: Coffee,
    iconColor: "bg-amber-100",
    iconBgColor: "text-amber-600",
    badge: "Silver+"
  }
];

// Mock user data
const mockUserData = {
  availablePoints: 850,
  memberTier: "Silver",
  sessionsCompleted: 23,
  rewardsUsed: 7,
  myRewards: [
    {
      id: 1,
      title: "15% off any coffee",
      partner: "7-Eleven",
      expiresAt: "2025-11-23",
      status: "active"
    },
    {
      id: 2,
      title: "Free croissant with any coffee",
      partner: "7-Eleven",
      expiresAt: "2025-11-07",
      status: "active"
    }
  ],
  usageHistory: []
};

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
            {reward.cost === 0 ? 'Auto Reward' : `${reward.cost} points`}
          </span>
        </div>
        {reward.cost === 0 ? (
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
  const [activeTab, setActiveTab] = useState('available');
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeReward, setQrCodeReward] = useState<typeof mockRewards[0] | null>(null);
  const [userData, setUserData] = useState(mockUserData);

  const handleClaimReward = (rewardId: number) => {
    const reward = mockRewards.find(r => r.id === rewardId);
    if (!reward) return;

    // Check if reward is currently available (time-based validation)
    if (reward.isActive && !reward.isActive()) {
      setToastMessage('This reward is not available at this time!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Check if user has enough points
    if (reward.cost > userData.availablePoints) {
      setToastMessage('Not enough points!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Add to claimed rewards and update user data
    setClaimedRewards(prev => [...prev, rewardId]);
    setUserData(prev => ({
      ...prev,
      availablePoints: prev.availablePoints - reward.cost,
      myRewards: [...prev.myRewards, {
        id: reward.id,
        title: reward.title,
        partner: reward.partner,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "active"
      }]
    }));
    
    // Show success toast
    setToastMessage(`"${reward.title}" claimed!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUseReward = (rewardId: number) => {
    const rewardToUse = userData.myRewards.find(r => r.id === rewardId);
    if (rewardToUse) {
      // Find the full reward details from mockRewards
      const fullReward = mockRewards.find(r => r.id === rewardId);
      if (fullReward) {
        setQrCodeReward(fullReward);
        setShowQrModal(true);
      }
    }
  };

  const handleQrScan = () => {
    if (qrCodeReward) {
      setUserData(prev => ({
        ...prev,
        myRewards: prev.myRewards.filter(r => r.id !== qrCodeReward.id),
        usageHistory: [...prev.usageHistory, { 
          id: qrCodeReward.id,
          title: qrCodeReward.title,
          partner: qrCodeReward.partner,
          usedDate: new Date().toISOString()
        }]
      }));
      setToastMessage(`"${qrCodeReward.title}" used!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setShowQrModal(false);
      setQrCodeReward(null);
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
              {/* Placeholder for QR Code image */}
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                <p className="text-gray-500 text-sm">QR Code Here</p>
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
              <p className="text-gray-600 text-sm">Exchange points for discounts and exclusive offers</p>
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
            {activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={handleClaimReward}
                  />
                ))}
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
