import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { PostHog } from 'posthog-node';
import axios from 'axios';

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// PostHog client
export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY!,
  {
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  }
);

// Google Places API client
export const googlePlacesClient = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/place',
  timeout: 10000,
});

// Initialize services
export const initializeServices = () => {
  console.log('🔧 Initializing services...');
  
  // Test Supabase connection
  supabase.from('booths').select('count').then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected');
    }
  });

  // Test Stripe connection
  stripe.balance.retrieve().then(() => {
    console.log('✅ Stripe connected');
  }).catch((error) => {
    console.error('❌ Stripe connection failed:', error.message);
  });

  // Test PostHog connection
  posthog.capture({
    distinctId: 'system',
    event: 'service_initialized',
    properties: {
      service: 'backend',
      timestamp: new Date().toISOString()
    }
  });
  console.log('✅ PostHog connected');

  console.log('🎉 All services initialized');
};
