-- Corrigir tipos de usuário para garantir roteamento correto
-- Apenas emails específicos devem ser admin, todos os outros devem ser partner

-- Primeiro, vamos ver o estado atual
DO $$
BEGIN
    RAISE NOTICE 'Estado atual dos usuários:';
END $$;

-- Mostrar todos os usuários e seus tipos
SELECT 
    email,
    user_type,
    full_name,
    is_active
FROM user_profiles 
ORDER BY user_type, email;

-- Corrigir tipos de usuário - apenas emails específicos devem ser admin
UPDATE user_profiles 
SET user_type = 'partner'
WHERE user_type = 'admin' 
AND email NOT IN (
    'paiosopalheiros@gmail.com',
    'contact@luckystudios.io'
);

-- Garantir que os emails admin específicos sejam admin
UPDATE user_profiles 
SET user_type = 'admin'
WHERE email IN (
    'paiosopalheiros@gmail.com',
    'contact@luckystudios.io'
);

-- Mostrar resultado final
DO $$
BEGIN
    RAISE NOTICE 'Estado após correção:';
END $$;

SELECT 
    email,
    user_type,
    full_name,
    is_active
FROM user_profiles 
ORDER BY user_type, email;

-- Estatísticas finais
SELECT 
    user_type,
    COUNT(*) as total
FROM user_profiles 
GROUP BY user_type
ORDER BY user_type;
