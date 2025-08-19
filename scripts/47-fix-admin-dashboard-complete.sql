-- Fix RLS policies and create missing tables for complete admin dashboard

-- 1. Fix infinite recursion in user_profiles RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read for users based on user_id" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Add missing listing_type column to publications
ALTER TABLE publications ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale';

-- 3. Create missing gamification tables
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id),
    points INTEGER DEFAULT 0,
    rank INTEGER,
    period TEXT, -- 'monthly', 'weekly', 'all_time'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(user_id),
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    properties_sold INTEGER DEFAULT 0,
    properties_captured INTEGER DEFAULT 0,
    commission_earned NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boost_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cost_credits INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL,
    multiplier NUMERIC DEFAULT 1.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    boost_type_id UUID REFERENCES boost_types(id),
    user_id UUID REFERENCES user_profiles(user_id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for properties with boost info
CREATE OR REPLACE VIEW properties_with_boost AS
SELECT 
    p.*,
    pb.boost_type_id,
    bt.name as boost_name,
    bt.multiplier,
    pb.expires_at as boost_expires_at,
    pb.is_active as boost_active
FROM properties p
LEFT JOIN property_boosts pb ON p.id = pb.property_id AND pb.is_active = true AND pb.expires_at > NOW()
LEFT JOIN boost_types bt ON pb.boost_type_id = bt.id;

-- 4. Insert default boost types
INSERT INTO boost_types (name, description, cost_credits, duration_hours, multiplier) VALUES
('Destaque Premium', 'Destaca a propriedade no topo do feed por 24h', 5, 24, 2.0),
('Super Boost', 'Aumenta a visibilidade da propriedade por 72h', 10, 72, 1.8),
('Boost Rápido', 'Destaque por 12h com menor custo', 3, 12, 1.5)
ON CONFLICT DO NOTHING;

-- 5. Create RLS policies for new tables
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_boosts ENABLE ROW LEVEL SECURITY;

-- Leaderboard policies
CREATE POLICY "Enable read access for all users" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User rankings policies
CREATE POLICY "Enable read access for all users" ON user_rankings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON user_rankings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own ranking" ON user_rankings FOR UPDATE USING (auth.uid() = user_id);

-- Boost types policies (public read)
CREATE POLICY "Enable read access for all users" ON boost_types FOR SELECT USING (true);

-- Property boosts policies
CREATE POLICY "Enable read access for all users" ON property_boosts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON property_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard(period, rank);
CREATE INDEX IF NOT EXISTS idx_user_rankings_points ON user_rankings(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_property_boosts_active ON property_boosts(property_id, is_active, expires_at);

-- 7. Update publications to have listing_type
UPDATE publications SET listing_type = 'sale' WHERE listing_type IS NULL;

COMMIT;
