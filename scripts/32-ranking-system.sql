-- Ranking System for Gamification
-- Creates tables and functions for competitive ranking

-- Create user_rankings table
CREATE TABLE IF NOT EXISTS user_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Points and Level System
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_progress DECIMAL(5,2) DEFAULT 0.00, -- Progress to next level (0-100%)
  
  -- Performance Metrics
  properties_captured INTEGER DEFAULT 0,
  properties_sold INTEGER DEFAULT 0,
  total_commission DECIMAL(12,2) DEFAULT 0.00,
  client_satisfaction DECIMAL(3,2) DEFAULT 0.00, -- 0-5 rating
  
  -- Ranking Position
  monthly_rank INTEGER DEFAULT 0,
  overall_rank INTEGER DEFAULT 0,
  
  -- Achievements
  badges_earned TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  
  -- Timestamps
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ranking_history table for tracking changes
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Historical Data
  points_earned INTEGER DEFAULT 0,
  action_type VARCHAR(50) NOT NULL, -- 'property_captured', 'property_sold', 'client_review', etc.
  description TEXT,
  
  -- Context
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  commission_amount DECIMAL(12,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard view for top performers
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ur.user_id,
  up.full_name,
  up.avatar_url,
  ur.total_points,
  ur.current_level,
  ur.properties_captured,
  ur.properties_sold,
  ur.total_commission,
  ur.client_satisfaction,
  ur.monthly_rank,
  ur.overall_rank,
  ur.badges_earned,
  ur.achievements,
  a.name as agency_name
FROM user_rankings ur
JOIN user_profiles up ON ur.user_id = up.user_id
JOIN agencies a ON ur.agency_id = a.id
ORDER BY ur.total_points DESC, ur.properties_sold DESC;

-- Function to calculate points based on actions
CREATE OR REPLACE FUNCTION calculate_points(action_type VARCHAR, amount DECIMAL DEFAULT 0)
RETURNS INTEGER AS $$
BEGIN
  CASE action_type
    WHEN 'property_captured' THEN RETURN 100;
    WHEN 'property_sold' THEN RETURN 500;
    WHEN 'client_review_5' THEN RETURN 200;
    WHEN 'client_review_4' THEN RETURN 150;
    WHEN 'client_review_3' THEN RETURN 100;
    WHEN 'first_sale' THEN RETURN 1000;
    WHEN 'monthly_top_10' THEN RETURN 2000;
    WHEN 'commission_milestone' THEN 
      -- Bonus points for commission milestones
      IF amount >= 50000 THEN RETURN 5000;
      ELSIF amount >= 25000 THEN RETURN 2500;
      ELSIF amount >= 10000 THEN RETURN 1000;
      ELSE RETURN 0;
      END IF;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to determine level based on points
CREATE OR REPLACE FUNCTION get_level_from_points(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF points >= 50000 THEN RETURN 10; -- Master
  ELSIF points >= 40000 THEN RETURN 9; -- Expert
  ELSIF points >= 30000 THEN RETURN 8; -- Professional
  ELSIF points >= 20000 THEN RETURN 7; -- Advanced
  ELSIF points >= 15000 THEN RETURN 6; -- Experienced
  ELSIF points >= 10000 THEN RETURN 5; -- Intermediate
  ELSIF points >= 7500 THEN RETURN 4; -- Developing
  ELSIF points >= 5000 THEN RETURN 3; -- Growing
  ELSIF points >= 2500 THEN RETURN 2; -- Beginner
  ELSE RETURN 1; -- Novice
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user ranking
CREATE OR REPLACE FUNCTION update_user_ranking(
  p_user_id UUID,
  p_action_type VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_commission_amount DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_agency_id UUID;
  v_points_earned INTEGER;
  v_new_total_points INTEGER;
  v_new_level INTEGER;
  v_level_progress DECIMAL;
BEGIN
  -- Get user's agency_id
  SELECT agency_id INTO v_agency_id 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- Calculate points for this action
  v_points_earned := calculate_points(p_action_type, p_commission_amount);
  
  -- Insert or update user_rankings
  INSERT INTO user_rankings (user_id, agency_id, total_points)
  VALUES (p_user_id, v_agency_id, v_points_earned)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_rankings.total_points + v_points_earned,
    properties_captured = CASE 
      WHEN p_action_type = 'property_captured' THEN user_rankings.properties_captured + 1
      ELSE user_rankings.properties_captured
    END,
    properties_sold = CASE 
      WHEN p_action_type = 'property_sold' THEN user_rankings.properties_sold + 1
      ELSE user_rankings.properties_sold
    END,
    total_commission = user_rankings.total_commission + COALESCE(p_commission_amount, 0),
    updated_at = NOW();
  
  -- Get updated total points
  SELECT total_points INTO v_new_total_points 
  FROM user_rankings 
  WHERE user_id = p_user_id;
  
  -- Calculate new level and progress
  v_new_level := get_level_from_points(v_new_total_points);
  
  -- Calculate progress to next level
  v_level_progress := CASE 
    WHEN v_new_level = 10 THEN 100.00 -- Max level
    ELSE (v_new_total_points % 5000) * 100.0 / 5000 -- Assuming 5000 points per level
  END;
  
  -- Update level and progress
  UPDATE user_rankings SET
    current_level = v_new_level,
    level_progress = v_level_progress,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record in history
  INSERT INTO ranking_history (
    user_id, agency_id, points_earned, action_type, description, 
    property_id, commission_amount
  ) VALUES (
    p_user_id, v_agency_id, v_points_earned, p_action_type, p_description,
    p_property_id, p_commission_amount
  );
  
END;
$$ LANGUAGE plpgsql;

-- Function to update monthly rankings
CREATE OR REPLACE FUNCTION update_monthly_rankings()
RETURNS VOID AS $$
BEGIN
  -- Update monthly ranks based on current month performance
  WITH monthly_stats AS (
    SELECT 
      ur.user_id,
      ur.total_points,
      ROW_NUMBER() OVER (ORDER BY ur.total_points DESC, ur.properties_sold DESC) as rank
    FROM user_rankings ur
  )
  UPDATE user_rankings 
  SET monthly_rank = ms.rank
  FROM monthly_stats ms
  WHERE user_rankings.user_id = ms.user_id;
  
  -- Update overall ranks
  WITH overall_stats AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, properties_sold DESC) as rank
    FROM user_rankings
  )
  UPDATE user_rankings 
  SET overall_rank = os.rank
  FROM overall_stats os
  WHERE user_rankings.user_id = os.user_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON user_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_agency_id ON user_rankings(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_points ON user_rankings(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_monthly_rank ON user_rankings(monthly_rank);
CREATE INDEX IF NOT EXISTS idx_ranking_history_user_id ON ranking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_created_at ON ranking_history(created_at DESC);

-- Enable RLS
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view rankings in their agency" ON user_rankings
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ranking" ON user_rankings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view ranking history in their agency" ON ranking_history
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );
