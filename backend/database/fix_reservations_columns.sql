-- Fix Reservations Table Columns
-- This script specifically adds the missing columns to the reservations table

-- Add duration_minutes if it doesn't exist
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add end_time if it doesn't exist  
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND column_name IN ('duration_minutes', 'end_time')
ORDER BY column_name;
