-- Create property_media table for secure file uploads
CREATE TABLE IF NOT EXISTS property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  bucket_name VARCHAR(100) NOT NULL DEFAULT 'property-media',
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_agency_id ON property_media(agency_id);
CREATE INDEX IF NOT EXISTS idx_property_media_is_primary ON property_media(is_primary) WHERE is_primary = TRUE;

-- Enable RLS
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_media
DROP POLICY IF EXISTS "Users can view media from their agency" ON property_media;
CREATE POLICY "Users can view media from their agency" ON property_media
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert media for their agency properties" ON property_media;
CREATE POLICY "Users can insert media for their agency properties" ON property_media
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    ) AND
    property_id IN (
      SELECT id FROM properties 
      WHERE agency_id IN (
        SELECT agency_id FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update media from their agency" ON property_media;
CREATE POLICY "Users can update media from their agency" ON property_media
  FOR UPDATE USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete media from their agency" ON property_media;
CREATE POLICY "Users can delete media from their agency" ON property_media
  FOR DELETE USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_property_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_property_media_updated_at ON property_media;
CREATE TRIGGER trigger_update_property_media_updated_at
  BEFORE UPDATE ON property_media
  FOR EACH ROW
  EXECUTE FUNCTION update_property_media_updated_at();
