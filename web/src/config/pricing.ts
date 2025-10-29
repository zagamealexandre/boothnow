// Pricing configuration for BoothNow
export const PRICING_CONFIG = {
  // Pay-per-minute pricing
  PAY_PER_MINUTE: {
    costPerMinute: 5.00, // 5 SEK per minute
    maxDurationMinutes: 60, // 1 hour maximum
    maxSessionsPerDay: null, // No limit
    planName: 'Pay Per Minute',
    planDescription: '5 SEK per minute, 1 hour max per session, unlimited sessions'
  },
  
  // Membership pricing
  MEMBERSHIP: {
    monthlyCost: 299.00, // 299 SEK per month
    maxDurationMinutes: 90, // 1.5 hours maximum
    maxSessionsPerDay: 3, // 3 sessions per day
    planName: 'Membership',
    planDescription: '299 SEK/month, 1.5 hours max per session, 3 sessions per day'
  }
} as const

// Helper functions
export function getPricingInfo(planType: 'pay_per_minute' | 'subscription') {
  return planType === 'pay_per_minute' 
    ? PRICING_CONFIG.PAY_PER_MINUTE 
    : PRICING_CONFIG.MEMBERSHIP
}

export function calculateSessionCost(
  startTime: string, 
  planType: 'pay_per_minute' | 'subscription',
  currentTime?: Date
): { elapsedMinutes: number; currentCost: number; timeRemaining: number } {
  const pricing = getPricingInfo(planType)
  const start = new Date(startTime)
  const now = currentTime || new Date()
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000) // seconds
  const elapsedMinutes = elapsed / 60
  
  let currentCost = 0
  if (planType === 'pay_per_minute' && 'costPerMinute' in pricing) {
    currentCost = elapsedMinutes * pricing.costPerMinute
  }
  // For membership, cost is already paid monthly
  
  return {
    elapsedMinutes,
    currentCost,
    timeRemaining: Math.max(0, (pricing.maxDurationMinutes * 60) - elapsed)
  }
}

export function formatPricingDisplay(planType: 'pay_per_minute' | 'subscription'): string {
  const pricing = getPricingInfo(planType)
  return planType === 'pay_per_minute' 
    ? `${pricing.planName} (${'costPerMinute' in pricing ? pricing.costPerMinute : 0} SEK/min)`
    : `${pricing.planName} (${'monthlyCost' in pricing ? pricing.monthlyCost : 0} SEK/month)`
}
