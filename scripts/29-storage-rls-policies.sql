-- Create RLS policies for Supabase Storage buckets
-- This script creates proper access control for property images

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "property_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete_policy" ON storage.objects;

-- Create policies for property-images bucket
CREATE POLICY "property_images_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "property_images_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "property_images_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "property_images_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

-- Create function to help with storage policy creation (if needed)
CREATE OR REPLACE FUNCTION create_storage_policy(
  bucket_name text,
  policy_name text,
  operation text,
  definition text
)
RETURNS void AS $$
BEGIN
  -- This is a placeholder function for policy creation
  -- In practice, policies should be created directly via SQL
  RAISE NOTICE 'Storage policy % for bucket % would be created', policy_name, bucket_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
