import { Coffee, Croissant, Sandwich, CupSoda, Candy, Timer } from 'lucide-react';

// Icon mapping for database icon names
export const iconMap: { [key: string]: any } = {
  Coffee,
  Croissant,
  Sandwich,
  CupSoda,
  Candy,
  Timer
};

// Shared reward data for both Rewards.tsx and ProfileTab.tsx
// This is now used as fallback when database is not available
export const mockRewards = [
  {
    id: 1,
    title: "15% off any coffee",
    description: "Valid for purchases between 7 AM and 9 AM at participating stores.",
    partner: "7-Eleven",
    points_required: 120,
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
    points_required: 150,
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
    points_required: 180,
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
    points_required: 250,
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
    points_required: 200,
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
    points_required: 0,
    image: "/images/booth/closed.jpg",
    icon: Timer,
    iconColor: "bg-indigo-100",
    iconBgColor: "text-indigo-600",
    badge: "Bonus"
  },
  {
    id: 7,
    title: "Free breakfast sandwich",
    description: "Valid between 6 AM and 10 AM. One per day.",
    partner: "7-Eleven",
    points_required: 300,
    image: "/images/booth/closed.jpg",
    icon: Sandwich,
    iconColor: "bg-yellow-100",
    iconBgColor: "text-yellow-600",
    badge: "6–10 AM",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 6 && hour < 10;
    }
  },
  {
    id: 8,
    title: "50% off energy drinks",
    description: "Valid between 2 PM and 6 PM. Perfect for afternoon boost.",
    partner: "7-Eleven",
    points_required: 180,
    image: "/images/booth/closed.jpg",
    icon: CupSoda,
    iconColor: "bg-red-100",
    iconBgColor: "text-red-600",
    badge: "2–6 PM",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 14 && hour < 18;
    }
  },
  {
    id: 9,
    title: "Free hot chocolate",
    description: "Valid between 6 PM and 10 PM. Perfect for evening sessions.",
    partner: "7-Eleven",
    points_required: 220,
    image: "/images/booth/closed.jpg",
    icon: Coffee,
    iconColor: "bg-brown-100",
    iconBgColor: "text-brown-600",
    badge: "6–10 PM",
    isActive: () => {
      const now = new Date();
      const hour = now.getHours();
      return hour >= 18 && hour < 22;
    }
  }
];

// Mock user data for rewards
export const mockUserData = {
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
