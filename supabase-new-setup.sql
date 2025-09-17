-- Complete Supabase Database Setup for New Account
-- Run this in your new Supabase SQL Editor

-- 1. Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter TEXT,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create function to verify admin password
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

-- 4. Insert default admin user
INSERT INTO admin_users (username, password_hash, email, is_active)
VALUES ('admin', 'admin123secure', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_courses_chapter ON courses(chapter);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for courses table
CREATE POLICY "Allow all operations on courses" ON courses
    FOR ALL USING (true);

-- 8. Create policies for admin_users table
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true);

-- 9. Create function to generate unique course IDs
CREATE OR REPLACE FUNCTION generate_course_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_id TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random 8-character ID
        new_id := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if this ID already exists
        SELECT COUNT(*) INTO exists_count
        FROM courses
        WHERE course_id = new_id;
        
        -- If ID doesn't exist, we can use it
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- 10. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 12. Verify tables were created
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
