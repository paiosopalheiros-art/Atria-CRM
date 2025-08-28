-- Create additional admin user: contact@luckystudios.io
-- This script creates a user profile for contact@luckystudios.io as admin

DO $$
DECLARE
    contact_user_id UUID;
    default_agency_id UUID;
BEGIN
    -- Check if user already exists in user_profiles
    SELECT user_id INTO contact_user_id 
    FROM user_profiles 
    WHERE email = 'contact@luckystudios.io';
    
    IF contact_user_id IS NULL THEN
        -- Generate a UUID for the new user (this would normally come from Supabase Auth)
        contact_user_id := gen_random_uuid();
        
        -- Get or create default agency
        SELECT id INTO default_agency_id 
        FROM agencies 
        WHERE name = 'Agência Padrão' 
        LIMIT 1;
        
        IF default_agency_id IS NULL THEN
            INSERT INTO agencies (name) 
            VALUES ('Agência Padrão') 
            RETURNING id INTO default_agency_id;
            
            RAISE NOTICE 'Created default agency with ID: %', default_agency_id;
        END IF;
        
        -- Create user profile
        INSERT INTO user_profiles (
            user_id,
            full_name,
            email,
            user_type,
            agency_id,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            contact_user_id,
            'Lucky Studios Admin',
            'contact@luckystudios.io',
            'admin',
            default_agency_id,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created admin user profile for contact@luckystudios.io with ID: %', contact_user_id;
        
    ELSE
        -- Update existing user to admin if not already
        UPDATE user_profiles 
        SET 
            user_type = 'admin',
            is_active = true,
            updated_at = NOW()
        WHERE email = 'contact@luckystudios.io';
        
        RAISE NOTICE 'Updated existing user contact@luckystudios.io to admin';
    END IF;
    
    -- Verify the user was created/updated
    SELECT user_id, full_name, user_type, is_active 
    FROM user_profiles 
    WHERE email = 'contact@luckystudios.io';
    
END $$;

-- Show final state
SELECT 
    email,
    full_name,
    user_type,
    is_active,
    agency_id,
    created_at
FROM user_profiles 
WHERE email IN ('paiosopalheiros@gmail.com', 'contact@luckystudios.io')
ORDER BY email;
