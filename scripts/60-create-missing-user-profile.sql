-- Create missing user profile for contact@luckystudios.io
-- This user exists in Supabase Auth but is missing from user_profiles table

INSERT INTO user_profiles (
  id,
  email,
  full_name,
  user_type,
  created_at,
  updated_at
) VALUES (
  '625b9e42-d286-4f48-9698-7fc09787fd83',
  'contact@luckystudios.io',
  'Lucky Studios Contact',
  'partner',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  updated_at = NOW();

-- Fixed agencies table insert to only use existing columns (id, name, created_at, updated_at)
-- Also create an agency record for this partner user
INSERT INTO agencies (
  id,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Lucky Studios',
  NOW(),
  NOW()
);

-- Updated to use agency name instead of email for lookup since email column doesn't exist
-- Update user profile with agency_id
UPDATE user_profiles 
SET agency_id = (SELECT id FROM agencies WHERE name = 'Lucky Studios')
WHERE email = 'contact@luckystudios.io';
