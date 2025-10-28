-- Fix sessions cost data - remove hardcoded costs and set correct cost_per_minute
-- This script fixes the hardcoded cost values and sets the correct cost_per_minute

-- First, let's see what we have
SELECT 
  id, 
  start_time, 
  cost, 
  cost_per_minute, 
  total_minutes,
  status,
  booth_name
FROM sessions 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- Update cost_per_minute to the correct value (0.50)
UPDATE sessions 
SET cost_per_minute = 0.50 
WHERE cost_per_minute = 2.50 OR cost_per_minute IS NULL;

-- Clear the hardcoded cost field - it should be calculated dynamically
UPDATE sessions 
SET cost = NULL 
WHERE cost = '30.00' OR cost IS NOT NULL;

-- Verify the changes
SELECT 
  id, 
  start_time, 
  cost, 
  cost_per_minute, 
  total_minutes,
  status,
  booth_name,
  -- Calculate what the cost should be
  ROUND(EXTRACT(EPOCH FROM (NOW() - start_time)) / 60 * cost_per_minute, 2) as calculated_cost
FROM sessions 
WHERE status = 'active' 
ORDER BY created_at DESC;
