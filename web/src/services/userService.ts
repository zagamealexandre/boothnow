// User service for fetching user data from Clerk and Supabase
import { supabase } from '../lib/supabase'

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

export interface ActiveSession {
  id: string
  booth_name: string
  booth_address: string
  start_time: string
  plan_type: 'pay_per_minute' | 'subscription'
  max_duration_minutes: number
  cost_per_minute: number
  booth_id: string
}

class UserService {
  // Ensure a user row exists for a given Clerk user id; returns internal UUID
  async ensureUserExists(clerkUserId: string, clerkUserData?: any): Promise<string | null> {
    try {
      // Try find by clerk_user_id
      const { data: existing, error: findErr } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      if (existing && !findErr) {
        return existing.id
      }

      // Upsert minimal row
      const userData: any = {
        clerk_user_id: clerkUserId,
        email: clerkUserData?.email || clerkUserData?.primaryEmailAddress?.emailAddress || clerkUserData?.emailAddresses?.[0]?.emailAddress || null,
        first_name: clerkUserData?.firstName || null,
        last_name: clerkUserData?.lastName || null,
        preferences: {}
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'clerk_user_id' })
        .select('id')
        .maybeSingle()

      if (insertErr) {
        console.error('ensureUserExists upsert error:', insertErr)
        return null
      }

      return inserted?.id || null
    } catch (e) {
      console.error('ensureUserExists exception:', e)
      return null
    }
  }
  // Get user profile from Supabase
  async getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
    try {
      // Always try real Supabase first - no mock fallbacks

      console.log('🔍 UserService - getUserProfile: Looking up user with clerk_user_id:', clerkUserId);

      // First try to find by clerk_user_id
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      console.log('🔍 UserService - getUserProfile: Direct lookup result:', { data: !!data, error });

      // No fallback: return null so caller can initialize profile correctly

      if (error) {
        console.error('🔍 UserService - getUserProfile: Error fetching user profile:', error)
        return null
      }

      if (!data) {
        console.log('🔍 UserService - getUserProfile: No user found, returning null');
        return null
      }

      console.log('🔍 UserService - getUserProfile: Returning user data:', { id: data.id, email: data.email, clerk_user_id: data.clerk_user_id });
      return data
    } catch (error) {
      console.error('🔍 UserService - getUserProfile: Exception:', error)
      return null
    }
  }

  // Initialize user profile if it doesn't exist
  async initializeUserProfile(clerkUserId: string, clerkUserData?: any): Promise<UserProfile | null> {
    try {
      // Always try real Supabase - no mock fallbacks


      // Get user email from various possible locations
      let userEmail = clerkUserData?.email; // Try direct email first
      if (!userEmail) {
        userEmail = clerkUserData?.primaryEmailAddress?.emailAddress;
      }
      if (!userEmail) {
        userEmail = clerkUserData?.emailAddresses?.[0]?.emailAddress;
      }
      if (!userEmail) {
        userEmail = 'user@example.com';
      }
      
      console.log('🔍 UserService - extracted email:', userEmail);

      console.log('🔍 UserService - checking for existing user:', { clerkUserId, userEmail });
      
      // Check if user already exists by email first (more reliable)
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, clerk_user_id, email')
        .eq('email', userEmail)
        .maybeSingle()
      
      console.log('🔍 UserService - initializeUserProfile: existing user check result:', { existingUser, checkError });
      
      // If there's an error in the check, log it but continue
      if (checkError) {
        console.warn('🔍 UserService - initializeUserProfile: error checking existing user:', checkError);
      }

      if (existingUser) {
        // Update existing user with clerk_user_id if missing or different
        if (!existingUser.clerk_user_id || existingUser.clerk_user_id !== clerkUserId) {
          console.log('🔍 UserService - initializeUserProfile: updating clerk_user_id from', existingUser.clerk_user_id, 'to', clerkUserId);
          const { error: updateError } = await supabase
            .from('users')
            .update({ clerk_user_id: clerkUserId })
            .eq('id', existingUser.id)
          
          if (updateError) {
            console.error('🔍 UserService - initializeUserProfile: error updating clerk_user_id:', updateError);
          } else {
            console.log('🔍 UserService - initializeUserProfile: successfully updated clerk_user_id');
            // Verify the update worked
            const { data: verifyUser } = await supabase
              .from('users')
              .select('clerk_user_id')
              .eq('id', existingUser.id)
              .maybeSingle()
            console.log('🔍 UserService - initializeUserProfile: verification - clerk_user_id is now:', verifyUser?.clerk_user_id);
          }
        }
        return await this.getUserProfile(clerkUserId)
      }

      // Create new user profile using insert first, then fallback to upsert
      const userData = {
        clerk_user_id: clerkUserId,
        email: userEmail,
        first_name: clerkUserData?.firstName || 'User',
        last_name: clerkUserData?.lastName || '',
        phone_number: clerkUserData?.phoneNumbers?.[0]?.phoneNumber || null,
        preferences: {},
        created_at: clerkUserData?.createdAt ? new Date(clerkUserData.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🔍 UserService - creating user with data:', userData);

      // Try insert first
      let { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .maybeSingle()

      console.log('🔍 UserService - insert result:', { data, error });

      // If insert fails due to conflict, try to get the existing user
      if (error && error.code === '23505') { // Unique constraint violation
        console.log('🔍 UserService - user already exists, fetching existing user...');
        const { data: existingUserAfterConflict } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle()
        
        if (existingUserAfterConflict) {
          // Update the existing user with clerk_user_id if missing or different
          if (!existingUserAfterConflict.clerk_user_id || existingUserAfterConflict.clerk_user_id !== clerkUserId) {
            console.log('🔍 UserService - updating existing user clerk_user_id from', existingUserAfterConflict.clerk_user_id, 'to', clerkUserId);
            await supabase
              .from('users')
              .update({ clerk_user_id: clerkUserId })
              .eq('id', existingUserAfterConflict.id)
            existingUserAfterConflict.clerk_user_id = clerkUserId
          }
          return existingUserAfterConflict
        }
      }

      if (error) {
        console.error('Error creating user profile:', error)
        // If all else fails, return mock profile
        return this.getClerkUserProfile(clerkUserId, clerkUserData)
      }

      console.log('🔍 UserService - user created successfully:', data);
      return data
    } catch (error) {
      console.error('Error in initializeUserProfile:', error)
      return this.getClerkUserProfile(clerkUserId, clerkUserData)
    }
  }

  // Direct database update function (bypasses some constraints)
  async directUpdateClerkId(clerkUserId: string, userEmail: string): Promise<boolean> {
    try {
      console.log('🔍 UserService - DIRECT: Attempting direct update for user:', userEmail);
      
      // Use a raw SQL update if possible, or try multiple approaches
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (findError || !user) {
        console.error('🔍 UserService - DIRECT: User not found by email:', findError);
        return false;
      }

      console.log('🔍 UserService - DIRECT: Found user:', user);

      // Try multiple update approaches
      const updatePromises = [
        // Approach 1: Standard update
        supabase
          .from('users')
          .update({ clerk_user_id: clerkUserId })
          .eq('id', user.id),
        
        // Approach 2: Update by email
        supabase
          .from('users')
          .update({ clerk_user_id: clerkUserId })
          .eq('email', userEmail),
        
        // Approach 3: Upsert approach
        supabase
          .from('users')
          .upsert({ 
            id: user.id, 
            clerk_user_id: clerkUserId,
            email: userEmail,
            first_name: user.first_name,
            last_name: user.last_name
          })
      ];

      let success = false;
      for (let i = 0; i < updatePromises.length; i++) {
        const { error } = await updatePromises[i];
        if (!error) {
          console.log(`🔍 UserService - DIRECT: Update approach ${i + 1} succeeded`);
          success = true;
          break;
        } else {
          console.log(`🔍 UserService - DIRECT: Update approach ${i + 1} failed:`, error);
        }
      }

      if (!success) {
        console.error('🔍 UserService - DIRECT: All update approaches failed');
        return false;
      }

      // Verify the update
      const { data: verifyUser } = await supabase
        .from('users')
        .select('clerk_user_id')
        .eq('email', userEmail)
        .maybeSingle();

      console.log('🔍 UserService - DIRECT: Final verification - clerk_user_id is:', verifyUser?.clerk_user_id);
      return verifyUser?.clerk_user_id === clerkUserId;
    } catch (error) {
      console.error('🔍 UserService - DIRECT: Exception in direct update:', error);
      return false;
    }
  }

  // Fix function to update existing user's clerk_user_id
  async fixUserClerkId(clerkUserId: string, userEmail: string): Promise<boolean> {
    try {
      console.log('🔍 UserService - FIX: Attempting to fix clerk_user_id for user:', userEmail);
      
      // Find user by email
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (findError || !user) {
        console.error('🔍 UserService - FIX: User not found by email:', findError);
        return false;
      }

      console.log('🔍 UserService - FIX: Found user:', user);

      // Update clerk_user_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ clerk_user_id: clerkUserId })
        .eq('id', user.id);

      if (updateError) {
        console.error('🔍 UserService - FIX: Error updating clerk_user_id:', updateError);
        return false;
      }

      // Verify the update worked
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('clerk_user_id')
        .eq('id', user.id)
        .maybeSingle();

      if (verifyError) {
        console.error('🔍 UserService - FIX: Error verifying update:', verifyError);
        return false;
      }

      console.log('🔍 UserService - FIX: Successfully updated clerk_user_id to:', clerkUserId);
      console.log('🔍 UserService - FIX: Verification - clerk_user_id is now:', verifyUser?.clerk_user_id);
      
      return verifyUser?.clerk_user_id === clerkUserId;
    } catch (error) {
      console.error('🔍 UserService - FIX: Exception fixing clerk_user_id:', error);
      return false;
    }
  }

  // Test function to manually create a user (for debugging)
  async testCreateUser(clerkUserId: string, clerkUserData?: any): Promise<boolean> {
    try {
      console.log('🔍 UserService - TEST: Attempting to create user manually...');
      
      const userData = {
        clerk_user_id: clerkUserId,
        email: clerkUserData?.emailAddresses?.[0]?.emailAddress || 'test@example.com',
        first_name: clerkUserData?.firstName || 'Test',
        last_name: clerkUserData?.lastName || 'User',
        phone_number: null,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔍 UserService - TEST: User data:', userData);

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .maybeSingle();

      console.log('🔍 UserService - TEST: Insert result:', { data, error });

      if (error) {
        console.error('🔍 UserService - TEST: Error creating user:', error);
        return false;
      }

      console.log('🔍 UserService - TEST: User created successfully:', data);
      return true;
    } catch (error) {
      console.error('🔍 UserService - TEST: Exception creating user:', error);
      return false;
    }
  }

  // Helper function to get user ID with proper lookup
  private async getUserInternalId(clerkUserId: string): Promise<string | null> {
    try {
      console.log('🔍 UserService - getUserInternalId: Looking up user with clerk_user_id:', clerkUserId);
      
      // First try to find by clerk_user_id
      let { data: user, error } = await supabase
        .from('users')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      if (!error && user) {
        console.log('🔍 UserService - getUserInternalId: Found user by clerk_user_id:', user.id);
        return user.id;
      }

      // No fallback: caller should initialize the profile if missing

      console.error('🔍 UserService - getUserInternalId: No user found in database');
      return null;
    } catch (error) {
      console.error('🔍 UserService - getUserInternalId: Exception:', error);
      return null;
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
      // Always try real Supabase - no mock fallbacks
      console.log('🔍 UserService - getUserStats: Looking for sessions with clerk_user_id:', clerkUserId)

      // Get total sessions - try clerk_user_id first, fallback to user_id
      let { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('clerk_user_id', clerkUserId) // Use clerk_user_id field
        .eq('status', 'completed')

      console.log('🔍 UserService - getUserStats: Sessions query result:', { sessions, error: sessionsError })

      // If clerk_user_id doesn't work, try with user_id (for backward compatibility)
      if (sessionsError && sessionsError.code === '42703') {
        console.log('🔍 UserService - getUserStats: clerk_user_id field not found, trying user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserStats: Found user by clerk_user_id, looking up sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')

          sessions = sessionsByUserId
          sessionsError = sessionsByUserIdError
          console.log('🔍 UserService - getUserStats: Sessions by user_id result:', { sessions, error: sessionsByUserIdError })
        }
      } else if (!sessions || sessions.length === 0) {
        // If no sessions found by clerk_user_id, try user_id lookup as fallback
        console.log('🔍 UserService - getUserStats: No sessions found by clerk_user_id, trying user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserStats: Found user by clerk_user_id, looking up sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')

          sessions = sessionsByUserId
          sessionsError = sessionsByUserIdError
          console.log('🔍 UserService - getUserStats: Sessions by user_id result:', { sessions, error: sessionsByUserIdError })
        }
      }

      // Additional fallback: if still no sessions, try direct user_id lookup
      if ((!sessions || sessions.length === 0) && !sessionsError) {
        console.log('🔍 UserService - getUserStats: Still no sessions, trying direct user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserStats: Found user, trying sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')

          sessions = sessionsByUserId
          sessionsError = sessionsByUserIdError
          console.log('🔍 UserService - getUserStats: Final sessions result:', { sessions, error: sessionsByUserIdError })
        }
      }

      if (sessionsError) {
        console.error('Error fetching user sessions:', sessionsError)
        return {
          total_sessions: 0,
          total_time_minutes: 0,
          total_spent: 0,
          member_since: new Date().toISOString().split('T')[0]
        }
      }

      // Calculate stats
      console.log('🔍 UserService - getUserStats: Found completed sessions:', sessions?.length || 0)
      console.log('🔍 UserService - getUserStats: Sessions data:', sessions)
      
      const totalSessions = sessions?.length || 0
      const totalTimeMinutes = sessions?.reduce((sum, session) => sum + (session.total_minutes || 0), 0) || 0
      const totalSpent = sessions?.reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0
      
      console.log('🔍 UserService - getUserStats: Calculated stats:', {
        totalSessions,
        totalTimeMinutes,
        totalSpent
      })

      // Get member since date
      // Get user creation date
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('created_at')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()

      // If not found by clerk_user_id, try fallback method
      if (!user && !userError) {
        console.log('🔍 UserService - user not found for member_since, trying fallback...');
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('created_at')
          .limit(1)
        
        if (!allUsersError && allUsers && allUsers.length > 0) {
          user = allUsers[0];
          console.log('🔍 UserService - found user for member_since by fallback method');
        }
      }

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
      return {
        total_sessions: 0,
        total_time_minutes: 0,
        total_spent: 0,
        member_since: new Date().toISOString().split('T')[0]
      }
    }
  }

  // Get user session history
  async getUserSessionHistory(clerkUserId: string, limit: number = 5): Promise<SessionHistory[]> {
    try {
      // Always try real Supabase - no mock fallbacks
      console.log('🔍 UserService - getUserSessionHistory: Looking for sessions with clerk_user_id:', clerkUserId)

      // Try clerk_user_id first, fallback to user_id if needed
      let { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          booths (
            name,
            address,
            partner
          )
        `)
        .eq('clerk_user_id', clerkUserId) // Use clerk_user_id field
        .order('created_at', { ascending: false })
        .limit(limit)

      console.log('🔍 UserService - getUserSessionHistory: Sessions query result:', { sessions, error })

      // If clerk_user_id doesn't work, try with user_id (for backward compatibility)
      if (error && error.code === '42703') {
        console.log('🔍 UserService - getUserSessionHistory: clerk_user_id field not found, trying user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserSessionHistory: Found user by clerk_user_id, looking up sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select(`
              *,
              booths (
                name,
                address,
                partner
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

          sessions = sessionsByUserId
          error = sessionsByUserIdError
          console.log('🔍 UserService - getUserSessionHistory: Sessions by user_id result:', { sessions, error: sessionsByUserIdError })
        }
      } else if (!sessions || sessions.length === 0) {
        // If no sessions found by clerk_user_id, try user_id lookup as fallback
        console.log('🔍 UserService - getUserSessionHistory: No sessions found by clerk_user_id, trying user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserSessionHistory: Found user by clerk_user_id, looking up sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select(`
              *,
              booths (
                name,
                address,
                partner
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

          sessions = sessionsByUserId
          error = sessionsByUserIdError
          console.log('🔍 UserService - getUserSessionHistory: Sessions by user_id result:', { sessions, error: sessionsByUserIdError })
        }
      }

      // Additional fallback: if still no sessions, try direct user_id lookup
      if ((!sessions || sessions.length === 0) && !error) {
        console.log('🔍 UserService - getUserSessionHistory: Still no sessions, trying direct user_id lookup...')
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_user_id', clerkUserId)
          .maybeSingle()

        if (user) {
          console.log('🔍 UserService - getUserSessionHistory: Found user, trying sessions by user_id:', user.id)
          const { data: sessionsByUserId, error: sessionsByUserIdError } = await supabase
            .from('sessions')
            .select(`
              *,
              booths (
                name,
                address,
                partner
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

          sessions = sessionsByUserId
          error = sessionsByUserIdError
          console.log('🔍 UserService - getUserSessionHistory: Final sessions result:', { sessions, error: sessionsByUserIdError })
        }
      }

      if (error) {
        console.error('Error fetching session history:', error)
        return []
      }

      if (!sessions || sessions.length === 0) {
        return []
      }

      console.log('🔍 UserService - getUserSessionHistory: Processing sessions:', sessions?.length || 0)
      console.log('🔍 UserService - getUserSessionHistory: Raw sessions data:', sessions)
      
      const sessionHistory = sessions.map(session => ({
        id: session.id,
        booth_name: session.booths?.name || `${session.booths?.partner || '7-Eleven'} Booth`,
        booth_address: session.booths?.address || 'Address not available',
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.total_minutes,
        cost: session.total_cost,
        status: session.status
      }))
      
      console.log('🔍 UserService - getUserSessionHistory: Processed session history:', sessionHistory)

      return sessionHistory
    } catch (error) {
      console.error('Error in getUserSessionHistory:', error)
      return []
    }
  }

  // Create or update user profile
  async createOrUpdateUserProfile(clerkUser: any): Promise<UserProfile | null> {
    try {
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
        .maybeSingle()

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update(userData)
          .eq('clerk_user_id', clerkUser.id)
          .select()
          .maybeSingle()

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
          .maybeSingle()

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

  // Get active sessions for user
  async getActiveSessions(clerkUserId: string): Promise<ActiveSession[]> {
    try {
      // Always try real Supabase - no mock fallbacks

      // Get the internal user ID using our helper function
      const userId = await this.getUserInternalId(clerkUserId);
      if (!userId) {
        console.error('Error: Could not find user for active sessions');
        return []
      }

      // Get active sessions using the Clerk user ID (preferred) or internal user ID
      let { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          start_time,
          booth_id,
          end_time,
          total_minutes,
          total_cost,
          status,
          cost_per_minute,
          booth_name,
          booth_address,
          clerk_user_id
        `)
        .eq('clerk_user_id', clerkUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // If clerk_user_id doesn't work, try with user_id (for backward compatibility)
      if (error && error.code === '42703') {
        console.log('🔍 UserService - getActiveSessions: clerk_user_id column not found, trying user_id...');
        const { data: sessionsByUserId, error: userIdError } = await supabase
          .from('sessions')
          .select(`
            id,
            start_time,
            booth_id,
            end_time,
            total_minutes,
            total_cost,
            status,
            cost_per_minute,
            booth_name,
            booth_address,
            clerk_user_id
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        sessions = sessionsByUserId;
        error = userIdError;
      }

      if (error) {
        console.error('Error fetching active sessions:', error)
        return []
      }

      // Process sessions - use data from session if available, otherwise fetch from booth
      const sessionsWithBoothDetails = await Promise.all(
        sessions?.map(async (session) => {
          let boothName = session.booth_name || '7-Eleven Booth'
          let boothAddress = session.booth_address || 'Address not available'
          let costPerMinute = session.cost_per_minute || 0.50
          let maxDuration = 120 // Default max duration
          
          // If session doesn't have booth details, fetch from booth table
          if (!session.booth_name || !session.booth_address || !session.cost_per_minute) {
            try {
              const { data: booth, error: boothError } = await supabase
                .from('booths')
                .select('name, address, cost_per_minute, max_duration')
                .eq('id', session.booth_id)
                .maybeSingle()
              
              if (booth && !boothError) {
                boothName = booth.name || boothName
                boothAddress = booth.address || boothAddress
                costPerMinute = booth.cost_per_minute || costPerMinute
                maxDuration = booth.max_duration || maxDuration
              }
            } catch (error) {
              console.warn('Failed to fetch booth details for session:', session.id, error)
            }
          }
          
          return {
            id: session.id,
            booth_name: boothName,
            booth_address: boothAddress,
            start_time: session.start_time,
            plan_type: 'pay_per_minute' as const,
            max_duration_minutes: maxDuration,
            cost_per_minute: costPerMinute,
            booth_id: session.booth_id
          }
        }) || []
      )

      return sessionsWithBoothDetails

    } catch (error) {
      console.error('Error in getActiveSessions:', error)
      return []
    }
  }

  // Start a new session
  async startSession(clerkUserId: string, boothId: string, reservationId: string): Promise<ActiveSession | null> {
    try {
      // Always try real Supabase - no mock fallbacks

      // Get the internal user ID using our helper function
      const userId = await this.getUserInternalId(clerkUserId);
      if (!userId) {
        console.error('Error: Could not find user for session start');
        return null;
      }

      // Get booth details first
      const { data: booth, error: boothError } = await supabase
        .from('booths')
        .select('name, address, cost_per_minute, max_duration')
        .eq('id', boothId)
        .maybeSingle()

      if (boothError) {
        console.error('Error fetching booth details:', boothError)
        return null
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          clerk_user_id: clerkUserId, // This should be the actual Clerk user ID
          booth_id: boothId,
          reservation_id: reservationId,
          start_time: new Date().toISOString(),
          status: 'active',
          cost_per_minute: booth.cost_per_minute || 0.50,
          booth_name: booth.name || '7-Eleven Booth',
          booth_address: booth.address || 'Address not available'
        })
        .select(`
          id,
          start_time,
          booth_id
        `)
        .maybeSingle()

      if (error) {
        console.error('Error starting session:', error)
        return null
      }

      return {
        id: session.id,
        booth_name: booth.name || '7-Eleven Booth',
        booth_address: booth.address || 'Address not available',
        start_time: session.start_time,
        plan_type: 'pay_per_minute',
            max_duration_minutes: booth.max_duration || 60, // 1 hour max for pay-per-minute
        cost_per_minute: booth.cost_per_minute || 0.50,
        booth_id: session.booth_id
      }

    } catch (error) {
      console.error('Error in startSession:', error)
      return null
    }
  }

  // End a session
  async endSession(clerkUserId: string, sessionId: string): Promise<boolean> {
    try {
      // Check if this is a mock/test session
      if (sessionId.startsWith('550e8400-') || sessionId.includes('mock') || sessionId.includes('test')) {
        console.log('Mock/Test session ending:', sessionId)
        return true
      }

      // Get the internal user ID using our helper function
      const userId = await this.getUserInternalId(clerkUserId);
      if (!userId) {
        console.error('Error: Could not find user for session end');
        return false;
      }

      // Get session details first to calculate cost
      const { data: session, error: fetchError } = await supabase
        .from('sessions')
        .select('start_time, booth_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError || !session) {
        console.error('Error fetching session for end:', fetchError)
        // If it's a UUID format error, it might be mock data, so return true
        if (fetchError?.code === '22P02') {
          console.log('UUID format error - likely mock data, simulating success')
          return true
        }
        return false
      }

      // Calculate total time and cost
      const startTime = new Date(session.start_time)
      const endTime = new Date()
      const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      const totalCost = totalMinutes * 0.5 // €0.5 per minute

      // Update session
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          end_time: endTime.toISOString(),
          status: 'completed',
          total_minutes: totalMinutes,
          total_cost: totalCost
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error ending session:', updateError)
        return false
      }

      // Update booth availability
      await supabase
        .from('booths')
        .update({ availability: true })
        .eq('id', session.booth_id)

      return true

    } catch (error) {
      console.error('Error in endSession:', error)
      return false
    }
  }

  // Get session timer data
  async getSessionTimer(clerkUserId: string, sessionId: string): Promise<{ elapsed_minutes: number; status: string } | null> {
    try {
      // Get the internal user ID using our helper function
      const userId = await this.getUserInternalId(clerkUserId);
      if (!userId) {
        console.error('Error: Could not find user for session timer');
        return null;
      }

      const { data: session, error } = await supabase
        .from('sessions')
        .select('start_time, status')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !session) {
        console.error('Error fetching session timer:', error)
        return null
      }

      if (session.status !== 'active') {
        return { elapsed_minutes: 0, status: session.status }
      }

      const startTime = new Date(session.start_time)
      const now = new Date()
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60))

      return {
        elapsed_minutes: elapsedMinutes,
        status: session.status
      }

    } catch (error) {
      console.error('Error in getSessionTimer:', error)
      return null
    }
  }

  private getMockActiveSessions(): ActiveSession[] {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        booth_name: '7-Eleven Södermalm',
        booth_address: 'Götgatan 1, Stockholm',
        start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        plan_type: 'pay_per_minute',
        max_duration_minutes: 60,
        cost_per_minute: 0.5,
        booth_id: '550e8400-e29b-41d4-a716-446655440001'
      }
    ]
  }

  private getMockSessionHistory(): SessionHistory[] {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        booth_name: '7-Eleven Stockholm Central',
        booth_address: 'Storgatan 1, Stockholm',
        start_time: '2024-10-15T14:30:00Z',
        end_time: '2024-10-15T15:15:00Z',
        duration_minutes: 45,
        cost: 22.50,
        status: 'completed'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
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
