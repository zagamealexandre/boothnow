-- Update 7-Eleven addresses with actual Stockholm locations
-- This script works with your actual database schema
-- 
-- To preview current booths before updating, run this separately:
-- SELECT id, name, partner, address, lat, lng 
-- FROM booths 
-- WHERE partner = '7-Eleven' 
-- ORDER BY created_at;

-- Update all 7-Eleven booths with new addresses
-- We'll update them in order of creation (oldest first)

-- 1. Klarabergsgatan 56, 111 21 Stockholm
UPDATE booths SET 
  address = 'Klarabergsgatan 56, 111 21 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Klarabergsgatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 0);

-- 2. Regeringsgatan 54, 111 56 Stockholm
UPDATE booths SET 
  address = 'Regeringsgatan 54, 111 56 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Regeringsgatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 1);

-- 3. Drottninggatan 90 B, 111 36 Stockholm
UPDATE booths SET 
  address = 'Drottninggatan 90 B, 111 36 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Drottninggatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 2);

-- 4. Sveavägen 55, 113 59 Stockholm
UPDATE booths SET 
  address = 'Sveavägen 55, 113 59 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Sveavägen'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 3);

-- 5. Götgatan 25, 116 46 Stockholm
UPDATE booths SET 
  address = 'Götgatan 25, 116 46 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Götgatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 4);

-- 6. Mariatorget 1A, 118 48 Stockholm
UPDATE booths SET 
  address = 'Mariatorget 1A, 118 48 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Mariatorget'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 5);

-- 7. Fleminggatan 34, 112 32 Stockholm
UPDATE booths SET 
  address = 'Fleminggatan 34, 112 32 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Fleminggatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 6);

-- 8. Hantverkargatan 79, 112 38 Stockholm
UPDATE booths SET 
  address = 'Hantverkargatan 79, 112 38 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Hantverkargatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 7);

-- 9. Kungsgatan 9, 111 43 Stockholm
UPDATE booths SET 
  address = 'Kungsgatan 9, 111 43 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Kungsgatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 8);

-- 10. Birger Jarlsgatan 39, 111 45 Stockholm
UPDATE booths SET 
  address = 'Birger Jarlsgatan 39, 111 45 Stockholm',
  lat = 59.3326,
  lng = 18.0649,
  name = '7-Eleven Birger Jarlsgatan'
WHERE partner = '7-Eleven' 
  AND id = (SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 1 OFFSET 9);

-- Update denormalized booth data in existing sessions
-- This ensures historical sessions show the correct booth information
UPDATE sessions 
SET 
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND b.partner = '7-Eleven';

-- Verify the updates (run this separately to see results):
-- SELECT id, name, partner, address, lat, lng 
-- FROM booths 
-- WHERE partner = '7-Eleven' 
-- ORDER BY name;
