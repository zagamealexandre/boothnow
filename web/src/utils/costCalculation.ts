// Utility function to test cost calculations
export function calculateSessionCost(
  startTime: string,
  costPerMinute: number,
  currentTime?: Date
): { elapsedMinutes: number; currentCost: number; timeRemaining: number } {
  const start = new Date(startTime);
  const now = currentTime || new Date();
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000); // seconds
  const elapsedMinutes = elapsed / 60;
  
  return {
    elapsedMinutes,
    currentCost: elapsedMinutes * costPerMinute,
    timeRemaining: Math.max(0, 60 * 60 - elapsed) // Assuming 60 min max duration
  };
}

// Test the calculation
export function testCostCalculation() {
  const now = new Date();
  const startTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
  
  const result = calculateSessionCost(startTime.toISOString(), 0.50);
  
  console.log('🧪 Cost Calculation Test:', {
    startTime: startTime.toISOString(),
    currentTime: now.toISOString(),
    costPerMinute: 0.50,
    elapsedMinutes: result.elapsedMinutes,
    currentCost: result.currentCost,
    expectedCost: 15 * 0.50, // Should be 7.50
    isCorrect: Math.abs(result.currentCost - 7.50) < 0.01
  });
  
  return result;
}
