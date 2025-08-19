-- Limpeza de contas duplicadas para paiosopalheiros@gmail.com
-- Garante que só exista uma conta admin

BEGIN;

-- Primeiro, vamos ver o estado atual das contas
DO $$
DECLARE
    account_count INTEGER;
    admin_count INTEGER;
    partner_count INTEGER;
BEGIN
    -- Contar total de contas com este email
    SELECT COUNT(*) INTO account_count 
    FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com';
    
    -- Contar contas admin
    SELECT COUNT(*) INTO admin_count 
    FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com' AND user_type = 'admin';
    
    -- Contar contas partner
    SELECT COUNT(*) INTO partner_count 
    FROM user_profiles 
    WHERE email = '' AND user_type = 'partner';
    
    RAISE NOTICE 'Estado atual: % contas total, % admin, % partner', account_count, admin_count, partner_count;
END $$;

-- Se já existe uma conta admin, deletar todas as contas partner
DELETE FROM user_profiles 
WHERE email = 'paiosopalheiros@gmail.com' 
  AND user_type = 'partner'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com' 
      AND user_type = 'admin'
  );

-- Se não existe conta admin, converter a primeira conta partner para admin
UPDATE user_profiles 
SET user_type = 'admin',
    updated_at = NOW()
WHERE email = 'paiosopalheiros@gmail.com' 
  AND user_type = 'partner'
  AND id = (
    SELECT id FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com' 
      AND user_type = 'partner' 
    ORDER BY created_at ASC 
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com' 
      AND user_type = 'admin'
  );

-- Deletar qualquer conta partner restante
DELETE FROM user_profiles 
WHERE email = 'paiosopalheiros@gmail.com' 
  AND user_type = 'partner';

-- Verificar resultado final
DO $$
DECLARE
    final_count INTEGER;
    final_type TEXT;
BEGIN
    SELECT COUNT(*), MAX(user_type) INTO final_count, final_type
    FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com';
    
    RAISE NOTICE 'Resultado final: % conta(s), tipo: %', final_count, final_type;
    
    IF final_count = 1 AND final_type = 'admin' THEN
        RAISE NOTICE 'Limpeza concluída com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro na limpeza: esperado 1 conta admin, encontrado % conta(s) tipo %', final_count, final_type;
    END IF;
END $$;

COMMIT;
