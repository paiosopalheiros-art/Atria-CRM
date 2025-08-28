-- Adding missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS creci TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adding index for better performance on creci lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_creci ON public.user_profiles(creci);

-- Adding constraint to ensure creci is unique when provided
ALTER TABLE public.user_profiles 
ADD CONSTRAINT unique_creci UNIQUE (creci);
