-- Update 7-Eleven addresses with actual Stockholm locations
-- This script ensures you have exactly 10 booths with correct addresses

-- Step 1: Update existing booths one by one
DO $$
DECLARE
  booth_rec RECORD;
  booth_index INTEGER := 0;
  current_count INTEGER;
  addresses TEXT[] := ARRAY[
    'Klarabergsgatan 56, 111 21 Stockholm',
    'Regeringsgatan 54, 111 56 Stockholm',
    'Drottninggatan 90 B, 111 36 Stockholm',
    'Sveavägen 55, 113 59 Stockholm',
    'Götgatan 25, 116 46 Stockholm',
    'Mariatorget 1A, 118 48 Stockholm',
    'Fleminggatan 34, 112 32 Stockholm',
    'Hantverkargatan 79, 112 38 Stockholm',
    'Kungsgatan 9, 111 43 Stockholm',
    'Birger Jarlsgatan 39, 111 45 Stockholm'
  ];
  lats NUMERIC[] := ARRAY[
    59.33192995657272,
    59.335281416835706,
    59.33685455436803,
    59.34063226553074,
    59.31747102981793,
    59.31885810378899,
    59.33427906453149,
    59.334419192309994,
    59.33600357299437,
    59.338908460127165
  ];
  lngs NUMERIC[] := ARRAY[
    18.0598507,
    18.06795568650755,
    18.05889227116415,
    18.058559971164847,
    18.071973186505,
    18.06346012883585,
    18.036144244179255,
    18.029185170431216,
    18.069898586507552,
    18.067872328835932
  ];
  names TEXT[] := ARRAY[
    '7-Eleven Klarabergsgatan',
    '7-Eleven Regeringsgatan',
    '7-Eleven Drottninggatan',
    '7-Eleven Sveavägen',
    '7-Eleven Götgatan',
    '7-Eleven Mariatorget',
    '7-Eleven Fleminggatan',
    '7-Eleven Hantverkargatan',
    '7-Eleven Kungsgatan',
    '7-Eleven Birger Jarlsgatan'
  ];
BEGIN
  -- Update existing booths
  FOR booth_rec IN 
    SELECT id FROM booths WHERE partner = '7-Eleven' ORDER BY created_at LIMIT 10
  LOOP
    booth_index := booth_index + 1;
    
    UPDATE booths SET
      address = addresses[booth_index],
      lat = lats[booth_index],
      lng = lngs[booth_index],
      name = names[booth_index]
    WHERE id = booth_rec.id;
  END LOOP;
  
  -- Insert missing booths (ensure we have exactly 10)
  SELECT COUNT(*) INTO current_count FROM booths WHERE partner = '7-Eleven';
  
  FOR booth_index IN (current_count + 1)..10 LOOP
    INSERT INTO booths (partner, address, lat, lng, name, availability, status)
    VALUES (
      '7-Eleven',
      addresses[booth_index],
      lats[booth_index],
      lngs[booth_index],
      names[booth_index],
      true,
      'available'
    );
  END LOOP;
END $$;

-- Step 2: Update denormalized booth data in existing sessions
UPDATE sessions 
SET 
  booth_name = b.name,
  booth_address = b.address
FROM booths b
WHERE sessions.booth_id = b.id 
  AND b.partner = '7-Eleven';

-- Step 3: Verify the results
SELECT id, name, partner, address, lat, lng, created_at
FROM booths 
WHERE partner = '7-Eleven' 
ORDER BY created_at;
