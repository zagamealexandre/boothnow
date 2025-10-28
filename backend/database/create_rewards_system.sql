-- Create Rewards System Database Schema
-- This script creates all necessary tables and functions for the rewards system

-- 1. User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rewards Catalog Table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  partner TEXT NOT NULL,
  cost INTEGER NOT NULL,
  image_url TEXT,
  icon_name TEXT,
  icon_color TEXT,
  icon_bg_color TEXT,
  badge TEXT,
  time_restriction JSONB, -- Store time-based restrictions as JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Rewards Table (claimed rewards)
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id INTEGER NOT NULL REFERENCES rewards_catalog(id),
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Points Transactions Table (for tracking point changes)
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'refund')),
  source TEXT NOT NULL, -- 'booth_session', 'booking', 'reward_claim', 'reward_use', etc.
  source_id UUID, -- Reference to the source (session_id, booking_id, etc.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Reward Usage History Table
CREATE TABLE IF NOT EXISTS reward_usage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_reward_id UUID NOT NULL REFERENCES user_rewards(id) ON DELETE CASCADE,
  reward_id INTEGER NOT NULL REFERENCES rewards_catalog(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  qr_code TEXT, -- Store the generated QR code for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_usage_user_id ON reward_usage_history(user_id);

-- Insert default rewards catalog
INSERT INTO rewards_catalog (title, description, partner, cost, icon_name, icon_color, icon_bg_color, badge, time_restriction) VALUES
('15% off any coffee', 'Valid for purchases between 7 AM and 9 AM at participating stores.', '7-Eleven', 120, 'Coffee', 'bg-amber-100', 'text-amber-600', '7–9 AM', '{"start_hour": 7, "end_hour": 9}'),
('Free croissant with any coffee', 'Available all day, one per transaction.', '7-Eleven', 150, 'Croissant', 'bg-orange-100', 'text-orange-600', null, null),
('10% off lunch combo', 'Save on sandwiches and wraps between 11 AM – 2 PM.', '7-Eleven', 180, 'Sandwich', 'bg-green-100', 'text-green-600', 'Lunch', '{"start_hour": 11, "end_hour": 14}'),
('Free iced coffee after 3 PM', 'Cool off after your booth session. One per day.', '7-Eleven', 250, 'CupSoda', 'bg-blue-100', 'text-blue-600', 'After 3 PM', '{"start_hour": 15, "end_hour": 23}'),
('Buy 1 get 1 free snack', 'Valid on selected snack items.', '7-Eleven', 200, 'Candy', 'bg-purple-100', 'text-purple-600', null, null),
('20 free minutes', 'Earned automatically after 3 days in a row.', 'BoothNow', 0, 'Timer', 'bg-indigo-100', 'text-indigo-600', 'Bonus', null),
('Free breakfast sandwich', 'Valid between 6 AM and 10 AM. One per day.', '7-Eleven', 300, 'Sandwich', 'bg-yellow-100', 'text-yellow-600', '6–10 AM', '{"start_hour": 6, "end_hour": 10}'),
('50% off energy drinks', 'Valid between 2 PM and 6 PM. Perfect for afternoon boost.', '7-Eleven', 180, 'CupSoda', 'bg-red-100', 'text-red-600', '2–6 PM', '{"start_hour": 14, "end_hour": 18}'),
('Free hot chocolate', 'Valid between 6 PM and 10 PM. Perfect for evening sessions.', '7-Eleven', 220, 'Coffee', 'bg-brown-100', 'text-brown-600', '6–10 PM', '{"start_hour": 18, "end_hour": 22}')
ON CONFLICT DO NOTHING;

-- Function to initialize user points
CREATE OR REPLACE FUNCTION initialize_user_points(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, total_points, available_points, lifetime_earned)
  VALUES (user_uuid, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to add points to user
CREATE OR REPLACE FUNCTION add_user_points(
  user_uuid UUID,
  points_amount INTEGER,
  transaction_type TEXT,
  source TEXT,
  source_id UUID DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_points INTEGER;
BEGIN
  -- Initialize user points if they don't exist
  PERFORM initialize_user_points(user_uuid);
  
  -- Get current available points
  SELECT available_points INTO current_points
  FROM user_points
  WHERE user_id = user_uuid;
  
  -- Add transaction record
  INSERT INTO points_transactions (user_id, amount, transaction_type, source, source_id, description)
  VALUES (user_uuid, points_amount, transaction_type, source, source_id, description);
  
  -- Update user points
  UPDATE user_points
  SET 
    available_points = available_points + points_amount,
    total_points = total_points + points_amount,
    lifetime_earned = lifetime_earned + GREATEST(0, points_amount),
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to spend points (for claiming rewards)
CREATE OR REPLACE FUNCTION spend_user_points(
  user_uuid UUID,
  points_amount INTEGER,
  source TEXT,
  source_id UUID DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_points INTEGER;
BEGIN
  -- Get current available points
  SELECT available_points INTO current_points
  FROM user_points
  WHERE user_id = user_uuid;
  
  -- Check if user has enough points
  IF current_points < points_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Add transaction record (negative amount for spending)
  INSERT INTO points_transactions (user_id, amount, transaction_type, source, source_id, description)
  VALUES (user_uuid, -points_amount, 'spent', source, source_id, description);
  
  -- Update user points
  UPDATE user_points
  SET 
    available_points = available_points - points_amount,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if reward is time-restricted and active
CREATE OR REPLACE FUNCTION is_reward_time_active(restriction JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  current_hour INTEGER;
  start_hour INTEGER;
  end_hour INTEGER;
BEGIN
  -- If no time restriction, always active
  IF restriction IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Get current hour
  current_hour := EXTRACT(HOUR FROM NOW());
  
  -- Get restriction hours
  start_hour := (restriction->>'start_hour')::INTEGER;
  end_hour := (restriction->>'end_hour')::INTEGER;
  
  -- Check if current hour is within the restriction
  RETURN current_hour >= start_hour AND current_hour < end_hour;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_usage_history ENABLE ROW LEVEL SECURITY;

-- User points policies
CREATE POLICY "Users can view their own points" ON user_points
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own points" ON user_points
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- User rewards policies
CREATE POLICY "Users can view their own rewards" ON user_rewards
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own rewards" ON user_rewards
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Points transactions policies
CREATE POLICY "Users can view their own transactions" ON points_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own transactions" ON points_transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Reward usage history policies
CREATE POLICY "Users can view their own usage history" ON reward_usage_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own usage history" ON reward_usage_history
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Grant permissions
GRANT ALL ON user_points TO authenticated;
GRANT ALL ON user_rewards TO authenticated;
GRANT ALL ON points_transactions TO authenticated;
GRANT ALL ON reward_usage_history TO authenticated;
GRANT SELECT ON rewards_catalog TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
