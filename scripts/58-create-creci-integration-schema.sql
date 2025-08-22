-- Átria CRM Imobiliário - CRECI Integration Schema
-- Create all necessary tables for unified property feed

-- Properties table (normalized properties from all sources)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('atriacrowd', 'creci')),
  external_id text,
  title text NOT NULL,
  display_title text,
  description text,
  price numeric,
  currency text DEFAULT 'BRL',
  city text,
  neighborhood text,
  address text,
  bedrooms integer,
  bathrooms integer,
  area numeric,
  parking integer,
  images text[] DEFAULT '{}',
  url_source text,
  agency_id uuid,
  owner_profile_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (source, external_id)
);

-- Raw properties table for audit trail
CREATE TABLE IF NOT EXISTS properties_raw (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  external_id text,
  raw jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

-- Sync logs for telemetry
CREATE TABLE IF NOT EXISTS sync_logs (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  fetched integer NOT NULL,
  upserted integer NOT NULL,
  since text,
  page integer,
  ok boolean DEFAULT true,
  error_msg text,
  created_at timestamptz DEFAULT now()
);

-- Sync state for cursor management
CREATE TABLE IF NOT EXISTS sync_state (
  source text PRIMARY KEY,
  last_external_id text,
  last_published_at timestamptz,
  last_run_at timestamptz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_updated_at ON properties(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- RLS Policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Public read access for active properties
CREATE POLICY "Public can view active properties" ON properties
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access to properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

-- Admin access to raw data and logs
CREATE POLICY "Admin can view properties_raw" ON properties_raw
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admin can view sync_logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admin can manage sync_state" ON sync_state
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for properties updated_at
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
