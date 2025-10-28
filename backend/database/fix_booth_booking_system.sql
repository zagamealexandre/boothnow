-- Fix Booth Booking System
-- This script adds missing columns and fixes the booth booking functionality

-- 1. Add missing columns to booths table
ALTER TABLE booths ADD COLUMN IF NOT EXISTS next_available_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2) DEFAULT 2.50;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS max_duration INTEGER DEFAULT 120; -- max 2 hours
ALTER TABLE booths ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'offline'));
ALTER TABLE booths ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES sessions(id);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update existing booths with default values
UPDATE booths SET 
  cost_per_minute = 2.50,
  max_duration = 120,
  status = CASE 
    WHEN availability = true THEN 'available'
    ELSE 'offline'
  END,
  next_available_at = NOW()
WHERE cost_per_minute IS NULL;

-- 3. Add missing columns to sessions table for better tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_address TEXT;

-- 4. Update existing sessions with booth information
UPDATE sessions SET 
  cost_per_minute = 2.50,
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND sessions.cost_per_minute IS NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booths_status ON booths(status);
CREATE INDEX IF NOT EXISTS idx_booths_next_available ON booths(next_available_at);
CREATE INDEX IF NOT EXISTS idx_booths_current_session ON booths(current_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_cost_per_minute ON sessions(cost_per_minute);

-- 6. Create a function to update booth status when session starts
CREATE OR REPLACE FUNCTION update_booth_on_session_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booth status to occupied and set current session
  UPDATE booths 
  SET 
    status = 'occupied',
    current_session_id = NEW.id,
    next_available_at = NEW.end_time,
    last_activity = NOW()
  WHERE id = NEW.booth_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to update booth status when session ends
CREATE OR REPLACE FUNCTION update_booth_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booth status to available and clear current session
  UPDATE booths 
  SET 
    status = 'available',
    current_session_id = NULL,
    next_available_at = NOW(),
    last_activity = NOW()
  WHERE id = OLD.booth_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for automatic booth status updates
DROP TRIGGER IF EXISTS trigger_booth_session_start ON sessions;
CREATE TRIGGER trigger_booth_session_start
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_booth_on_session_start();

DROP TRIGGER IF EXISTS trigger_booth_session_end ON sessions;
CREATE TRIGGER trigger_booth_session_end
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION update_booth_on_session_end();

-- 9. Create a function to check booth availability
CREATE OR REPLACE FUNCTION check_booth_availability(booth_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  booth_status TEXT;
  now_time TIMESTAMP WITH TIME ZONE;
BEGIN
  now_time := NOW();
  
  SELECT status INTO booth_status
  FROM booths
  WHERE id = booth_uuid;
  
  -- Return true if booth is available and not occupied
  RETURN booth_status = 'available';
END;
$$ LANGUAGE plpgsql;

-- 10. Create a function to get booth booking info
CREATE OR REPLACE FUNCTION get_booth_booking_info(booth_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  partner TEXT,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status TEXT,
  cost_per_minute DECIMAL(10, 2),
  max_duration INTEGER,
  next_available_at TIMESTAMP WITH TIME ZONE,
  current_session_id UUID,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.partner,
    b.address,
    b.lat,
    b.lng,
    b.status,
    b.cost_per_minute,
    b.max_duration,
    b.next_available_at,
    b.current_session_id,
    check_booth_availability(booth_uuid) as is_available
  FROM booths b
  WHERE b.id = booth_uuid;
END;
$$ LANGUAGE plpgsql;

-- 11. Update RLS policies for booths to allow updates
DROP POLICY IF EXISTS "Booths are publicly readable" ON booths;
CREATE POLICY "Booths are publicly readable" ON booths
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update booths" ON booths
  FOR UPDATE TO authenticated
  USING (true);

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_booth_availability(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_booth_booking_info(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_booth_on_session_start() TO authenticated;
GRANT EXECUTE ON FUNCTION update_booth_on_session_end() TO authenticated;

-- 13. Ensure all tables have proper RLS enabled
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;

COMMIT;
