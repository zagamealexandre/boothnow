-- Check current session costs and fix them
-- Run this to see what the current values are

-- Step 1: Check current session costs
SELECT 
  id,
  total_minutes,
  cost,
  status,
  created_at
FROM sessions 
WHERE status = 'completed'
ORDER BY created_at DESC;

-- Step 2: Update session costs to correct values (5 SEK per minute)
UPDATE sessions 
SET cost = total_minutes * 5.00
WHERE status = 'completed' 
  AND total_minutes IS NOT NULL 
  AND cost IS NOT NULL;

-- Step 3: Verify the update
SELECT 
  id,
  total_minutes,
  cost,
  status,
  created_at
FROM sessions 
WHERE status = 'completed'
ORDER BY created_at DESC;
