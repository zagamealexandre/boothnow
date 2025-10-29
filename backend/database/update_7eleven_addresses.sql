-- Update 7-Eleven addresses with actual Stockholm locations
-- This updates all 10 7-Eleven booths with real addresses

-- 1. Klarabergsgatan 56, 111 21 Stockholm
UPDATE booths SET 
  address = 'Klarabergsgatan 56, 111 21 Stockholm',
  lat = 59.3349,
  lng = 18.0558,
  name = '7-Eleven Klarabergsgatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_001';

-- 2. Regeringsgatan 54, 111 56 Stockholm
UPDATE booths SET 
  address = 'Regeringsgatan 54, 111 56 Stockholm',
  lat = 59.3318,
  lng = 18.0638,
  name = '7-Eleven Regeringsgatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_002';

-- 3. Drottninggatan 90 B, 111 36 Stockholm
UPDATE booths SET 
  address = 'Drottninggatan 90 B, 111 36 Stockholm',
  lat = 59.3378,
  lng = 18.0662,
  name = '7-Eleven Drottninggatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_003';

-- 4. Sveavägen 55, 113 59 Stockholm
UPDATE booths SET 
  address = 'Sveavägen 55, 113 59 Stockholm',
  lat = 59.3423,
  lng = 18.0554,
  name = '7-Eleven Sveavägen'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_004';

-- 5. Götgatan 25, 116 46 Stockholm
UPDATE booths SET 
  address = 'Götgatan 25, 116 46 Stockholm',
  lat = 59.3138,
  lng = 18.0682,
  name = '7-Eleven Götgatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_005';

-- 6. Mariatorget 1A, 118 48 Stockholm
UPDATE booths SET 
  address = 'Mariatorget 1A, 118 48 Stockholm',
  lat = 59.3172,
  lng = 18.0638,
  name = '7-Eleven Mariatorget'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_006';

-- 7. Fleminggatan 34, 112 32 Stockholm
UPDATE booths SET 
  address = 'Fleminggatan 34, 112 32 Stockholm',
  lat = 59.3365,
  lng = 18.0412,
  name = '7-Eleven Fleminggatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_007';

-- 8. Hantverkargatan 79, 112 38 Stockholm
UPDATE booths SET 
  address = 'Hantverkargatan 79, 112 38 Stockholm',
  lat = 59.3375,
  lng = 18.0385,
  name = '7-Eleven Hantverkargatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_008';

-- 9. Kungsgatan 9, 111 43 Stockholm
UPDATE booths SET 
  address = 'Kungsgatan 9, 111 43 Stockholm',
  lat = 59.3318,
  lng = 18.0712,
  name = '7-Eleven Kungsgatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_009';

-- 10. Birger Jarlsgatan 39, 111 45 Stockholm
UPDATE booths SET 
  address = 'Birger Jarlsgatan 39, 111 45 Stockholm',
  lat = 59.3365,
  lng = 18.0695,
  name = '7-Eleven Birger Jarlsgatan'
WHERE place_id = 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_010';

-- Update denormalized booth data in existing sessions
-- This ensures historical sessions show the correct booth information
UPDATE sessions 
SET 
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND b.partner = '7-Eleven';

