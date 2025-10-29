-- Update 7-Eleven addresses with actual Stockholm locations
-- This script updates existing booths and creates new ones to ensure you have exactly 10

-- Step 1: Count existing booths
SELECT COUNT(*) as existing_booths FROM booths WHERE partner = '7-Eleven';

-- Step 2: Update existing booths (updates all existing 7-Eleven booths)
-- We'll assign addresses based on their current order
UPDATE booths SET 
  address = CASE 
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 0) THEN 'Klarabergsgatan 56, 111 21 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 1) THEN 'Regeringsgatan 54, 111 56 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 2) THEN 'Drottninggatan 90 B, 111 36 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 3) THEN 'Sveavägen 55, 113 59 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 4) THEN 'Götgatan 25, 116 46 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 5) THEN 'Mariatorget 1A, 118 48 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 6) THEN 'Fleminggatan 34, 112 32 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 7) THEN 'Hantverkargatan 79, 112 38 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 8) THEN 'Kungsgatan 9, 111 43 Stockholm'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 9) THEN 'Birger Jarlsgatan 39, 111 45 Stockholm'
    ELSE address
  END,
  lat = CASE 
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 0) THEN 59.3326
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 1) THEN 59.3326
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 2) THEN 59.3378
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 3) THEN 59.3423
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 4) THEN 59.3138
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 5) THEN 59.3172
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 6) THEN 59.3365
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 7) THEN 59.3375
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 8) THEN 59.3318
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 9) THEN 59.3365
    ELSE lat
  END,
  lng = CASE 
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 0) THEN 18.0649
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 1) THEN 18.0638
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 2) THEN 18.0662
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 3) THEN 18.0554
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 4) THEN 18.0682
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 5) THEN 18.0638
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 6) THEN 18.0412
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 7) THEN 18.0385
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 8) THEN 18.0712
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 9) THEN 18.0695
    ELSE lng
  END,
  name = CASE 
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 0) THEN '7-Eleven Klarabergsgatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 1) THEN '7-Eleven Regeringsgatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 2) THEN '7-Eleven Drottninggatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 3) THEN '7-Eleven Sveavägen'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 4) THEN '7-Eleven Götgatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 5) THEN '7-Eleven Mariatorget'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 6) THEN '7-Eleven Fleminggatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 7) THEN '7-Eleven Hantverkargatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 8) THEN '7-Eleven Kungsgatan'
    WHEN id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 9) THEN '7-Eleven Birger Jarlsgatan'
    ELSE name
  END
WHERE partner = '7-Eleven';

-- Step 3: Insert missing booths if we have fewer than 10
INSERT INTO booths (partner, address, lat, lng, name, availability, status)
SELECT '7-Eleven', 'Fleminggatan 34, 112 32 Stockholm', 59.3365, 18.0412, '7-Eleven Fleminggatan', true, 'available'
WHERE (SELECT COUNT(*) FROM booths WHERE partner = '7-Eleven') < 7;

INSERT INTO booths (partner, address, lat, lng, name, availability, status)
SELECT '7-Eleven', 'Hantverkargatan 79, 112 38 Stockholm', 59.3375, 18.0385, '7-Eleven Hantverkargatan', true, 'available'
WHERE (SELECT COUNT(*) FROM booths WHERE partner = '7-Eleven') < 8;

INSERT INTO booths (partner, address, lat, lng, name, availability, status)
SELECT '7-Eleven', 'Kungsgatan 9, 111 43 Stockholm', 59.3318, 18.0712, '7-Eleven Kungsgatan', true, 'available'
WHERE (SELECT COUNT(*) FROM booths WHERE partner = '7-Eleven') < 9;

INSERT INTO booths (partner, address, lat, lng, name, availability, status)
SELECT '7-Eleven', 'Birger Jarlsgatan 39, 111 45 Stockholm', 59.3365, 18.0695, '7-Eleven Birger Jarlsgatan', true, 'available'
WHERE (SELECT COUNT(*) FROM booths WHERE partner = '7-Eleven') < 10;

-- Step 4: Update denormalized booth data in existing sessions
UPDATE sessions 
SET 
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND b.partner = '7-Eleven';

-- Step 5: Verify the results
SELECT id, name, partner, address, lat, lng, created_at
FROM booths 
WHERE partner = '7-Eleven' 
ORDER BY created_at;
