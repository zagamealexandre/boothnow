-- Check what's in the sessions table to see the actual costs
SELECT 
  s.id,
  s.start_time,
  s.end_time,
  s.total_minutes,
  s.cost,
  s.status,
  b.name as booth_name,
  b.partner
FROM sessions s
LEFT JOIN booths b ON s.booth_id = b.id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC
LIMIT 10;
