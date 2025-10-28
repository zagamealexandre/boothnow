-- Refresh Schema Cache and Verify Columns
-- This script refreshes the schema cache and verifies that all required columns exist

-- First, let's check what columns actually exist in the reservations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- Check if duration_minutes exists specifically
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'reservations' 
  AND column_name = 'duration_minutes'
) as duration_minutes_exists;

-- Check if end_time exists in reservations
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'reservations' 
  AND column_name = 'end_time'
) as end_time_exists;

-- If duration_minutes doesn't exist, add it
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- If end_time doesn't exist, add it  
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Refresh the schema cache by running a simple query
SELECT 1 as schema_refreshed;
