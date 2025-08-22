-- Criar usuário admin contact@luckystudios.io no sistema
-- Este script garante que o usuário existe na tabela user_profiles para permitir auto-registro

-- Primeiro, criar uma agência padrão se não existir
INSERT INTO agencies (id, name, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Átria Administração',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Criar o usuário admin contact@luckystudios.io
INSERT INTO user_profiles (
  id,
  user_id,
  email,
  full_name,
  user_type,
  agency_id,
  plan,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
  'contact@luckystudios.io',
  'Administrador Átria',
  'admin',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'elite',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  is_active = true,
  updated_at = NOW();

-- Verificar se o usuário foi criado
SELECT 
  email,
  full_name,
  user_type,
  is_active
FROM user_profiles 
WHERE email = 'contact@luckystudios.io';
