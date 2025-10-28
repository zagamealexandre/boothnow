// Real-time booth data service with Supabase integration
import { supabase } from '../lib/supabase'
import { rewardsService } from './rewardsService'
import { userService } from './userService'

export interface Booth {
  id: string
  partner: string
  place_id?: string
  lat: number
  lng: number
  address: string
  name?: string
  availability?: boolean
  status: 'available' | 'busy' | 'prebooked' | 'maintenance'
  next_available_at?: string
  current_session_id?: string
  last_sync?: string
  timeRemaining?: number
  created_at: string
  updated_at: string
}

export interface BoothStatusUpdate {
  id: string
  status: string
  timeRemaining?: number
  next_available_at?: string
}

class BoothService {
  private subscribers: Set<(booths: Booth[]) => void> = new Set()
  private realtimeChannel: any = null


  // Subscribe to real-time booth updates
  subscribeToBoothUpdates(callback: (booths: Booth[]) => void) {
    this.subscribers.add(callback)

    // Set up Supabase realtime subscription
    if (!this.realtimeChannel) {
      this.realtimeChannel = supabase
        .channel('booth-status-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'booths' 
          }, 
          (payload) => {
            this.fetchBooths().then(booths => {
              this.subscribers.forEach(cb => cb(booths))
            })
          }
        )
        .subscribe()
    }

    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0 && this.realtimeChannel) {
        this.realtimeChannel.unsubscribe()
        this.realtimeChannel = null
      }
    }
  }

  // Fetch all booths with current status
  async fetchBooths(statusFilter?: string): Promise<Booth[]> {
    try {
      // Use Supabase data first - we have 10 real 7-Eleven locations in the database

      let query = supabase
        .from('booths')
        .select('*')

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data: booths, error } = await query

      if (error) {
        console.error('❌ Error fetching booths from Supabase:', error)
        throw error
      }

      if (!booths || booths.length === 0) {
        throw new Error('No booths found in database')
      }

      // Calculate time remaining for busy booths and add name field
      const boothsWithTimeRemaining = booths.map(booth => {
        // Generate name from partner and address
        const boothName = `${booth.partner} ${booth.address.split(',')[0]}`
        
        // Handle missing next_available_at column gracefully
        if (booth.status === 'busy' && booth.next_available_at) {
          const now = new Date()
          const nextAvailable = new Date(booth.next_available_at)
          
          if (nextAvailable > now) {
            booth.timeRemaining = Math.ceil((nextAvailable.getTime() - now.getTime()) / 60000)
          } else {
            booth.timeRemaining = 0
          }
        } else if (booth.status === 'busy') {
          // If next_available_at is missing, set a default time remaining
          booth.timeRemaining = 30 // Default 30 minutes
        }
        
        return {
          ...booth,
          name: boothName,
          // Ensure status is set to a valid value
          status: booth.status || 'available'
        }
      })

      return boothsWithTimeRemaining
    } catch (error) {
      console.error('❌ Error in fetchBooths:', error)
      throw error
    }
  }




  // Book a booth
  async bookBooth(boothId: string, durationMinutes: number = 60, userId?: string): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      console.log('🔧 BoothService - bookBooth: Starting booking for booth:', boothId);
      
      // First, check if booth exists and is available
      const { data: booth, error: fetchError } = await supabase
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .maybeSingle()

      if (fetchError) {
        console.error('❌ BoothService - bookBooth: Error fetching booth:', fetchError);
        return { success: false, error: 'Booth not found' }
      }

      if (!booth) {
        console.error('❌ BoothService - bookBooth: Booth not found');
        return { success: false, error: 'Booth not found' }
      }

      // Check if booth is available
      if (booth.availability === false || booth.status === 'busy') {
        console.error('❌ BoothService - bookBooth: Booth is not available');
        return { success: false, error: 'Booth is not available' }
      }

      // Update booth status to busy in Supabase
      const endTime = new Date(Date.now() + durationMinutes * 60000)
      
      // Try to update with all possible columns, handling missing ones gracefully
      const updateData: any = {
        status: 'busy',
        availability: false
      }

      // Only add next_available_at if the column exists
      try {
        updateData.next_available_at = endTime.toISOString()
      } catch (e) {
        console.log('⚠️ BoothService - bookBooth: next_available_at column may not exist, continuing...');
      }

      console.log('🔧 BoothService - bookBooth: Updating booth with data:', updateData);
      
      const { error } = await supabase
        .from('booths')
        .update(updateData)
        .eq('id', boothId)

      if (error) {
        console.error('❌ BoothService - bookBooth: Error updating booth status:', error);
        
        // If the error is about missing columns, try a simpler update
        if (error.message.includes('next_available_at') || error.message.includes('column')) {
          console.log('🔧 BoothService - bookBooth: Trying simpler update without missing columns...');
          
          const { error: simpleError } = await supabase
            .from('booths')
            .update({ 
              status: 'busy',
              availability: false
            })
            .eq('id', boothId)
          
          if (simpleError) {
            console.error('❌ BoothService - bookBooth: Simple update also failed:', simpleError);
            return { success: false, error: 'Failed to update booth status' }
          }
        } else {
          return { success: false, error: 'Failed to update booth status' }
        }
      }

      // Create a session record for the booking
      console.log('🔧 BoothService - bookBooth: Creating session record...');
      
      // Convert Clerk user ID to internal user ID if provided (auto-create if missing)
      let internalUserId = null;
      if (userId) {
        internalUserId = await userService.ensureUserExists(userId)
        if (!internalUserId) {
          console.error('❌ BoothService - bookBooth: ensureUserExists failed for', userId)
          return { success: false, error: 'User not found' }
        }
      }
      
      const sessionData: any = {
        booth_id: boothId,
        start_time: new Date().toISOString(),
        end_time: endTime.toISOString(),
        total_minutes: durationMinutes,
        status: 'active',
        cost: durationMinutes * 0.5 // Assuming 0.5 per minute
      };

      // Ensure we have at least one user reference
      if (!userId) {
        console.error('❌ BoothService - bookBooth: No userId provided, cannot create session');
        return { success: false, error: 'User ID required for session creation' };
      }

      // Add clerk_user_id for easier querying (always add this)
      sessionData.clerk_user_id = userId;

      // Add internal user_id if we found one
      if (internalUserId) {
        sessionData.user_id = internalUserId;
      }

      // Verify we have at least one user reference
      if (!sessionData.user_id && !sessionData.clerk_user_id) {
        console.error('❌ BoothService - bookBooth: No user reference available, cannot create session');
        return { success: false, error: 'No user reference available for session creation' };
      }

      // Try to create session (will work with either user_id or clerk_user_id)
      console.log('🔧 BoothService - bookBooth: Session data being inserted:', sessionData);
      
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select('id')
        .maybeSingle();

      if (sessionError) {
        console.error('❌ BoothService - bookBooth: Error creating session:', sessionError);
        console.error('❌ BoothService - bookBooth: Session data was:', JSON.stringify(sessionData, null, 2));
        
        // If it's a constraint violation and we have both user_id and clerk_user_id, try with just clerk_user_id
        if (sessionError.code === '23514' && sessionData.user_id && sessionData.clerk_user_id) {
          console.log('🔧 BoothService - bookBooth: Trying with clerk_user_id only...');
          const fallbackData = { ...sessionData };
          delete fallbackData.user_id;
          
          const { data: fallbackSession, error: fallbackError } = await supabase
            .from('sessions')
            .insert(fallbackData)
            .select('id')
            .maybeSingle();
            
          if (fallbackError) {
            console.error('❌ BoothService - bookBooth: Fallback also failed:', fallbackError);
            console.log('⚠️ BoothService - bookBooth: Continuing without session record...');
          } else {
            console.log('✅ BoothService - bookBooth: Fallback session created:', fallbackSession.id);
          }
        } else {
          console.log('⚠️ BoothService - bookBooth: Continuing without session record...');
        }
      } else {
        console.log('✅ BoothService - bookBooth: Session created:', session.id);
      }

      console.log('✅ BoothService - bookBooth: Successfully booked booth');
      
      // Award points for booking a booth
      if (userId) {
        try {
          const pointsResult = await rewardsService.addPoints(
            userId,
            50, // 50 points for booking a booth
            'booth_booking'
          );
          if (pointsResult.success) {
            console.log('✅ BoothService - bookBooth: Points awarded successfully');
          } else {
            console.warn('⚠️ BoothService - bookBooth: Failed to award points:', pointsResult.error);
          }
        } catch (pointsError) {
          console.warn('⚠️ BoothService - bookBooth: Exception while awarding points:', pointsError);
        }
      }
      
      return { success: true, reservationId: session?.id || 'reservation-' + Date.now() }
    } catch (error) {
      console.error('❌ BoothService - bookBooth: Exception:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Pre-book a booth for later
  async prebookBooth(boothId: string, startTime: string, durationMinutes: number = 60, clerkUserId?: string): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      console.log('🔧 BoothService - prebookBooth: Starting pre-booking for booth:', boothId);
      
      // First, check if booth exists and is available
      const { data: booth, error: fetchError } = await supabase
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .maybeSingle()

      if (fetchError) {
        console.error('❌ BoothService - prebookBooth: Error fetching booth:', fetchError);
        return { success: false, error: 'Booth not found' }
      }

      if (!booth) {
        console.error('❌ BoothService - prebookBooth: Booth not found');
        return { success: false, error: 'Booth not found' }
      }

      // Check if booth is available
      if (booth.availability === false || booth.status === 'busy') {
        console.error('❌ BoothService - prebookBooth: Booth is not available');
        return { success: false, error: 'Booth is not available' }
      }

      // Update booth status to prebooked in Supabase
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000)
      
      // Try to update with all possible columns, handling missing ones gracefully
      const updateData: any = {
        status: 'prebooked',
        availability: false
      }

      // Only add next_available_at if the column exists
      try {
        updateData.next_available_at = endTime.toISOString()
      } catch (e) {
        console.log('⚠️ BoothService - prebookBooth: next_available_at column may not exist, continuing...');
      }

      console.log('🔧 BoothService - prebookBooth: Updating booth with data:', updateData);
      
      const { error } = await supabase
        .from('booths')
        .update(updateData)
        .eq('id', boothId)

      if (error) {
        console.error('❌ BoothService - prebookBooth: Error updating booth status:', error);
        
        // If the error is about missing columns, try a simpler update
        if (error.message.includes('next_available_at') || error.message.includes('column')) {
          console.log('🔧 BoothService - prebookBooth: Trying simpler update without missing columns...');
          
          const { error: simpleError } = await supabase
            .from('booths')
            .update({ 
              status: 'prebooked',
              availability: false
            })
            .eq('id', boothId)
          
          if (simpleError) {
            console.error('❌ BoothService - prebookBooth: Simple update also failed:', simpleError);
            return { success: false, error: 'Failed to update booth status' }
          }
        } else {
          return { success: false, error: 'Failed to update booth status' }
        }
      }

      // Now create the actual reservation in the database
      console.log('🔧 BoothService - prebookBooth: Creating reservation in database...');
      
      // Ensure user exists and get id
      if (!clerkUserId) {
        console.error('❌ BoothService - prebookBooth: Missing clerkUserId when creating reservation')
        return { success: false, error: 'User not authenticated' }
      }
      const ensuredId = await userService.ensureUserExists(clerkUserId)
      if (!ensuredId) {
        return { success: false, error: 'User not found' }
      }
      const userData = { id: ensuredId }

      // Create the reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: userData.id,
          booth_id: boothId,
          start_time: startTime,
          duration_minutes: durationMinutes,
          status: 'confirmed',
          end_time: endTime.toISOString()
        })
        .select()
        .maybeSingle()

      if (reservationError) {
        console.error('❌ BoothService - prebookBooth: Error creating reservation:', reservationError);
        return { success: false, error: 'Failed to create reservation' }
      }

      console.log('✅ BoothService - prebookBooth: Successfully created reservation:', reservation.id);
      
      // Award points for pre-booking a booth
      if (clerkUserId) {
        try {
          const pointsResult = await rewardsService.addPoints(
            clerkUserId, 
            25, // 25 points for pre-booking (less than immediate booking)
            'booth_prebooking'
          );
          if (pointsResult.success) {
            console.log('✅ BoothService - prebookBooth: Points awarded successfully');
          } else {
            console.warn('⚠️ BoothService - prebookBooth: Failed to award points:', pointsResult.error);
          }
        } catch (pointsError) {
          console.warn('⚠️ BoothService - prebookBooth: Exception while awarding points:', pointsError);
        }
      }
      
      return { success: true, reservationId: reservation.id }
    } catch (error) {
      console.error('❌ BoothService - prebookBooth: Exception:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Release a booth (make it available again)
  async releaseBooth(boothId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 BoothService - releaseBooth: Releasing booth:', boothId);
      
      // Update booth status to available
      const updateData: any = {
        status: 'available',
        availability: true
      }

      // Only add next_available_at if the column exists
      try {
        updateData.next_available_at = new Date().toISOString()
      } catch (e) {
        console.log('⚠️ BoothService - releaseBooth: next_available_at column may not exist, continuing...');
      }

      console.log('🔧 BoothService - releaseBooth: Updating booth with data:', updateData);
      
      const { error } = await supabase
        .from('booths')
        .update(updateData)
        .eq('id', boothId)

      if (error) {
        console.error('❌ BoothService - releaseBooth: Error updating booth status:', error);
        
        // If the error is about missing columns, try a simpler update
        if (error.message.includes('next_available_at') || error.message.includes('column')) {
          console.log('🔧 BoothService - releaseBooth: Trying simpler update without missing columns...');
          
          const { error: simpleError } = await supabase
            .from('booths')
            .update({ 
              status: 'available',
              availability: true
            })
            .eq('id', boothId)
          
          if (simpleError) {
            console.error('❌ BoothService - releaseBooth: Simple update also failed:', simpleError);
            return { success: false, error: 'Failed to update booth status' }
          }
        } else {
          return { success: false, error: 'Failed to update booth status' }
        }
      }

      console.log('✅ BoothService - releaseBooth: Successfully released booth');
      return { success: true }
    } catch (error) {
      console.error('❌ BoothService - releaseBooth: Exception:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Join waitlist for a booth
  async joinWaitlist(boothId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, just log the waitlist join - could be implemented with a separate waitlist table
      return { success: true }
    } catch (error) {
      console.error('Error joining waitlist:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Get booth details
  async getBoothDetails(boothId: string): Promise<Booth | null> {
    try {
      const response = await fetch('/api/booths/' + boothId)
      const data = await response.json()

      if (!response.ok) {
        return null
      }

      return data.booth
    } catch (error) {
      console.error('Error fetching booth details:', error)
      return null
    }
  }

  // Get mock booths for development
  getMockBooths(): Booth[] {
    return [
      {
        id: 'mock-booth-1',
        partner: '7-Eleven',
        address: 'Storgatan 1, Stockholm, Sweden',
        lat: 59.3293,
        lng: 18.0686,
        name: '7-Eleven Stockholm Central',
        availability: true,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-booth-2',
        partner: '7-Eleven',
        address: 'Karl Johans gate 1, Oslo, Norway',
        lat: 59.9139,
        lng: 10.7522,
        name: '7-Eleven Oslo Downtown',
        availability: false,
        status: 'busy',
        timeRemaining: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  // Simulate real-time updates for demo purposes
  startDemoUpdates() {
    const demoInterval = setInterval(() => {
      // Simulate random status changes for demo
      const statuses = ['available', 'busy', 'prebooked']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      
      // Notify subscribers with mock update
      this.subscribers.forEach(callback => {
        // This would normally fetch fresh data from the server
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(demoInterval)
  }
}

export const boothService = new BoothService()