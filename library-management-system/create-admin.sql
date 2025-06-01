-- This SQL script can be run in the Supabase SQL editor to create a test admin account
-- Make sure to replace 'admin@example.com' with your desired admin email

-- First, you need to sign up the user normally through the application
-- Then run this script to promote them to admin

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- You can also check existing users and their roles:
SELECT email, role, full_name, created_at 
FROM users 
ORDER BY created_at DESC;
