-- Creating RLS policies for user_profiles table and avatars storage bucket
-- Fix for "new row violates row-level security policy" error

-- 1) Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2) Policies for user_profiles table
-- Users can read their own profile
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own profile (for first-time setup)
CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3) Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4) Storage policies for avatars bucket
-- Public read access to avatar images
CREATE POLICY "avatars_read_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder only
CREATE POLICY "avatars_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Users can update/replace their own avatar files
CREATE POLICY "avatars_update_own_folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Users can delete their own avatar files
CREATE POLICY "avatars_delete_own_folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);
