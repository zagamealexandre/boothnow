-- Fix cost_per_minute values in sessions table to 5.00 SEK
-- This will update all sessions to use the correct SEK pricing

UPDATE sessions 
SET cost_per_minute = 5.00
WHERE cost_per_minute = 0.50 OR cost_per_minute IS NULL;

-- Also update any booths table if it has cost_per_minute
UPDATE booths 
SET cost_per_minute = 5.00
WHERE cost_per_minute = 0.50 OR cost_per_minute IS NULL;

-- Verify the update
SELECT 
  id,
  cost_per_minute,
  cost,
  total_minutes,
  status
FROM sessions 
WHERE status = 'active' OR status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
