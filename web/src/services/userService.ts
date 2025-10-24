// User service for fetching user data from Clerk and Supabase
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserProfile {
  id: string
  clerk_user_id: string
  email?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserStats {
  total_sessions: number
  total_time_minutes: number
  total_spent: number
  member_since: string
}

export interface SessionHistory {
  id: string
  booth_name: string
  booth_address: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  cost?: number
  status: 'active' | 'completed' | 'cancelled'
}

class UserService {
  // Get user profile from Supabase
  async getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
    try {
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        return this.getMockUserProfile(clerkUserId)
      }


      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results gracefully

      if (error) {
        console.error('Error fetching user profile:', error)
        // If user doesn't exist, return mock data for now
        return this.getMockUserProfile(clerkUserId)
      }

      if (!data) {
        return this.getMockUserProfile(clerkUserId)
      }

      return data
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return this.getMockUserProfile(clerkUserId)
    }
  }

  // Initialize user profile if it doesn't exist
  async initializeUserProfile(clerkUserId: string, clerkUserData?: any): Promise<UserProfile | null> {
    try {
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        return this.getClerkUserProfile(clerkUserId, clerkUserData)
      }


      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      if (existingUser) {
        return await this.getUserProfile(clerkUserId)
      }

      // Create new user profile
      const userData = {
        clerk_user_id: clerkUserId,
        email: clerkUserData?.emailAddresses?.[0]?.emailAddress || 'user@example.com',
        first_name: clerkUserData?.firstName || 'User',
        last_name: clerkUserData?.lastName || '',
        phone_number: clerkUserData?.phoneNumbers?.[0]?.phoneNumber || null,
        preferences: {},
        created_at: clerkUserData?.createdAt ? new Date(clerkUserData.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return this.getClerkUserProfile(clerkUserId, clerkUserData)
      }

      return data
    } catch (error) {
      console.error('Error in initializeUserProfile:', error)
      return this.getClerkUserProfile(clerkUserId, clerkUserData)
    }
  }

  // Get user profile from Clerk data when Supabase is not available
  private getClerkUserProfile(clerkUserId: string, clerkUserData?: any): UserProfile {
    return {
      id: 'clerk-' + clerkUserId,
      clerk_user_id: clerkUserId,
      email: clerkUserData?.emailAddresses?.[0]?.emailAddress || 'user@example.com',
      first_name: clerkUserData?.firstName || 'User',
      last_name: clerkUserData?.lastName || '',
      phone_number: clerkUserData?.phoneNumbers?.[0]?.phoneNumber || null,
      preferences: {},
      created_at: clerkUserData?.createdAt ? new Date(clerkUserData.createdAt).toISOString() : new Date().toISOString(),
      updated_at: clerkUserData?.updatedAt ? new Date(clerkUserData.updatedAt).toISOString() : new Date().toISOString()
    }
  }

  // Get user statistics
  async getUserStats(clerkUserId: string): Promise<UserStats> {
    try {
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        return this.getMockUserStats()
      }


      // Get total sessions - try clerk_user_id first, fallback to user_id
      let { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('clerk_user_id', clerkUserId) // Use clerk_user_id field
        .eq('status', 'completed')

      // If clerk_user_id doesn't work, try with user_id (for backward compatibility)
      if (sessionsError && sessionsError.code === '42703') {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .single()

        if (user) {
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')

          sessions = sessionsByUserId
          sessionsError = sessionsByUserIdError
        }
      }

      if (sessionsError) {
        console.error('Error fetching user sessions:', sessionsError)
        return this.getMockUserStats()
      }

      // Calculate stats
      const totalSessions = sessions?.length || 0
      const totalTimeMinutes = sessions?.reduce((sum, session) => sum + (session.total_minutes || 0), 0) || 0
      const totalSpent = sessions?.reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0

      // Get member since date
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }) : 'October 2024'


      return {
        total_sessions: totalSessions,
        total_time_minutes: totalTimeMinutes,
        total_spent: totalSpent,
        member_since: memberSince
      }
    } catch (error) {
      console.error('Error in getUserStats:', error)
      return this.getMockUserStats()
    }
  }

  // Get user session history
  async getUserSessionHistory(clerkUserId: string, limit: number = 5): Promise<SessionHistory[]> {
    try {
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        return this.getMockSessionHistory()
      }


      // Try clerk_user_id first, fallback to user_id if needed
      let { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          booths (
            partner,
            address
          )
        `)
        .eq('clerk_user_id', clerkUserId) // Use clerk_user_id field
        .order('created_at', { ascending: false })
        .limit(limit)

      // If clerk_user_id doesn't work, try with user_id (for backward compatibility)
      if (error && error.code === '42703') {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .single()

        if (user) {
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select(`
              *,
              booths (
                partner,
                address
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

          sessions = sessionsByUserId
          error = sessionsByUserIdError
        }
      }

      if (error) {
        console.error('Error fetching session history:', error)
        return this.getMockSessionHistory()
      }

      if (!sessions || sessions.length === 0) {
        return this.getMockSessionHistory()
      }

      const sessionHistory = sessions.map(session => ({
        id: session.id,
        booth_name: session.booths?.partner ? `${session.booths.partner} ${session.booths.address.split(',')[0]}` : 'Unknown Booth',
        booth_address: session.booths?.address || 'Unknown Address',
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.total_minutes,
        cost: session.total_cost,
        status: session.status
      }))

      return sessionHistory
    } catch (error) {
      console.error('Error in getUserSessionHistory:', error)
      return this.getMockSessionHistory()
    }
  }

  // Create or update user profile
  async createOrUpdateUserProfile(clerkUser: any): Promise<UserProfile | null> {
    try {
      if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
        return null
      }

      const userData = {
        clerk_user_id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        phone_number: clerkUser.phoneNumbers?.[0]?.phoneNumber,
        preferences: {},
        updated_at: new Date().toISOString()
      }

      // Try to update existing user first
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUser.id)
        .single()

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update(userData)
          .eq('clerk_user_id', clerkUser.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating user profile:', error)
          return null
        }

        return data
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert([{
            ...userData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) {
          console.error('Error creating user profile:', error)
          return null
        }

        return data
      }
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error)
      return null
    }
  }

  // Mock data for development
  private getMockUserProfile(clerkUserId: string): UserProfile {
    return {
      id: 'mock-user-id',
      clerk_user_id: clerkUserId,
      email: 'alex@example.com',
      first_name: 'Alexandre',
      last_name: 'Zagame',
      phone_number: '+46 70 123 4567',
      preferences: {},
      created_at: '2024-10-01T00:00:00Z',
      updated_at: '2024-10-01T00:00:00Z'
    }
  }

  private getMockUserStats(): UserStats {
    return {
      total_sessions: 12,
      total_time_minutes: 555, // 9h 15m
      total_spent: 270.00,
      member_since: 'October 2024'
    }
  }

  private getMockSessionHistory(): SessionHistory[] {
    return [
      {
        id: 'session-1',
        booth_name: '7-Eleven Stockholm Central',
        booth_address: 'Storgatan 1, Stockholm',
        start_time: '2024-10-15T14:30:00Z',
        end_time: '2024-10-15T15:15:00Z',
        duration_minutes: 45,
        cost: 22.50,
        status: 'completed'
      },
      {
        id: 'session-2',
        booth_name: '7-Eleven Gamla Stan',
        booth_address: 'Västerlånggatan 1, Stockholm',
        start_time: '2024-10-14T10:15:00Z',
        end_time: '2024-10-14T11:00:00Z',
        duration_minutes: 45,
        cost: 22.50,
        status: 'completed'
      }
    ]
  }
}

export const userService = new UserService()
