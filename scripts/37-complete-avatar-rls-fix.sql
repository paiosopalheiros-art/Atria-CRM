-- Complete RLS solution for avatar upload based on expert recommendations

-- 1) Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2) Create RLS policies for user_profiles
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_own"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3) Ensure user_id is UUID type (adjust if needed)
ALTER TABLE public.user_profiles
  ALTER COLUMN user_id TYPE uuid
  USING user_id::uuid;

-- 4) Create performance index
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);

-- 5) Create avatars bucket using official function (more reliable)
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    )
    THEN storage.create_bucket('avatars', public => true)
  END;

-- 6) Create storage policies for avatars bucket
CREATE POLICY "avatars_read_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

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

CREATE POLICY "avatars_delete_own_folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);
