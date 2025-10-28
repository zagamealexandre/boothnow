import { Router } from 'express';
import { supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/help/faq - Get FAQ items
router.get('/faq', async (req: AuthenticatedRequest, res) => {
  try {
    const { category, search } = req.query;
    
    let query = supabase
      .from('faq_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    const { data: faqs, error } = await query;

    if (error) {
      console.error('FAQ fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch FAQ items' });
    }

    return res.json({ faqs: faqs || [] });

  } catch (error) {
    console.error('FAQ error:', error);
    return res.status(500).json({ error: 'Failed to fetch FAQ items' });
  }
});

// POST /api/help/feedback - Submit feedback
router.post('/feedback', async (req: AuthenticatedRequest, res) => {
  try {
    const { type, message, rating, contact_email } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        user_id: req.userId,
        type: type || 'general',
        message,
        rating: rating || null,
        contact_email: contact_email || null,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Feedback submission error:', error);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    return res.json({ 
      feedback,
      message: 'Feedback submitted successfully' 
    });

  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/help/support-tickets - Get user's support tickets
router.get('/support-tickets', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Support tickets fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch support tickets' });
    }

    return res.json({ tickets: tickets || [] });

  } catch (error) {
    console.error('Support tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// POST /api/help/support-tickets - Create support ticket
router.post('/support-tickets', async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, description, priority = 'medium', category } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: req.userId,
        subject,
        description,
        priority,
        category: category || 'general',
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Support ticket creation error:', error);
      return res.status(500).json({ error: 'Failed to create support ticket' });
    }

    return res.json({ 
      ticket,
      message: 'Support ticket created successfully' 
    });

  } catch (error) {
    console.error('Support ticket error:', error);
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// GET /api/help/contact-options - Get contact options
router.get('/contact-options', async (req: AuthenticatedRequest, res) => {
  try {
    const contactOptions = {
      live_chat: {
        available: true,
        hours: '24/7',
        response_time: 'Immediate'
      },
      phone: {
        available: true,
        number: '+46 8 123 456 78',
        hours: 'Mon-Fri 9AM-6PM',
        response_time: 'Immediate'
      },
      email: {
        available: true,
        address: 'support@boothnow.com',
        hours: '24/7',
        response_time: 'Within 24 hours'
      },
      emergency: {
        available: true,
        number: '+46 8 123 456 79',
        hours: '24/7',
        response_time: 'Immediate'
      }
    };

    return res.json({ contactOptions });

  } catch (error) {
    console.error('Contact options error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact options' });
  }
});

export { router as helpRoutes };
