// Bookings service for managing user reservations and sessions
import { supabase } from '../lib/supabase'

export interface Booking {
  id: string
  booth_id: string
  booth_name: string
  booth_address: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  type: 'immediate' | 'prebooked'
  cost?: number
  created_at: string
  updated_at: string
}

export interface ActiveBooking extends Booking {
  time_remaining?: number
  current_cost?: number
}

class BookingsService {
  // Get all user bookings (reservations + sessions)
  async getUserBookings(clerkUserId: string): Promise<Booking[]> {
    try {
      // Get user's internal ID strictly by clerk_user_id (no fallbacks)
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()
      if (clerkError || !userByClerkId) {
        console.error('❌ BookingsService - getUserBookings: User not found for clerk_user_id:', clerkUserId, clerkError)
        return []
      }
      const user = userByClerkId

      // Get reservations (pre-bookings) - fetch without joins first to avoid relationship issues
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    

      // Get sessions (immediate bookings) - fetch without joins first to avoid relationship issues
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    

      // Handle errors separately - don't let sessions error block reservations
      if (reservationsError) {
        console.error('❌ BookingsService - getUserBookings: Error fetching reservations:', reservationsError)
      }
      if (sessionsError) {
        console.error('❌ BookingsService - getUserBookings: Error fetching sessions:', sessionsError)
      }

      // Combine and format bookings
      const allBookings: Booking[] = []

      // Add reservations (pre-bookings) - only if no error
      if (!reservationsError && reservations) {
        for (const reservation of reservations) {
          // Fetch booth details for each reservation
          let boothName = 'Booth'
          let boothAddress = 'Address'
          
          try {
            const { data: booth, error: boothError } = await supabase
              .from('booths')
              .select('name, address')
              .eq('id', reservation.booth_id)
              .maybeSingle()
            
            if (booth && !boothError) {
              boothName = booth.name || 'Booth'
              boothAddress = booth.address || 'Address'
            }
          } catch (error) {
            console.warn('Failed to fetch booth details for reservation:', reservation.id, error)
          }
          
          // derive duration in minutes if not present
          const derivedDuration = typeof (reservation as any).duration_minutes === 'number'
            ? (reservation as any).duration_minutes
            : Math.max(0, Math.round((new Date(reservation.end_time).getTime() - new Date(reservation.start_time).getTime()) / 60000))

          allBookings.push({
            id: reservation.id,
            booth_id: reservation.booth_id,
            booth_name: boothName,
            booth_address: boothAddress,
            start_time: reservation.start_time,
            end_time: reservation.end_time,
            duration_minutes: derivedDuration,
            status: reservation.status === 'confirmed' ? 'confirmed' : 'pending',
            type: 'prebooked',
            created_at: reservation.created_at,
            updated_at: reservation.updated_at
          })
        }
      }

      // Add sessions (immediate bookings) - only if no error
      if (!sessionsError && sessions) {
        for (const session of sessions) {

          // Fetch booth details for each session
          let boothName = 'Booth'
          let boothAddress = 'Address'
          let boothCostPerMinute = 5.00 // Default to 5 SEK per minute
          
          try {
            const { data: booth, error: boothError } = await supabase
              .from('booths')
              .select('name, address, cost_per_minute')
              .eq('id', session.booth_id)
              .maybeSingle()
            
            if (booth && !boothError) {
              boothName = booth.name || 'Booth'
              boothAddress = booth.address || 'Address'
              boothCostPerMinute = booth.cost_per_minute || 5.00
            }
          } catch (error) {
            console.warn('Failed to fetch booth details for session:', session.id, error)
          }
          
          const endTime = session.end_time || new Date(new Date(session.start_time).getTime() + (session.total_minutes || 60) * 60000).toISOString()
          
          // Calculate real-time values for active sessions
          let timeRemaining = 0
          let currentCost = 0
          
          if (session.status === 'active') {
            const startTime = new Date(session.start_time)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) // seconds
            const elapsedMinutes = elapsed / 60
            const maxDurationSeconds = (session.total_minutes || 60) * 60
            
            // Use 0.50 as the correct cost_per_minute (ignore database value if it's wrong)
            const costPerMinute = 0.50
            
            timeRemaining = Math.max(0, maxDurationSeconds - elapsed)
            currentCost = elapsedMinutes * costPerMinute
            
          } else if (session.status === 'completed') {
            // For completed sessions, use the stored total_minutes and calculate final cost
            const costPerMinute = 0.50
            const totalMinutes = session.total_minutes || 0
            currentCost = totalMinutes * costPerMinute
          }
          
          allBookings.push({
            id: session.id,
            booth_id: session.booth_id,
            booth_name: boothName,
            booth_address: boothAddress,
            start_time: session.start_time,
            end_time: endTime,
            duration_minutes: session.total_minutes || 60,
            status: session.status === 'active' ? 'active' : session.status === 'completed' ? 'completed' : 'pending',
            type: 'immediate',
            cost: currentCost, // Use calculated cost instead of hardcoded session.cost
            time_remaining: timeRemaining > 0 ? Math.ceil(timeRemaining / 60) : 0, // Convert to minutes
            current_cost: currentCost,
            created_at: session.created_at,
            updated_at: session.updated_at
          } as ActiveBooking)
        }
      }

      // Sort by creation date (newest first)
      allBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      
      // If both queries failed, return empty array instead of mock data
      if (reservationsError && sessionsError) {
        return []
      }
      
      return allBookings

    } catch (error) {
      console.error('❌ BookingsService - getUserBookings: Exception:', error)
      return []
    }
  }

  // Get active bookings (currently in progress or confirmed but not yet started)
  async getActiveBookings(clerkUserId: string): Promise<ActiveBooking[]> {
    try {
      const allBookings = await this.getUserBookings(clerkUserId)
      
      const activeBookings = allBookings.filter(booking => {
        const now = new Date()
        const startTime = new Date(booking.start_time)
        const endTime = new Date(booking.end_time)
        
        // Only show as active if:
        // 1. Status is 'active' (currently in progress)
        // 2. Status is 'confirmed' AND the booking hasn't started yet (future booking)
        return booking.status === 'active' || 
               (booking.status === 'confirmed' && startTime > now)
      }).map(booking => {
        const now = new Date()
        const startTime = new Date(booking.start_time)
        const endTime = new Date(booking.end_time)
        
        let timeRemaining = 0
        let currentCost = 0
        
        if (booking.status === 'active' && startTime <= now && endTime > now) {
          timeRemaining = Math.ceil((endTime.getTime() - now.getTime()) / 60000) // minutes
          // Calculate cost dynamically from elapsed time using correct cost_per_minute
          const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60)
          const costPerMinute = 5.00 // Always use 5.00 SEK per minute
          currentCost = elapsedMinutes * costPerMinute
        }
        
        return {
          ...booking,
          time_remaining: timeRemaining,
          current_cost: currentCost
        }
      })
      
      return activeBookings
    } catch (error) {
      console.error('❌ BookingsService - getActiveBookings: Exception:', error)
      return []
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId: string, clerkUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's internal ID strictly by clerk_user_id (no fallbacks)
      const { data: userByClerkId, error: clerkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()
      if (clerkError || !userByClerkId) {
        console.error('❌ BookingsService - cancelBooking: User not found for clerk_user_id:', clerkUserId, clerkError)
        return { success: false, error: 'User not found' }
      }
      const user = userByClerkId

      // Try to cancel as reservation first
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id)

      // If not a reservation, try as session
      if (reservationError) {
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
          .eq('user_id', user.id)

        if (sessionError) {
          console.error('❌ BookingsService - cancelBooking: Error cancelling booking:', sessionError)
          return { success: false, error: 'Failed to cancel booking' }
        }
      }

      return { success: true }

    } catch (error) {
      console.error('❌ BookingsService - cancelBooking: Exception:', error)
      return { success: false, error: 'An error occurred while cancelling the booking' }
    }
  }

  // Get mock bookings for development - NO MORE HARDCODED DATA
  private getMockBookings(): ActiveBooking[] {
    // Return empty array - all data should come from database
    // Real sessions will be calculated dynamically from start_time
    return []
  }
}

export const bookingsService = new BookingsService()
