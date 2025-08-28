-- Script para forçar atualização do usuário para admin
-- Atualiza diretamente o user_type para admin

DO $$
BEGIN
    -- Atualizar user_type para admin
    UPDATE user_profiles 
    SET user_type = 'admin',
        updated_at = NOW()
    WHERE email = 'paiosopalheiros@gmail.com';
    
    -- Verificar se a atualização funcionou
    IF FOUND THEN
        RAISE NOTICE 'Usuário paiosopalheiros@gmail.com atualizado para admin com sucesso';
    ELSE
        RAISE NOTICE 'Usuário paiosopalheiros@gmail.com não encontrado';
    END IF;
    
    -- Mostrar estado atual
    RAISE NOTICE 'Estado atual do usuário:';
    PERFORM email, user_type, full_name 
    FROM user_profiles 
    WHERE email = 'paiosopalheiros@gmail.com';
    
END $$;

-- Verificação final
SELECT 
    email,
    user_type,
    full_name,
    updated_at
FROM user_profiles 
WHERE email = 'paiosopalheiros@gmail.com';
