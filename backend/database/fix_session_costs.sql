-- Fix session costs to be calculated based on actual duration
-- The cost should be calculated as: duration_minutes * cost_per_minute (0.50 EUR)

-- Update sessions with correct costs based on duration
UPDATE sessions 
SET 
  cost = COALESCE(total_minutes, 0) * 0.50,
  updated_at = NOW()
WHERE status = 'completed'
  AND (cost IS NULL OR cost = 30.00); -- Only update if cost is null or the hardcoded 30.00

-- Also update any sessions that might have incorrect costs
UPDATE sessions 
SET 
  cost = COALESCE(total_minutes, 0) * 0.50,
  updated_at = NOW()
WHERE status = 'completed'
  AND total_minutes IS NOT NULL
  AND total_minutes > 0;

-- For sessions with 0 minutes, set a minimum cost of 0.50 (1 minute minimum)
UPDATE sessions 
SET 
  cost = 0.50,
  updated_at = NOW()
WHERE status = 'completed'
  AND (total_minutes IS NULL OR total_minutes = 0)
  AND cost IS NULL;
