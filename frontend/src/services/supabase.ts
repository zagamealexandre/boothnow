import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Booth {
  id: string;
  partner: string;
  place_id?: string;
  lat: number;
  lng: number;
  address: string;
  availability: boolean;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  booth_id: string;
  reservation_id?: string;
  start_time: string;
  end_time?: string;
  total_minutes?: number;
  total_cost?: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  booths?: Booth;
}

export interface Reservation {
  id: string;
  user_id: string;
  booth_id: string;
  start_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clerk_user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}
