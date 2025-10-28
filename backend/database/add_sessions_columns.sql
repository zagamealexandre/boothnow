-- Add missing columns to sessions table for active session display
-- This script adds the columns needed for the live timer and cost counter

-- Add cost_per_minute column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10, 2) DEFAULT 2.50;

-- Add booth_name column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_name TEXT;

-- Add booth_address column to sessions table  
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booth_address TEXT;

-- Add clerk_user_id column to sessions table for easier querying
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create index on clerk_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_clerk_user_id ON sessions(clerk_user_id);

-- Update existing sessions with booth details if they don't have them
UPDATE sessions 
SET 
  cost_per_minute = booths.cost_per_minute,
  booth_name = booths.name,
  booth_address = booths.address,
  clerk_user_id = users.clerk_user_id
FROM booths, users
WHERE sessions.booth_id = booths.id 
  AND sessions.user_id = users.id
  AND (sessions.cost_per_minute IS NULL OR sessions.booth_name IS NULL OR sessions.booth_address IS NULL OR sessions.clerk_user_id IS NULL);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;
