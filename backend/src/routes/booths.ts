import { Router } from 'express';
import { supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/booths - Get all available booths
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    let query = supabase
      .from('booths')
      .select('*')
      .eq('availability', true);

    // If location provided, filter by distance (this is a simplified version)
    if (lat && lng) {
      // In a real implementation, you'd use PostGIS for proper distance calculations
      query = query;
    }

    const { data: booths, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch booths' });
    }


    res.json({ booths: booths || [] });

  } catch (error) {
    console.error('Booths fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch booths' });
  }
});

// GET /api/booths/:id - Get specific booth details
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: booth, error } = await supabase
      .from('booths')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch booth' });
    }

    if (!booth) {
      return res.status(404).json({ error: 'Booth not found' });
    }


    res.json({ booth });

  } catch (error) {
    console.error('Booth fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch booth' });
  }
});

// POST /api/booths/:id/reserve - Reserve a booth
router.post('/:id/reserve', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { duration_minutes = 60 } = req.body;

    // Check if booth is available
    const { data: booth, error: boothError } = await supabase
      .from('booths')
      .select('*')
      .eq('id', id)
      .single();

    if (boothError || !booth) {
      return res.status(404).json({ error: 'Booth not found' });
    }

    if (!booth.availability) {
      return res.status(409).json({ error: 'Booth is not available' });
    }

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: req.userId,
        booth_id: id,
        start_time: new Date().toISOString(),
        duration_minutes,
        status: 'pending'
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Reservation error:', reservationError);
      return res.status(500).json({ error: 'Failed to create reservation' });
    }

    // Update booth availability
    await supabase
      .from('booths')
      .update({ availability: false })
      .eq('id', id);


    res.json({ 
      reservation,
      message: 'Booth reserved successfully' 
    });

  } catch (error) {
    console.error('Booth reservation error:', error);
    res.status(500).json({ error: 'Failed to reserve booth' });
  }
});

export { router as boothRoutes };
