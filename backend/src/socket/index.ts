import { Server } from 'socket.io';
import { supabase } from '../services';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join booth room for real-time updates
    socket.on('join_booth_room', (boothId: string) => {
      socket.join(`booth_${boothId}`);
      console.log(`User joined booth room: ${boothId}`);
    });

    // Handle session timer updates
    socket.on('session_timer_update', async (data: { sessionId: string, userId: string }) => {
      try {
        const { sessionId, userId } = data;

        // Get session details
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', userId)
          .single();

        if (session && session.status === 'active') {
          const startTime = new Date(session.start_time);
          const now = new Date();
          const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

          // Emit timer update to user
          io.to(`user_${userId}`).emit('timer_update', {
            sessionId,
            elapsedMinutes,
            status: session.status
          });
        }
      } catch (error) {
        console.error('Session timer update error:', error);
      }
    });

    // Handle booth availability updates
    socket.on('booth_availability_check', async (boothId: string) => {
      try {
        const { data: booth } = await supabase
          .from('booths')
          .select('*')
          .eq('id', boothId)
          .single();

        if (booth) {
          // Emit availability update to all users in booth room
          io.to(`booth_${boothId}`).emit('booth_availability_update', {
            boothId,
            availability: booth.availability,
            lastSync: booth.last_sync
          });
        }
      } catch (error) {
        console.error('Booth availability check error:', error);
      }
    });

    // Handle session end notifications
    socket.on('session_end', async (data: { sessionId: string, userId: string }) => {
      try {
        const { sessionId, userId } = data;

        // Update session in database
        const { data: session } = await supabase
          .from('sessions')
          .update({
            end_time: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', sessionId)
          .eq('user_id', userId)
          .select()
          .single();

        if (session) {
          // Update booth availability
          await supabase
            .from('booths')
            .update({ availability: true })
            .eq('id', session.booth_id);

          // Notify user
          io.to(`user_${userId}`).emit('session_ended', {
            sessionId,
            message: 'Session ended successfully'
          });

          // Notify booth room
          io.to(`booth_${session.booth_id}`).emit('booth_available', {
            boothId: session.booth_id,
            availability: true
          });
        }
      } catch (error) {
        console.error('Session end error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Set up real-time database subscriptions
  const setupRealtimeSubscriptions = () => {
    // Subscribe to booth availability changes
    supabase
      .channel('booth_availability_changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'booths',
          filter: 'availability=eq.true'
        }, 
        (payload) => {
          console.log('Booth became available:', payload);
          io.emit('booth_available', {
            boothId: payload.new.id,
            availability: payload.new.availability,
            partner: payload.new.partner,
            address: payload.new.address
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'booths',
          filter: 'availability=eq.false'
        }, 
        (payload) => {
          console.log('Booth became unavailable:', payload);
          io.emit('booth_unavailable', {
            boothId: payload.new.id,
            availability: payload.new.availability
          });
        }
      )
      .subscribe();

    // Subscribe to session changes
    supabase
      .channel('session_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'sessions'
        }, 
        (payload) => {
          console.log('New session started:', payload);
          io.emit('new_session', {
            sessionId: payload.new.id,
            userId: payload.new.user_id,
            boothId: payload.new.booth_id
          });
        }
      )
      .subscribe();
  };

  setupRealtimeSubscriptions();
};
