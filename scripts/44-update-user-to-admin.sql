-- Update specific user to admin type for dashboard access
UPDATE user_profiles 
SET user_type = 'admin' 
WHERE email = 'paiosopalheiros@gmail.com';

-- Verify the update was successful
SELECT id, email, user_type, full_name, is_active 
FROM user_profiles 
WHERE email = 'paiosopalheiros@gmail.com';
