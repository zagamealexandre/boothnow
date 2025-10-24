import { Router } from 'express';
import { supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/sessions - Get user's active sessions
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        booths (
          id,
          partner,
          address,
          lat,
          lng
        )
      `)
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sessions fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    res.json({ sessions: sessions || [] });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions/start - Start a new session
router.post('/start', async (req: AuthenticatedRequest, res) => {
  try {
    const { booth_id, reservation_id } = req.body;

    if (!booth_id || !reservation_id) {
      return res.status(400).json({ error: 'Booth ID and reservation ID are required' });
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: req.userId,
        booth_id,
        reservation_id,
        start_time: new Date().toISOString(),
        status: 'active'
      })
      .select(`
        *,
        booths (
          id,
          partner,
          address,
          lat,
          lng
        )
      `)
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }


    res.json({ 
      session,
      message: 'Session started successfully' 
    });

  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/sessions/:id/end - End a session
router.post('/:id/end', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { total_minutes, total_cost } = req.body;

    // Update session
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        total_minutes,
        total_cost
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select(`
        *,
        booths (
          id,
          partner,
          address
        )
      `)
      .single();

    if (error) {
      console.error('Session end error:', error);
      return res.status(500).json({ error: 'Failed to end session' });
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update booth availability
    await supabase
      .from('booths')
      .update({ availability: true })
      .eq('id', session.booth_id);


    res.json({ 
      session,
      message: 'Session ended successfully' 
    });

  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /api/sessions/:id/timer - Get session timer data
router.get('/:id/timer', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    const startTime = new Date(session.start_time);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

    res.json({
      session_id: id,
      start_time: session.start_time,
      elapsed_minutes: elapsedMinutes,
      status: session.status
    });

  } catch (error) {
    console.error('Session timer error:', error);
    res.status(500).json({ error: 'Failed to get session timer' });
  }
});

export { router as sessionRoutes };
