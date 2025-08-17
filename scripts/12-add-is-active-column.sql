-- Add is_active column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment to the column
COMMENT ON COLUMN public.user_profiles.is_active IS 'Indicates if the user profile is active';

-- Update existing records to have is_active = true
UPDATE public.user_profiles 
SET is_active = true 
WHERE is_active IS NULL;
