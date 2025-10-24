import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
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


  console.log('🎉 All services initialized');
};
