import { Router } from 'express';
import { stripe } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/payments/create-intent - Create payment intent for per-minute billing
router.post('/create-intent', async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, currency = 'eur', booth_id } = req.body;

    if (!amount || !booth_id) {
      return res.status(400).json({ error: 'Amount and booth_id are required' });
    }

    // Create payment intent with pre-authorization
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: req.userId, // Using Clerk user ID as customer ID
      metadata: {
        booth_id,
        user_id: req.userId!,
        type: 'per_minute'
      },
      capture_method: 'manual', // Pre-authorize, capture later
      description: `BoothNow session - Booth ${booth_id}`
    });


    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/payments/capture - Capture pre-authorized payment
router.post('/capture', async (req: AuthenticatedRequest, res) => {
  try {
    const { payment_intent_id, amount } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(
      payment_intent_id,
      amount ? { amount_to_capture: Math.round(amount * 100) } : {}
    );


    res.json({
      payment_intent: paymentIntent,
      message: 'Payment captured successfully'
    });

  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// POST /api/payments/create-subscription - Create monthly subscription
router.post('/create-subscription', async (req: AuthenticatedRequest, res) => {
  try {
    const { price_id, payment_method_id } = req.body;

    if (!price_id || !payment_method_id) {
      return res.status(400).json({ error: 'Price ID and payment method ID are required' });
    }

    // Create customer if doesn't exist
    let customer;
    try {
      customer = await stripe.customers.retrieve(req.userId!);
    } catch (error) {
      customer = await stripe.customers.create({
        id: req.userId!,
        metadata: {
          clerk_user_id: req.userId!
        }
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price_id }],
      payment_method: payment_method_id,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: req.userId!,
        type: 'monthly_subscription'
      }
    });


    res.json({
      subscription,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// GET /api/payments/subscription/:id - Get subscription details
router.get('/subscription/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const subscription = await stripe.subscriptions.retrieve(id);

    res.json({ subscription });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST /api/payments/webhook - Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object);
      break;
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object);
      break;
    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export { router as paymentRoutes };
