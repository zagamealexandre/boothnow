// Shared Supabase client to avoid multiple GoTrueClient instances
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with fallback for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('🔍 Shared Supabase - Config:', {
  url: supabaseUrl,
  keyPresent: !!supabaseKey,
  isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key',
  actualUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  actualKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
});

export const supabase = createClient(supabaseUrl, supabaseKey)
