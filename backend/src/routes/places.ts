import { Router } from 'express';
import { googlePlacesClient } from '../services';
import { supabase } from '../services';

const router = Router();

// GET /api/places/7eleven?lat=59.33&lng=18.06
router.get('/7eleven', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Search for 7-Eleven stores using Google Places API
    const placesResponse = await googlePlacesClient.get('/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: radius,
        keyword: '7-Eleven',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    const places = placesResponse.data.results || [];

    // Get BoothNow-enabled booths from Supabase
    const { data: booths, error } = await supabase
      .from('booths')
      .select('*')
      .eq('partner', '7-Eleven')
      .eq('availability', true);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch booth data' });
    }

    // Merge Google Places data with BoothNow booth data
    const enrichedPlaces = places.map((place: any) => {
      const booth = booths?.find(b => b.place_id === place.place_id);
      
      return {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating,
        price_level: place.price_level,
        photos: place.photos,
        boothnow_enabled: !!booth,
        booth_id: booth?.id,
        availability: booth?.availability || false,
        last_sync: booth?.last_sync
      };
    });

    return res.json({
      places: enrichedPlaces,
      total: enrichedPlaces.length,
      boothnow_count: booths?.length || 0
    });

  } catch (error) {
    console.error('Places API error:', error);
    return res.status(500).json({ error: 'Failed to fetch places data' });
  }
});

// GET /api/places/details/:place_id
router.get('/details/:place_id', async (req, res) => {
  try {
    const { place_id } = req.params;

    const detailsResponse = await googlePlacesClient.get('/details/json', {
      params: {
        place_id,
        fields: 'name,formatted_address,geometry,rating,price_level,photos,opening_hours,phone_number,website',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    const place = detailsResponse.data.result;

    // Check if this place has a BoothNow booth
    const { data: booth } = await supabase
      .from('booths')
      .select('*')
      .eq('place_id', place_id)
      .single();

    return res.json({
      ...place,
      boothnow_enabled: !!booth,
      booth: booth || null
    });

  } catch (error) {
    console.error('Place details error:', error);
    return res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

export { router as placesRoutes };
