import { Router } from 'express';
import { creem, supabase } from '../services';
import { AuthenticatedRequest } from '../middleware/auth';
import { getProductConfig } from '../config/products';

const router = Router();

// Debug endpoint to test authentication
router.get('/debug-auth', async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({
      userId: req.userId,
      user: req.user,
      headers: req.headers,
      message: 'Authentication debug info'
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return res.status(500).json({ error: 'Debug auth failed' });
  }
});

// POST /api/payments/create-checkout - Create checkout session
router.post('/create-checkout', async (req: AuthenticatedRequest, res) => {
  try {
    const { product_id, booth_id, duration_minutes = 60 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Create checkout session with Creem using correct API format
    const response = await fetch('https://test-api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CREEM_API_TEST!
      },
      body: JSON.stringify({
        product_id: product_id,
        units: 1,
        customer: {
          email: req.user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?payment=success`,
        metadata: {
          ...(booth_id && { booth_id }),
          user_id: req.userId!,
          ...(duration_minutes && { duration_minutes }),
          type: booth_id ? 'booth_session' : 'subscription'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Creem API error:', response.status, errorText);
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const checkout = await response.json() as any;

    return res.json({
      checkout_url: checkout.checkout_url,
      checkout_id: checkout.id,
      message: 'Checkout session created successfully'
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// GET /api/payments/checkout/:id - Get checkout session details
router.get('/checkout/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Retrieve checkout session from Creem API
    const response = await fetch(`https://test-api.creem.io/v1/checkouts/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_TEST!
      }
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const checkout = await response.json() as any;

    return res.json({
      checkout: {
        id: checkout.id,
        status: checkout.status,
        checkout_url: checkout.checkout_url,
        success_url: checkout.success_url
      },
      message: 'Checkout session retrieved successfully'
    });

  } catch (error) {
    console.error('Checkout retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve checkout session' });
  }
});

// POST /api/payments/create-subscription - Create subscription for recurring payments
router.post('/create-subscription', async (req: AuthenticatedRequest, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // For now, return mock response
    return res.status(501).json({ 
      error: 'Subscription creation not directly supported',
      message: 'Use /create-checkout instead to create a subscription'
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// GET /api/payments/subscriptions - Get all subscriptions for customer
router.get('/subscriptions', async (req: AuthenticatedRequest, res) => {
  try {
    // Debug: Log the full user object to understand the structure
    console.log('🔍 User object from auth:', JSON.stringify(req.user, null, 2));
    
    // Try different ways to get the email
    let customerEmail = req.user?.email; // Use the email extracted in auth middleware
    
    // If not found in the extracted email, try other common locations
    if (!customerEmail) {
      customerEmail = req.user?.emailAddresses?.[0]?.emailAddress;
    }
    
    if (!customerEmail) {
      customerEmail = req.user?.email_address;
    }
    
    if (!customerEmail) {
      console.error('❌ No email found in user object:', req.user);
      // For now, return empty subscriptions instead of error to allow testing
      console.log('⚠️ Returning empty subscriptions due to missing email');
      return res.json({ 
        subscriptions: [],
        debug: {
          user: req.user,
          userId: req.userId,
          message: 'No email found in user object'
        }
      });
    }

    console.log('🔍 Fetching subscriptions for customer:', customerEmail);

    // Try to get all subscriptions first (Creem might not support email filtering)
    const response = await fetch(`https://test-api.creem.io/v1/subscriptions`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_TEST!
      }
    });

    if (!response.ok) {
      console.error('❌ Creem API error:', response.status, response.statusText);
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    console.log('📊 Creem subscriptions response:', JSON.stringify(data, null, 2));

    // Filter subscriptions by customer email
    const allSubscriptions = data.data || data || [];
    const userSubscriptions = allSubscriptions.filter((subscription: any) => 
      subscription.customer?.email === customerEmail
    );

    console.log(`📊 Found ${userSubscriptions.length} subscriptions for ${customerEmail}`);

    const subscriptions = userSubscriptions.map((subscription: any) => ({
      id: subscription.id,
      status: subscription.status,
      product_id: subscription.product?.id,
      product_name: subscription.product?.name,
      customer_email: subscription.customer?.email,
      current_period_start: subscription.current_period_start_date,
      current_period_end: subscription.current_period_end_date,
      next_transaction_date: subscription.next_transaction_date,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    }));

    return res.json({ 
      subscriptions: subscriptions
    });

  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET /api/payments/subscription/:id - Get subscription details
router.get('/subscription/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Get subscription from Creem API
    const response = await fetch(`https://test-api.creem.io/v1/subscriptions/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_TEST!
      }
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const subscription = await response.json() as any;

    return res.json({ 
      subscription: {
        id: subscription.id,
        status: subscription.status,
        product_id: subscription.product?.id,
        customer_email: subscription.customer?.email,
        current_period_start: subscription.current_period_start_date,
        current_period_end: subscription.current_period_end_date,
        next_transaction_date: subscription.next_transaction_date,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      }
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST /api/payments/upgrade-subscription - Upgrade subscription
router.post('/upgrade-subscription', async (req: AuthenticatedRequest, res) => {
  try {
    const { subscription_id, product_id, update_behavior = 'proration-charge-immediately' } = req.body;

    if (!subscription_id || !product_id) {
      return res.status(400).json({ error: 'Subscription ID and Product ID are required' });
    }

    // Upgrade subscription using Creem API
    const response = await fetch(`https://test-api.creem.io/v1/subscriptions/${subscription_id}/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CREEM_API_TEST!
      },
      body: JSON.stringify({
        product_id: product_id,
        update_behavior: update_behavior
      })
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const subscription = await response.json() as any;

    return res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        product_id: subscription.product?.id,
        current_period_start: subscription.current_period_start_date,
        current_period_end: subscription.current_period_end_date,
        next_transaction_date: subscription.next_transaction_date
      },
      message: 'Subscription upgraded successfully'
    });

  } catch (error) {
    console.error('Subscription upgrade error:', error);
    return res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// POST /api/payments/update-subscription - Update subscription
router.post('/update-subscription', async (req: AuthenticatedRequest, res) => {
  try {
    const { subscription_id, ...updateData } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Update subscription using Creem API
    const response = await fetch(`https://test-api.creem.io/v1/subscriptions/${subscription_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CREEM_API_TEST!
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const subscription = await response.json() as any;

    return res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        product_id: subscription.product?.id,
        current_period_start: subscription.current_period_start_date,
        current_period_end: subscription.current_period_end_date,
        next_transaction_date: subscription.next_transaction_date
      },
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// POST /api/payments/cancel-subscription - Cancel subscription
router.post('/cancel-subscription', async (req: AuthenticatedRequest, res) => {
  try {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Cancel subscription using Creem API
    const response = await fetch(`https://test-api.creem.io/v1/subscriptions/${subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CREEM_API_TEST!
      }
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const subscription = await response.json() as any;

    return res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceled_at: subscription.canceled_at
      },
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});


// GET /api/payments/products - Get available products
router.get('/products', async (req: AuthenticatedRequest, res) => {
  try {
    // Check if API key is configured
    if (!process.env.CREEM_API_TEST) {
      console.error('❌ CREEM_API_TEST environment variable not set');
      return res.status(500).json({ error: 'Creem API key not configured' });
    }

    console.log('🔑 Using Creem API key:', process.env.CREEM_API_TEST.substring(0, 10) + '...');

    // Use the correct Creem API endpoint for listing products
    console.log('🔑 Using Creem API key:', process.env.CREEM_API_TEST.substring(0, 10) + '...');
    
    try {
      console.log('🔍 Fetching products from Creem API...');
      const response = await fetch('https://test-api.creem.io/v1/products/search', {
        method: 'GET',
        headers: {
          'x-api-key': process.env.CREEM_API_TEST!
        }
      });

      console.log('📡 Creem API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Creem API error:', response.status, errorText);
        throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      console.log('✅ Creem API response:', data);
      
      // The response structure is { items: [...], pagination: {...} }
      const products = data.items || [];
      
      console.log('🔍 Creem Products from API:');
      products.forEach((product: any) => {
        console.log(`  - ID: ${product.id}`);
        console.log(`  - Name: ${product.name}`);
        console.log(`  - Price: ${product.price}`);
        console.log(`  - Billing Type: ${product.billing_type}`);
        console.log('  ---');
      });
      
          // Enhance products with our configuration
          const enhancedProducts = products.map((product: any) => {
            const config = getProductConfig(product.id);
            
            // Convert price from cents to euros for display
            const priceInEuros = product.price / 100;
            
            return {
              ...product,
              // Convert price to euros
              price: priceInEuros,
              // Add our configuration data if available
              ...(config && {
                displayName: config.name,
                type: config.type,
                displayPrice: config.price,
                description: config.description,
                features: config.features
              }),
              // Add debug info to help identify which product is which
              _debug: {
                hasConfig: !!config,
                creemName: product.name,
                creemPrice: product.price,
                originalPrice: product.price
              }
            };
          });
      
      return res.json({
        products: enhancedProducts
      });
      
    } catch (error) {
      console.error('❌ Creem API error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Products fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/payments/products/:id - Get specific product
router.get('/products/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch specific product from Creem API
    const response = await fetch(`https://test-api.creem.io/v1/products/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.CREEM_API_TEST!
      }
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const product = await response.json() as any;
    
    // Enhance product with our configuration
    const config = getProductConfig(product.id);
    const enhancedProduct = {
      ...product,
      // Add our configuration data if available
      ...(config && {
        displayName: config.name,
        type: config.type,
        displayPrice: config.price,
        description: config.description,
        features: config.features
      })
    };

    return res.json({ product: enhancedProduct });

  } catch (error) {
    console.error('Product fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/payments/setup-payment-method - Setup payment method for pay-per-use
router.post('/setup-payment-method', async (req: AuthenticatedRequest, res) => {
  try {
    const { customer_email, customer_name } = req.body;

    if (!customer_email) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

      // For pay-per-use model, we don't need to create a customer in Creem upfront
      // We'll create the customer when they actually make a payment
      // For now, just mark the user as ready for pay-per-use billing
      
      const { error: dbError } = await supabase
        .from('users')
        .update({
          payment_method_setup: true,
          payment_type: 'pay_per_use',
          customer_email: customer_email,
          customer_name: customer_name || 'BoothNow User'
        })
        .eq('clerk_user_id', req.userId);

      if (dbError) {
        console.error('Database update error:', dbError);
        return res.status(500).json({ error: 'Failed to update user payment info' });
      }

      return res.json({
        message: 'Payment method setup completed. You can now use booths and will be charged after each session.',
        payment_type: 'pay_per_use',
        customer_email: customer_email
      });

  } catch (error) {
    console.error('Payment method setup error:', error);
    return res.status(500).json({ error: 'Failed to setup payment method' });
  }
});

// GET /api/payments/payment-status - Check if user has payment method setup
router.get('/payment-status', async (req: AuthenticatedRequest, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('payment_method_setup, payment_type, customer_email, customer_name')
      .eq('clerk_user_id', req.userId)
      .single();

    if (error || !user) {
      return res.status(200).json({ 
        payment_method_setup: false,
        payment_type: null,
        customer_email: null,
        customer_name: null,
        message: 'User not found' 
      });
    }

    return res.json({
      payment_method_setup: user.payment_method_setup || false,
      payment_type: user.payment_type,
      customer_email: user.customer_email,
      customer_name: user.customer_name
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// POST /api/payments/charge-session - Charge user after booth session
router.post('/charge-session', async (req: AuthenticatedRequest, res) => {
  try {
    const { session_id, duration_minutes, booth_id } = req.body;

    if (!session_id || !duration_minutes) {
      return res.status(400).json({ error: 'Session ID and duration are required' });
    }

    // Get user's payment info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('creem_customer_id, payment_method_setup')
      .eq('clerk_user_id', req.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.payment_method_setup || !user.creem_customer_id) {
      return res.status(400).json({ error: 'Payment method not setup' });
    }

    // Calculate charge amount (€0.50 per minute)
    const ratePerMinute = 0.50; // €0.50 per minute
    const amount = Math.round(duration_minutes * ratePerMinute * 100); // Convert to cents

    // Create a payment intent for the session
    const response = await fetch('https://test-api.creem.io/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CREEM_API_TEST!
      },
      body: JSON.stringify({
        customer_id: user.creem_customer_id,
        amount: amount,
        currency: 'EUR',
        metadata: {
          session_id,
          booth_id,
          duration_minutes,
          user_id: req.userId,
          type: 'booth_session'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Creem payment intent error:', response.status, errorText);
      throw new Error(`Creem API error: ${response.status} ${response.statusText}`);
    }

    const paymentIntent = await response.json() as any;

    // Store payment record in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: req.userId,
        clerk_user_id: req.userId,
        session_id,
        booth_id,
        amount: amount,
        currency: 'EUR',
        status: 'pending',
        creem_payment_intent_id: paymentIntent.id,
        payment_type: 'session_charge',
        metadata: {
          duration_minutes,
          rate_per_minute: ratePerMinute
        }
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    return res.json({
      payment_intent_id: paymentIntent.id,
      amount: amount,
      amount_display: `€${(amount / 100).toFixed(2)}`,
      duration_minutes,
      message: 'Session charge created successfully'
    });

  } catch (error) {
    console.error('Session charge error:', error);
    return res.status(500).json({ error: 'Failed to charge session' });
  }
});

// GET /api/payments/payment-status/:session_id - Check payment status for a session
router.get('/payment-status/:session_id', async (req: AuthenticatedRequest, res) => {
  try {
    const { session_id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', session_id)
      .eq('clerk_user_id', req.userId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json({
      payment: {
        id: payment.id,
        session_id: payment.session_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        created_at: payment.created_at,
        metadata: payment.metadata
      }
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export { router as paymentRoutes };