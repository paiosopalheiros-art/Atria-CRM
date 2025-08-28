-- Creating a working admin user with proper setup
-- Remove any existing problematic users first
DELETE FROM auth.users WHERE email = 'contact@luckystudios.io';
DELETE FROM user_profiles WHERE email = 'contact@luckystudios.io';

-- Create admin user directly in auth.users (this bypasses normal registration)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@atria.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create corresponding user profile
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  user_type,
  plan,
  agency_id,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@atria.com'),
  'admin@atria.com',
  'Administrador Átria',
  'admin',
  'elite',
  (SELECT id FROM agencies WHERE name = 'Átria Administração' LIMIT 1),
  NOW(),
  NOW()
);

-- Ensure we have a default agency
INSERT INTO agencies (name, created_at, updated_at) 
VALUES ('Átria Administração', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
