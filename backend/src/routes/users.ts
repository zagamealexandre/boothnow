import { Router } from 'express';
import { supabase, posthog } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/profile - Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('User profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // If user doesn't exist, create one
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: req.userId,
          email: req.user?.email_addresses?.[0]?.email_address,
          first_name: req.user?.first_name,
          last_name: req.user?.last_name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      return res.json({ user: newUser });
    }

    res.json({ user });

  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { first_name, last_name, phone_number, preferences } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        phone_number,
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', req.userId)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    // Track analytics
    posthog.capture({
      distinctId: req.userId!,
      event: 'profile_updated',
      properties: {
        has_phone: !!phone_number,
        has_preferences: !!preferences
      }
    });

    res.json({ user });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// GET /api/users/sessions - Get user's session history
router.get('/sessions', async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

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
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      console.error('Sessions history error:', error);
      return res.status(500).json({ error: 'Failed to fetch session history' });
    }

    res.json({ sessions: sessions || [] });

  } catch (error) {
    console.error('Sessions history error:', error);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    // Get total sessions
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    // Get total minutes
    const { data: sessions } = await supabase
      .from('sessions')
      .select('total_minutes')
      .eq('user_id', req.userId)
      .not('total_minutes', 'is', null);

    const totalMinutes = sessions?.reduce((sum, session) => sum + (session.total_minutes || 0), 0) || 0;

    // Get favorite partner
    const { data: partnerStats } = await supabase
      .from('sessions')
      .select(`
        booths!inner(partner)
      `)
      .eq('user_id', req.userId);

    const partnerCounts = partnerStats?.reduce((acc: any, session: any) => {
      const partner = session.booths.partner;
      acc[partner] = (acc[partner] || 0) + 1;
      return acc;
    }, {});

    const favoritePartner = Object.keys(partnerCounts || {}).reduce((a, b) => 
      (partnerCounts?.[a] || 0) > (partnerCounts?.[b] || 0) ? a : b, '');

    res.json({
      total_sessions: totalSessions || 0,
      total_minutes: totalMinutes,
      favorite_partner: favoritePartner,
      average_session_minutes: totalSessions ? Math.round(totalMinutes / totalSessions) : 0
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export { router as userRoutes };
