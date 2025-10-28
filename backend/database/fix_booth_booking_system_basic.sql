-- Basic Fix for Booth Booking System
-- This script only adds the essential missing columns without updating existing data

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

-- Success message
SELECT 'Essential columns added successfully! Pre-booking should now work.' as message;
