import { Router } from 'express';
import { posthog } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/analytics/track - Track custom events
router.post('/track', async (req: AuthenticatedRequest, res) => {
  try {
    const { event, properties = {} } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Track event with PostHog
    posthog.capture({
      distinctId: req.userId!,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        user_id: req.userId
      }
    });

    res.json({ message: 'Event tracked successfully' });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// POST /api/analytics/identify - Identify user for analytics
router.post('/identify', async (req: AuthenticatedRequest, res) => {
  try {
    const { properties = {} } = req.body;

    // Identify user with PostHog
    posthog.identify({
      distinctId: req.userId!,
      properties: {
        ...properties,
        user_id: req.userId,
        identified_at: new Date().toISOString()
      }
    });

    res.json({ message: 'User identified successfully' });

  } catch (error) {
    console.error('Analytics identify error:', error);
    res.status(500).json({ error: 'Failed to identify user' });
  }
});

// GET /api/analytics/insights - Get user analytics insights
router.get('/insights', async (req: AuthenticatedRequest, res) => {
  try {
    // This would typically fetch from PostHog API or your analytics database
    // For now, return a placeholder response
    res.json({
      insights: {
        total_sessions: 0,
        average_session_duration: 0,
        favorite_time_of_day: 'morning',
        usage_trend: 'increasing',
        recommendations: [
          'Try booking during off-peak hours for better availability',
          'Consider a monthly subscription for frequent users'
        ]
      }
    });

  } catch (error) {
    console.error('Analytics insights error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics insights' });
  }
});

export { router as analyticsRoutes };
