-- Fix Sessions Total Cost Column Issue
-- This script adds the missing total_cost column to the sessions table

-- First, let's see what columns actually exist in the sessions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;

-- Add the missing total_cost column if it doesn't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Update existing sessions to have a calculated total_cost based on total_minutes
-- Assuming a rate of 3 SEK per minute (adjust as needed)
UPDATE sessions 
SET total_cost = COALESCE(total_minutes, 0) * 3.0
WHERE total_cost IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name = 'total_cost';
