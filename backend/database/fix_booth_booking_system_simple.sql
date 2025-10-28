-- Fix Booth Booking System - Simplified Version
-- This script only adds missing columns, skipping existing policies

-- 1. Add missing columns to booths table (only if they don't exist)
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
  booth_name = 'Booth',
  booth_address = 'Address'
WHERE cost_per_minute IS NULL;

-- 5. Add missing columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- 6. Update existing reservations with calculated end_time (only if duration_minutes exists)
-- First check if the column exists, then update
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'reservations' 
             AND column_name = 'duration_minutes') THEN
    UPDATE reservations SET 
      end_time = start_time + INTERVAL '1 minute' * duration_minutes
    WHERE end_time IS NULL;
  END IF;
END $$;

-- 7. Create function to update booth status when session ends
CREATE OR REPLACE FUNCTION update_booth_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booth status when session ends
  UPDATE booths 
  SET 
    status = 'available',
    availability = true,
    current_session_id = NULL,
    next_available_at = NOW(),
    last_activity = NOW()
  WHERE id = OLD.booth_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for session end
DROP TRIGGER IF EXISTS trigger_update_booth_on_session_end ON sessions;
CREATE TRIGGER trigger_update_booth_on_session_end
  AFTER UPDATE OF status ON sessions
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION update_booth_on_session_end();

-- 9. Create function to check booth availability
CREATE OR REPLACE FUNCTION check_booth_availability(booth_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  booth_record RECORD;
  now_time TIMESTAMP WITH TIME ZONE;
BEGIN
  now_time := NOW();
  
  SELECT * INTO booth_record 
  FROM booths 
  WHERE id = booth_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if booth is available
  IF booth_record.status = 'available' AND booth_record.availability = true THEN
    RETURN TRUE;
  END IF;
  
  -- Check if booth will be available soon
  IF booth_record.next_available_at IS NOT NULL AND booth_record.next_available_at <= now_time THEN
    -- Update booth status to available
    UPDATE booths 
    SET 
      status = 'available',
      availability = true,
      current_session_id = NULL,
      next_available_at = NULL
    WHERE id = booth_uuid;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get booth booking info
CREATE OR REPLACE FUNCTION get_booth_booking_info(booth_uuid UUID)
RETURNS TABLE (
  booth_id UUID,
  partner TEXT,
  address TEXT,
  status TEXT,
  availability BOOLEAN,
  next_available_at TIMESTAMP WITH TIME ZONE,
  cost_per_minute DECIMAL(10, 2),
  max_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.partner,
    b.address,
    b.status,
    b.availability,
    b.next_available_at,
    b.cost_per_minute,
    b.max_duration
  FROM booths b
  WHERE b.id = booth_uuid;
END;
$$ LANGUAGE plpgsql;

-- 11. Update sample booth data with new columns
UPDATE booths SET 
  cost_per_minute = 2.50,
  max_duration = 120,
  status = 'available',
  next_available_at = NOW(),
  last_activity = NOW()
WHERE id IN (
  '51f63c23-470a-4c18-9415-e7722221439f',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012'
);

-- 12. Add RLS policies for booths table (only if they don't exist)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booths' 
    AND policyname = 'Authenticated users can read booths'
  ) THEN
    CREATE POLICY "Authenticated users can read booths" ON booths
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booths' 
    AND policyname = 'Authenticated users can update booths'
  ) THEN
    CREATE POLICY "Authenticated users can update booths" ON booths
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 13. Add RLS policies for reservations table (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Users can read their own reservations'
  ) THEN
    CREATE POLICY "Users can read their own reservations" ON reservations
      FOR SELECT USING (auth.uid()::text = user_id::text);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Users can insert their own reservations'
  ) THEN
    CREATE POLICY "Users can insert their own reservations" ON reservations
      FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Users can update their own reservations'
  ) THEN
    CREATE POLICY "Users can update their own reservations" ON reservations
      FOR UPDATE USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

-- Success message
SELECT 'Booth booking system fixed successfully!' as message;
