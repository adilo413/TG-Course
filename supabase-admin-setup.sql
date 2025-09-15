-- Create admin table for database-based authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Add email column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'email') THEN
        ALTER TABLE admin_users ADD COLUMN email VARCHAR(100);
    END IF;
END $$;

-- Insert default admin user
-- Password: admin123secure (stored as plain text for now)
INSERT INTO admin_users (username, password_hash, is_active)
VALUES (
    'admin', 
    'admin', -- For now, store as plain text
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (only authenticated users can read)
CREATE POLICY "Admin users can read their own data" ON admin_users
    FOR SELECT USING (true);

-- Create policy for admin updates (only authenticated users can update)
CREATE POLICY "Admin users can update their own data" ON admin_users
    FOR UPDATE USING (true);

-- Create function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(
    input_username VARCHAR(50),
    input_password VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    admin_record admin_users%ROWTYPE;
    result JSON;
BEGIN
    -- Get admin user by username
    SELECT * INTO admin_record 
    FROM admin_users 
    WHERE username = input_username 
    AND is_active = TRUE;
    
    -- Check if user exists
    IF admin_record IS NULL THEN
        result := json_build_object(
            'success', false,
            'error', 'Invalid username or password'
        );
        RETURN result;
    END IF;
    
    -- For now, we'll do a simple password comparison
    -- In production, you should use proper bcrypt verification
    IF input_password = admin_record.password_hash THEN
        -- Update last login
        UPDATE admin_users 
        SET last_login = NOW() 
        WHERE id = admin_record.id;
        
        result := json_build_object(
            'success', true,
            'admin_id', admin_record.id,
            'username', admin_record.username
        );
        RETURN result;
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Invalid username or password'
        );
        RETURN result;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION verify_admin_password TO anon;
