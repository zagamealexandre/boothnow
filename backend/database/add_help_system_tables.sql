-- Add help system tables
-- This migration adds tables for FAQ, feedback, and support tickets

-- FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  contact_email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket messages table
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_items_active ON faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);

-- Insert sample FAQ items
INSERT INTO faq_items (question, answer, category, order_index) VALUES
('How do I book a booth?', 'To book a booth, open the app, find a booth on the map, tap on it, and select your desired time slot. You can book up to 2 hours in advance.', 'booking', 1),
('What happens if I''m late for my booking?', 'If you''re more than 15 minutes late, your booking will be automatically cancelled and the booth will become available to other users. You won''t be charged for cancelled bookings.', 'booking', 2),
('Can I extend my session?', 'Yes, you can extend your session if the booth is available. Tap the "Extend Session" button in the app. Additional time will be charged at the standard rate.', 'sessions', 3),
('How do I cancel a booking?', 'You can cancel your booking up to 30 minutes before the start time. Go to "My Bookings" in the app and tap "Cancel". You''ll receive a full refund.', 'booking', 4),
('What payment methods do you accept?', 'We accept all major credit cards, debit cards, and digital wallets like Apple Pay and Google Pay. All payments are processed securely.', 'payment', 5),
('Is there a mobile app?', 'Yes, BoothNow is available as a web app that works on all devices. You can also add it to your home screen for easy access.', 'app', 6),
('What if the booth is not working?', 'If you encounter any issues with the booth, please report it immediately through the app or contact our support team. We''ll help you find an alternative booth.', 'support', 7),
('Do you offer refunds?', 'We offer full refunds for cancelled bookings and technical issues. Refunds are processed within 3-5 business days to your original payment method.', 'payment', 8),
('How much does it cost?', 'Our pricing varies by location and plan. Pay-as-you-go starts at 3 kr/minute with a 10 kr unlock fee. Monthly plans start at 39 kr/month for unlimited unlocks.', 'pricing', 9),
('Can I use the booth for video calls?', 'Yes, all our booths are soundproof and equipped with WiFi, making them perfect for video calls, meetings, and focused work.', 'features', 10);

-- Enable RLS (Row Level Security)
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- FAQ items are public (read-only)
CREATE POLICY "FAQ items are viewable by everyone" ON faq_items
  FOR SELECT USING (true);

-- Feedback policies
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own support tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own support tickets" ON support_tickets
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Support ticket messages policies
CREATE POLICY "Users can view messages for their tickets" ON support_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages for their tickets" ON support_ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_ticket_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()::text
    )
  );

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
