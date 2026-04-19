-- Update any existing admin user to have ADMIN role
UPDATE users 
SET role = 'ADMIN' 
WHERE email LIKE '%admin%' OR first_name LIKE '%admin%' OR email = 'admin@smartcampus.com'
LIMIT 1;

-- If no admin exists, create one (optional - commented out for safety)
-- INSERT INTO users (id, email, first_name, last_name, full_name, password, role, provider, email_verified, is_active, created_at)
-- VALUES (
--   'admin-001',
--   'admin@smartcampus.com',
--   'Admin',
--   'Demo',
--   'Admin Demo',
--   '$2a$10$...',  -- bcrypt hash of 'Admin@123'
--   'ADMIN',
--   'LOCAL',
--   true,
--   true,
--   NOW()
-- )
-- ON CONFLICT DO NOTHING;
