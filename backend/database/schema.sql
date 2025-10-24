-- BoothNow Database Schema
-- PostgreSQL schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (synced with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booths table
CREATE TABLE booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner TEXT NOT NULL, -- '7-Eleven', 'Circle K', etc.
  place_id TEXT UNIQUE, -- Google Places ID
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  availability BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_minutes INTEGER,
  total_cost DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  type TEXT NOT NULL CHECK (type IN ('per_minute', 'subscription')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_booths_location ON booths USING GIST (ST_Point(lng, lat));
CREATE INDEX idx_booths_availability ON booths(availability);
CREATE INDEX idx_booths_partner ON booths(partner);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_booth ON reservations(booth_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_booth ON sessions(booth_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Booths are publicly readable
CREATE POLICY "Booths are publicly readable" ON booths
  FOR SELECT USING (true);

-- Reservations are user-specific
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own reservations" ON reservations
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Sessions are user-specific
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Payments are user-specific
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Analytics events are user-specific
CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can create own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booths_updated_at BEFORE UPDATE ON booths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO booths (partner, place_id, lat, lng, address, availability) VALUES
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI', 59.3293, 18.0686, 'Storgatan 1, Stockholm', true),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI', 59.3345, 18.0632, 'Drottninggatan 15, Stockholm', true),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI', 59.3318, 18.0712, 'Kungsgatan 8, Stockholm', false);
