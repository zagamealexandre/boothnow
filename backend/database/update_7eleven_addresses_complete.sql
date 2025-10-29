-- Update 7-Eleven addresses with actual Stockholm locations
-- This script updates existing booths and creates new ones if needed

-- First, let's see what we have
SELECT COUNT(*) as total_7eleven_booths FROM booths WHERE partner = '7-Eleven';

-- Step 1: Update existing booths (will update up to 10 booths if they exist)
WITH booth_ranking AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM booths 
  WHERE partner = '7-Eleven'
)
UPDATE booths SET 
  address = CASE 
    WHEN br.rn = 1 THEN 'Klarabergsgatan 56, 111 21 Stockholm'
    WHEN br.rn = 2 THEN 'Regeringsgatan 54, 111 56 Stockholm'
    WHEN br.rn = 3 THEN 'Drottninggatan 90 B, 111 36 Stockholm'
    WHEN br.rn = 4 THEN 'Sveavägen 55, 113 59 Stockholm'
    WHEN br.rn = 5 THEN 'Götgatan 25, 116 46 Stockholm'
    WHEN br.rn = 6 THEN 'Mariatorget 1A, 118 48 Stockholm'
    WHEN br.rn = 7 THEN 'Fleminggatan 34, 112 32 Stockholm'
    WHEN br.rn = 8 THEN 'Hantverkargatan 79, 112 38 Stockholm'
    WHEN br.rn = 9 THEN 'Kungsgatan 9, 111 43 Stockholm'
    WHEN br.rn = 10 THEN 'Birger Jarlsgatan 39, 111 45 Stockholm'
  END,
  lat = CASE 
    WHEN br.rn = 1 THEN 59.3326
    WHEN br.rn = 2 THEN 59.3326
    WHEN br.rn = 3 THEN 59.3326
    WHEN br.rn = 4 THEN 59.3423
    WHEN br.rn = 5 THEN 59.3138
    WHEN br.rn = 6 THEN 59.3172
    WHEN br.rn = 7 THEN 59.3365
    WHEN br.rn = 8 THEN 59.3375
    WHEN br.rn = 9 THEN 59.3318
    WHEN br.rn = 10 THEN 59.3365
  END,
  lng = CASE 
    WHEN br.rn = 1 THEN 18.0649
    WHEN br.rn = 2 THEN 18.0638
    WHEN br.rn = 3 THEN 18.0662
    WHEN br.rn = 4 THEN 18.0554
    WHEN br.rn = 5 THEN 18.0682
    WHEN br.rn = 6 THEN 18.0638
    WHEN br.rn = 7 THEN 18.0412
    WHEN br.rn = 8 THEN 18.0385
    WHEN br.rn = 9 THEN 18.0712
    WHEN br.rn = 10 THEN 18.0695
  END,
  name = CASE 
    WHEN br.rn = 1 THEN '7-Eleven Klarabergsgatan'
    WHEN br.rn = 2 THEN '7-Eleven Regeringsgatan'
    WHEN br.rn = 3 THEN '7-Eleven Drottninggatan'
    WHEN br.rn = 4 THEN '7-Eleven Sveavägen'
    WHEN br.rn = 5 THEN '7-Eleven Götgatan'
    WHEN br.rn = 6 THEN '7-Eleven Mariatorget'
    WHEN br.rn = 7 THEN '7-Eleven Fleminggatan'
    WHEN br.rn = 8 THEN '7-Eleven Hantverkargatan'
    WHEN br.rn = 9 THEN '7-Eleven Kungsgatan'
    WHEN br.rn = 10 THEN '7-Eleven Birger Jarlsgatan'
  END
FROM booth_ranking br
WHERE booths.id = br.id AND br.rn <= 10;

-- Step 2: Insert missing booths (if we have fewer than 10)
-- Get count of existing booths
DO $$
DECLARE
  booth_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO booth_count FROM booths WHERE partner = '7-Eleven';
  
  -- Insert booths 7-10 if they don't exist
  IF booth_count < 7 THEN
    INSERT INTO booths (partner, address, lat, lng, name, availability, status)
    VALUES 
      ('7-Eleven', 'Fleminggatan 34, 112 32 Stockholm', 59.3365, 18.0412, '7-Eleven Fleminggatan', true, 'available');
  END IF;
  
  IF booth_count < 8 THEN
    INSERT INTO booths (partner, address, lat, lng, name, availability, status)
    VALUES 
      ('7-Eleven', 'Hantverkargatan 79, 112 38 Stockholm', 59.3375, 18.0385, '7-Eleven Hantverkargatan', true, 'available');
  END IF;
  
  IF booth_count < 9 THEN
    INSERT INTO booths (partner, address, lat, lng, name, availability, status)
    VALUES 
      ('7-Eleven', 'Kungsgatan 9, 111 43 Stockholm', 59.3318, 18.0712, '7-Eleven Kungsgatan', true, 'available');
  END IF;
  
  IF booth_count < 10 THEN
    INSERT INTO booths (partner, address, lat, lng, name, availability, status)
    VALUES 
      ('7-Eleven', 'Birger Jarlsgatan 39, 111 45 Stockholm', 59.3365, 18.0695, '7-Eleven Birger Jarlsgatan', true, 'available');
  END IF;
END $$;

-- Step 3: Update denormalized booth data in existing sessions
UPDATE sessions 
SET 
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND b.partner = '7-Eleven';

-- Verify the results
SELECT id, name, partner, address, lat, lng, created_at
FROM booths 
WHERE partner = '7-Eleven' 
ORDER BY created_at;
