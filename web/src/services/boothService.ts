// Real-time booth data service with Supabase integration
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with fallback for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Check if Supabase is properly configured
    if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
      // Set up mock realtime updates for development
      const mockInterval = setInterval(() => {
        const mockBooths = this.getMockBooths()
        this.subscribers.forEach(cb => cb(mockBooths))
      }, 30000) // Update every 30 seconds

      return () => {
        this.subscribers.delete(callback)
        clearInterval(mockInterval)
        if (this.subscribers.size === 0) {
          this.realtimeChannel = null
        }
      }
    }

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
      
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        console.error('❌ SUPABASE NOT CONFIGURED!')
        console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
        console.error('Current values:', { supabaseUrl, supabaseKey })
        throw new Error('Supabase not configured - please set environment variables')
      }

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
        
        if (booth.status === 'busy' && booth.next_available_at) {
          const now = new Date()
          const nextAvailable = new Date(booth.next_available_at)
          
          if (nextAvailable > now) {
            booth.timeRemaining = Math.ceil((nextAvailable.getTime() - now.getTime()) / 60000)
          } else {
            booth.timeRemaining = 0
          }
        }
        
        return {
          ...booth,
          name: boothName
        }
      })

      return boothsWithTimeRemaining
    } catch (error) {
      console.error('❌ Error in fetchBooths:', error)
      throw error
    }
  }




  // Book a booth
  async bookBooth(boothId: string, durationMinutes: number = 60): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      // Update booth status to busy in Supabase
      const endTime = new Date(Date.now() + durationMinutes * 60000)
      const { error } = await supabase
        .from('booths')
        .update({ 
          status: 'busy', 
          availability: false,
          next_available_at: endTime.toISOString()
        })
        .eq('id', boothId)

      if (error) {
        console.error('Error updating booth status:', error)
        return { success: false, error: 'Failed to update booth status' }
      }

      return { success: true, reservationId: 'reservation-' + Date.now() }
    } catch (error) {
      console.error('Error booking booth:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Pre-book a booth for later
  async prebookBooth(boothId: string, startTime: string, durationMinutes: number = 60): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    try {
      // Update booth status to prebooked in Supabase
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000)
      const { error } = await supabase
        .from('booths')
        .update({ 
          status: 'prebooked', 
          availability: false,
          next_available_at: endTime.toISOString()
        })
        .eq('id', boothId)

      if (error) {
        console.error('Error updating booth status:', error)
        return { success: false, error: 'Failed to update booth status' }
      }

      return { success: true, reservationId: 'prebook-' + Date.now() }
    } catch (error) {
      console.error('Error pre-booking booth:', error)
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