-- Safe Supabase Database Setup - Handles Existing Objects
-- Run this in your Supabase SQL Editor

-- 1. Create courses table (if not exists)
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

-- 2. Create admin_users table (if not exists)
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add chapter column to courses if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'chapter') THEN
        ALTER TABLE courses ADD COLUMN chapter TEXT;
    END IF;
END $$;

-- 4. Create or replace verify_admin_password function
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

-- 5. Create or replace generate_course_id function
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

-- 6. Insert default admin user (ignore if exists)
INSERT INTO admin_users (username, password_hash, email, is_active)
VALUES ('admin', 'admin123secure', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;

-- 7. Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_courses_chapter ON courses(chapter);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 9. Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on courses" ON courses;
CREATE POLICY "Allow all operations on courses" ON courses
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on admin_users" ON admin_users;
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true);

-- 10. Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Drop and recreate triggers
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 13. Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables:' as info, table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT 'Functions:' as info, routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
