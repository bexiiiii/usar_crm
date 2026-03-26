-- Fix password hashes: update to correctly generated BCrypt hashes
-- Admin123! for super admin, Manager123! for managers
UPDATE users SET password_hash = '$2b$10$e9LTKIu/CSH3WnSosG4qNO1SV5PBqUbVofdsk06a3WzXtj8mkHV3S'
WHERE email = 'admin@travelcrm.com';

UPDATE users SET password_hash = '$2b$10$Dm5AsXoAQ7mXQjYMngKoT./o7ArSANwkwXL1bCdgQ3GmW0thlgR.6'
WHERE email IN ('ivanova@travelcrm.com', 'petrov@travelcrm.com', 'sidorova@travelcrm.com');
