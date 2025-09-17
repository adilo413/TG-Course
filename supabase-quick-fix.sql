-- =====================================================
-- QUICK FIX FOR ADMIN LOGIN ISSUE
-- Run this first to fix the immediate login problem
-- =====================================================

-- 1. Check if admin_users table exists and has the right structure
-- If not, create it properly

-- Drop existing admin_users table if it exists (to start fresh)
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create admin_users table with all required columns
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO admin_users (username, password_hash, email, is_active)
VALUES ('admin', 'admin123secure', 'admin@example.com', true);

-- Create the verify_admin_password function
CREATE OR REPLACE FUNCTION verify_admin_password(
    input_username TEXT,
    input_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Find user by username
    SELECT * INTO user_record
    FROM admin_users
    WHERE username = input_username AND is_active = true;
    
    -- Check if user exists and password matches
    IF user_record IS NOT NULL AND user_record.password_hash = input_password THEN
        -- Update last login
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE id = user_record.id;
        
        result := json_build_object(
            'success', true,
            'user', json_build_object(
                'id', user_record.id,
                'username', user_record.username,
                'is_active', user_record.is_active
            )
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Invalid username or password'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON admin_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_password TO anon, authenticated;

-- Verify the fix
SELECT 'Quick fix completed! Admin login should work now.' as status;
SELECT 'Admin user created:' as info, username, is_active FROM admin_users;
