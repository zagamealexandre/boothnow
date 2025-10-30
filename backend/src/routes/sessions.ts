import { Router } from 'express';
import { supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/sessions - Get user's active sessions
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Resolve internal user UUID from Clerk sub (req.userId)
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', req.userId as string)
      .maybeSingle();

    const internalUserId = userRow?.id || null;

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
      // Prefer internal user id when available; otherwise fall back to clerk_user_id
      .or(
        internalUserId
          ? `user_id.eq.${internalUserId},clerk_user_id.eq.${req.userId}`
          : `clerk_user_id.eq.${req.userId}`
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Sessions fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    return res.json({ sessions: sessions || [] });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions/start - Start a new session
router.post('/start', async (req: AuthenticatedRequest, res) => {
  try {
    const { booth_id, reservation_id } = req.body;

    if (!booth_id || !reservation_id) {
      return res.status(400).json({ error: 'Booth ID and reservation ID are required' });
    }

    // Resolve internal user UUID from Clerk sub (req.userId)
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', req.userId as string)
      .maybeSingle();

    const insertPayload: any = {
      booth_id,
      reservation_id,
      start_time: new Date().toISOString(),
      status: 'active',
      clerk_user_id: req.userId,
    };

    if (userRow?.id) {
      insertPayload.user_id = userRow.id;
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert(insertPayload)
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

    // Update booth status to busy and set next_available_at
    try {
      // Try to derive precise end time: reservation end_time > booth.max_duration fallback > default
      let nextAvailableAt: string | null = null;

      // 1) If there is a reservation, use its end_time
      if (reservation_id) {
        const { data: reservation } = await supabase
          .from('reservations')
          .select('end_time')
          .eq('id', reservation_id)
          .maybeSingle();
        if (reservation?.end_time) {
          nextAvailableAt = new Date(reservation.end_time).toISOString();
        }
      }

      // 2) Else compute from user's plan (pay-per-use: 60m, subscription: 90m), capped by booth.max_duration if set
      if (!nextAvailableAt) {
        // Fetch user's payment_type and booth max_duration in parallel
        const [{ data: userPlanRow }, { data: boothRow }] = await Promise.all([
          supabase
            .from('users')
            .select('payment_type')
            .eq('id', userRow?.id as string)
            .maybeSingle(),
          supabase
            .from('booths')
            .select('max_duration')
            .eq('id', booth_id)
            .maybeSingle(),
        ]);

        const planType = (userPlanRow?.payment_type || 'pay_per_use').toLowerCase();
        const planMinutes = planType === 'pay_per_use' ? 60 : 90; // monthly/subscription => 90
        const cap = typeof boothRow?.max_duration === 'number' ? boothRow!.max_duration! : planMinutes;
        const minutes = Math.min(planMinutes, cap || planMinutes);
        nextAvailableAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      }

      await supabase
        .from('booths')
        .update({
          status: 'busy',
          availability: false,
          next_available_at: nextAvailableAt,
          current_session_id: session.id,
        } as any)
        .eq('id', session.booth_id);
    } catch (e) {
      console.warn('Failed to update booth status to busy:', e);
    }

    return res.json({ 
      session,
      message: 'Session started successfully' 
    });

  } catch (error) {
    console.error('Session start error:', error);
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/sessions/:id/end - End a session
router.post('/:id/end', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { total_minutes, total_cost } = req.body;

    // Resolve internal user UUID from Clerk sub (req.userId)
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', req.userId as string)
      .maybeSingle();

    // Update session
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        total_minutes,
        total_cost,
        // Keep both fields in sync for DB triggers that expect `cost`
        cost: total_cost,
      } as any)
      .eq('id', id)
      .or(
        userRow?.id
          ? `user_id.eq.${userRow.id},clerk_user_id.eq.${req.userId}`
          : `clerk_user_id.eq.${req.userId}`
      )
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
    try {
      await supabase
        .from('booths')
        .update({
          availability: true,
          status: 'available',
          next_available_at: null,
          current_session_id: null,
        } as any)
        .eq('id', session.booth_id);
    } catch (e) {
      console.warn('Failed to update booth status to available:', e);
    }

    // Fallback: ensure a receipt exists if DB trigger didn't create it
    try {
      const { data: existingReceipt } = await supabase
        .from('receipts')
        .select('id')
        .eq('session_id', session.id)
        .maybeSingle();

      if (!existingReceipt) {
        const amount = (session as any).cost ?? (session as any).total_cost ?? 0;
        const receiptNum = `RCP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`;
        const { error: receiptInsertErr } = await supabase
          .from('receipts')
          .insert({
            user_id: (session as any).user_id,
            session_id: session.id,
            payment_id: null,
            receipt_number: receiptNum,
            amount,
            currency: 'SEK',
            receipt_data: {
              receipt_number: receiptNum,
              session_id: session.id,
              booth_name: session.booths?.partner || 'Booth',
              booth_address: session.booths?.address || '',
              start_time: session.start_time,
              end_time: session.end_time,
              duration_minutes: (session as any).total_minutes ?? 0,
              amount,
              currency: 'SEK',
              generated_at: new Date().toISOString(),
            },
          } as any);

        if (receiptInsertErr) {
          console.warn('Receipt fallback insert failed:', receiptInsertErr);
        }
      }
    } catch (e) {
      console.warn('Receipt fallback flow failed:', e);
    }

    return res.json({ 
      session,
      message: 'Session ended successfully' 
    });

  } catch (error) {
    console.error('Session end error:', error);
    return res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /api/sessions/:id/timer - Get session timer data
router.get('/:id/timer', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Resolve internal user UUID from Clerk sub (req.userId)
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', req.userId as string)
      .maybeSingle();

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .or(
        userRow?.id
          ? `user_id.eq.${userRow.id},clerk_user_id.eq.${req.userId}`
          : `clerk_user_id.eq.${req.userId}`
      )
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

    return res.json({
      session_id: id,
      start_time: session.start_time,
      elapsed_minutes: elapsedMinutes,
      status: session.status
    });

  } catch (error) {
    console.error('Session timer error:', error);
    return res.status(500).json({ error: 'Failed to get session timer' });
  }
});

export { router as sessionRoutes };
