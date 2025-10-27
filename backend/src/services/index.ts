import { createClient } from '@supabase/supabase-js';
import { Creem } from 'creem';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Creem client - using test mode
export const creem = new Creem({ 
  serverIdx: 1 // 0: production, 1: test-mode
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

  // Test Creem connection
  creem.retrieveProduct({
    productId: 'test',
    xApiKey: process.env.CREEM_API_TEST || 'test-key'
  }).then(() => {
    console.log('✅ Creem connected');
  }).catch((error) => {
    console.error('❌ Creem connection failed:', error.message);
  });


  console.log('🎉 All services initialized');
};
