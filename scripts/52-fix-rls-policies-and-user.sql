-- Creating proper RLS policies and adding missing user
-- First, ensure the contact user exists in user_profiles
INSERT INTO user_profiles (
  id,
  user_id, 
  email,
  full_name,
  user_type,
  plan,
  agency_id,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  gen_random_uuid(),
  'contact@luckystudios.io',
  'Contact Admin',
  'admin',
  'elite',
  (SELECT id FROM agencies WHERE name = 'Átria Administração' LIMIT 1),
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE email = 'contact@luckystudios.io'
);

-- Create proper RLS policies for user_profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Enable RLS if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Allow public registration (needed for signup flow)
CREATE POLICY "Allow public profile creation" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Fix notifications table RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create trigger to auto-create profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_agency_id uuid;
BEGIN
  -- Get or create default agency
  SELECT id INTO default_agency_id 
  FROM agencies 
  WHERE name = 'Átria Administração' 
  LIMIT 1;
  
  IF default_agency_id IS NULL THEN
    INSERT INTO agencies (id, name, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Átria Administração', now(), now())
    RETURNING id INTO default_agency_id;
  END IF;

  -- Insert profile for new user
  INSERT INTO public.user_profiles (
    id,
    user_id,
    email,
    full_name,
    user_type,
    plan,
    agency_id,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    CASE 
      WHEN new.email LIKE '%admin%' OR new.email LIKE '%atria%' OR new.email = 'contact@luckystudios.io' OR new.email = 'paiosopalheiros@gmail.com' 
      THEN 'admin' 
      ELSE 'partner' 
    END,
    'basic',
    default_agency_id,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
