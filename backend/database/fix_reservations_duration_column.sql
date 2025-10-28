-- Fix Reservations Duration Column Issue
-- This script checks for column naming conflicts and fixes them

-- First, let's see what columns actually exist in the reservations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;

-- Check if there's a 'duration' column that conflicts with 'duration_minutes'
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'reservations' 
  AND column_name = 'duration'
) as duration_column_exists;

-- If there's a 'duration' column, drop it since we want 'duration_minutes'
-- Note: We'll check if it exists first, then drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'duration'
    ) THEN
        ALTER TABLE reservations DROP COLUMN duration;
    END IF;
END $$;

-- Ensure duration_minutes exists and is NOT NULL
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE reservations ALTER COLUMN duration_minutes SET NOT NULL;

-- Ensure end_time exists
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Verify the final column structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;
