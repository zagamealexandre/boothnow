-- Complete BoothNow Database Schema for Supabase
-- This replaces the Prisma schema with a unified Supabase approach

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends existing Clerk integration)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booths table
CREATE TABLE IF NOT EXISTS booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  partner TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  availability BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_minutes INTEGER,
  cost DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  session_id UUID UNIQUE REFERENCES sessions(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  creem_checkout_id TEXT, -- Link to Creem checkout
  creem_payment_id TEXT,  -- Link to Creem payment
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creem_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_booths_location ON booths(lat, lng);
CREATE INDEX IF NOT EXISTS idx_booths_availability ON booths(availability);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booth_id ON sessions(booth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_booth_id ON reservations(booth_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_id ON subscriptions(creem_subscription_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Reservations policies
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own analytics" ON analytics_events
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Booths are publicly readable
CREATE POLICY "Booths are publicly readable" ON booths
  FOR SELECT USING (true);

-- Insert sample data
INSERT INTO booths (name, partner, address, lat, lng, availability) VALUES
  ('7-Eleven Stockholm Central', '7-Eleven', 'Storgatan 1, Stockholm, Sweden', 59.3293, 18.0686, true),
  ('7-Eleven Oslo Downtown', '7-Eleven', 'Karl Johans gate 1, Oslo, Norway', 59.9139, 10.7522, true),
  ('7-Eleven Copenhagen Central', '7-Eleven', 'Strøget 1, Copenhagen, Denmark', 55.6761, 12.5683, false)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
