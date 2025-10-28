-- Minimal Fix for Booth Booking System
-- This script only adds the essential missing columns

-- 1. Add missing columns to booths table
ALTER TABLE booths ADD COLUMN IF NOT EXISTS next_available_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2) DEFAULT 2.50;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS max_duration INTEGER DEFAULT 120;
ALTER TABLE booths ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'offline'));
ALTER TABLE booths ADD COLUMN IF NOT EXISTS current_session_id UUID REFERENCES sessions(id);
ALTER TABLE booths ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add missing columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_address TEXT;

-- 3. Add missing columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- 4. Update existing booths with default values
UPDATE booths SET 
  cost_per_minute = 2.50,
  max_duration = 120,
  status = CASE 
    WHEN availability = true THEN 'available'
    ELSE 'offline'
  END,
  next_available_at = NOW()
WHERE cost_per_minute IS NULL;

-- 5. Update existing sessions with default values
UPDATE sessions SET 
  cost_per_minute = 2.50,
  booth_name = 'Booth',
  booth_address = 'Address'
WHERE cost_per_minute IS NULL;

-- 6. Update existing reservations with calculated end_time
UPDATE reservations SET 
  end_time = start_time + INTERVAL '1 minute' * duration_minutes
WHERE end_time IS NULL;

-- Success message
SELECT 'Booth booking system columns added successfully!' as message;
