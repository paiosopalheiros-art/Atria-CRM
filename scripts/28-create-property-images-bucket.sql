-- Create Supabase Storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for property images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own property images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
