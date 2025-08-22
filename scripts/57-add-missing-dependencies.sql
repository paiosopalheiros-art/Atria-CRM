-- Creating comprehensive script to add all missing Supabase dependencies
-- Add missing columns to existing tables

-- Add monthly_rank column to leaderboard table
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS monthly_rank INTEGER;

-- Add price column to boost_types table
ALTER TABLE boost_types 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- Add details column to activity_logs table (in addition to description)
ALTER TABLE activity_logs 
ADD COLUMN IF NOT EXISTS details JSONB;

-- Create or replace the properties_with_boost view with boost_score
DROP VIEW IF EXISTS properties_with_boost;
CREATE VIEW properties_with_boost AS
SELECT 
    p.*,
    pb.boost_type_id,
    bt.multiplier,
    bt.name as boost_name,
    pb.expires_at as boost_expires_at,
    pb.is_active as boost_active,
    -- Calculate boost_score based on multiplier and time remaining
    CASE 
        WHEN pb.is_active AND pb.expires_at > NOW() 
        THEN bt.multiplier * EXTRACT(EPOCH FROM (pb.expires_at - NOW())) / 3600
        ELSE 0 
    END as boost_score
FROM properties p
LEFT JOIN property_boosts pb ON p.id = pb.property_id AND pb.is_active = true
LEFT JOIN boost_types bt ON pb.boost_type_id = bt.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_monthly_rank ON leaderboard(monthly_rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_rank ON leaderboard(period, rank);
CREATE INDEX IF NOT EXISTS idx_property_boosts_active ON property_boosts(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status, approval_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type, is_active);

-- Enable RLS on all tables if not already enabled
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_published ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications (fix the RLS violation error)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for properties
DROP POLICY IF EXISTS "Anyone can view approved properties" ON properties;
CREATE POLICY "Anyone can view approved properties" ON properties
    FOR SELECT USING (approval_status = 'approved' OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert properties" ON properties;
CREATE POLICY "Users can insert properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their agency properties" ON properties;
CREATE POLICY "Users can update their agency properties" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND (user_type = 'admin' OR agency_id = properties.agency_id)
        )
    );

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert profiles" ON user_profiles;
CREATE POLICY "System can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for leaderboard
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create RLS policies for property_boosts
DROP POLICY IF EXISTS "Users can view property boosts" ON property_boosts;
CREATE POLICY "Users can view property boosts" ON property_boosts
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their property boosts" ON property_boosts;
CREATE POLICY "Users can manage their property boosts" ON property_boosts
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update monthly rankings
CREATE OR REPLACE FUNCTION update_monthly_rankings()
RETURNS void AS $$
BEGIN
    -- Update monthly_rank based on points for current month
    WITH monthly_rankings AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY points DESC) as new_rank
        FROM leaderboard 
        WHERE period = 'monthly'
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    )
    UPDATE leaderboard 
    SET monthly_rank = mr.new_rank
    FROM monthly_rankings mr
    WHERE leaderboard.user_id = mr.user_id
    AND period = 'monthly'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate boost scores
CREATE OR REPLACE FUNCTION calculate_boost_score(
    multiplier NUMERIC,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
)
RETURNS NUMERIC AS $$
BEGIN
    IF is_active AND expires_at > NOW() THEN
        RETURN multiplier * EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update monthly rankings
CREATE OR REPLACE FUNCTION trigger_update_monthly_rankings()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_monthly_rankings();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rankings_trigger ON leaderboard;
CREATE TRIGGER update_rankings_trigger
    AFTER INSERT OR UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_monthly_rankings();

-- Insert default boost types if they don't exist
INSERT INTO boost_types (id, name, description, multiplier, duration_hours, cost_credits, price)
VALUES 
    (gen_random_uuid(), 'Destaque Básico', 'Destaque básico por 24 horas', 1.5, 24, 10, 50.00),
    (gen_random_uuid(), 'Destaque Premium', 'Destaque premium por 72 horas', 2.0, 72, 25, 120.00),
    (gen_random_uuid(), 'Super Destaque', 'Super destaque por 168 horas (1 semana)', 3.0, 168, 50, 250.00)
ON CONFLICT (id) DO NOTHING;

-- Update existing boost_types to have prices if they don't
UPDATE boost_types 
SET price = CASE 
    WHEN cost_credits <= 10 THEN 50.00
    WHEN cost_credits <= 25 THEN 120.00
    ELSE 250.00
END
WHERE price IS NULL OR price = 0;

COMMIT;
