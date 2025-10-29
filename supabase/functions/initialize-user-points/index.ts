import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { clerkUserId } = await req.json()

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'clerkUserId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's internal ID from clerk_user_id
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const user_id = user.id

    // Check if user points already exist
    const { data: existingPoints, error: checkError } = await supabaseClient
      .from('user_points')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingPoints) {
      return new Response(
        JSON.stringify({ message: 'User points already initialized' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize user points with 250 welcome points
    const { data: newPoints, error: insertError } = await supabaseClient
      .from('user_points')
      .insert({
        user_id: user_id,
        total_points: 250,
        available_points: 250,
        lifetime_earned: 250
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Add welcome points transaction
    await supabaseClient
      .from('points_transactions')
      .insert({
        user_id: user_id,
        amount: 250,
        transaction_type: 'bonus',
        source: 'welcome_bonus',
        description: 'Welcome bonus points'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        points: newPoints,
        message: 'User points initialized with 250 welcome points'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error initializing user points:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
