-- =====================================================
-- MASTER SUPABASE DATABASE SETUP
-- Complete Database Schema for Course Management App
-- =====================================================
-- This script creates ALL tables and functions needed for the app
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CLEANUP EXISTING OBJECTS (SAFE)
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on courses" ON courses;
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow all operations on tokens" ON tokens;
DROP POLICY IF EXISTS "Allow all operations on subjects" ON subjects;
DROP POLICY IF EXISTS "Allow all operations on chapters" ON chapters;
DROP POLICY IF EXISTS "Allow all operations on settings" ON settings;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Drop existing functions
DROP FUNCTION IF EXISTS verify_admin_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS generate_course_id();
DROP FUNCTION IF EXISTS generate_subject_id();
DROP FUNCTION IF EXISTS generate_chapter_id();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- 2. CREATE ALL TABLES
-- =====================================================

-- 2.1 Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Subjects Table (NEW - for subject management)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    subject_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'fas fa-book',
    color TEXT DEFAULT '#3498db',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Chapters Table (NEW - for chapter management)
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    chapter_id TEXT UNIQUE NOT NULL,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);

-- 2.4 Courses Table (UPDATED - with chapter reference)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    chapter_id TEXT,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE SET NULL
);

-- 2.5 Tokens Table (for course access tokens)
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    course_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- 2.6 Users Table (for tracking student access)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_channel_member BOOLEAN DEFAULT false,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.7 Settings Table (NEW - for app configuration)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE ALL FUNCTIONS
-- =====================================================

-- 3.1 Admin Password Verification Function
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

-- 3.2 Generate Unique Course ID Function
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

-- 3.3 Generate Unique Subject ID Function
CREATE OR REPLACE FUNCTION generate_subject_id()
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
        FROM subjects
        WHERE subject_id = new_id;
        
        -- If ID doesn't exist, we can use it
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- 3.4 Generate Unique Chapter ID Function
CREATE OR REPLACE FUNCTION generate_chapter_id()
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
        FROM chapters
        WHERE chapter_id = new_id;
        
        -- If ID doesn't exist, we can use it
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- 3.5 Update Updated At Column Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 4. CREATE ALL TRIGGERS
-- =====================================================

-- 4.1 Admin Users Triggers
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.2 Subjects Triggers
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.3 Chapters Triggers
CREATE TRIGGER update_chapters_updated_at 
    BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.4 Courses Triggers
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.5 Settings Triggers
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE ALL INDEXES
-- =====================================================

-- 5.1 Admin Users Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- 5.2 Subjects Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_subject_id ON subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- 5.3 Chapters Indexes
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_id ON chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_active ON chapters(is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(number);

-- 5.4 Courses Indexes
CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_chapter_id ON courses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- 5.5 Tokens Indexes
CREATE INDEX IF NOT EXISTS idx_tokens_course_id ON tokens(course_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);

-- 5.6 Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 5.7 Settings Indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE ALL POLICIES
-- =====================================================

-- 7.1 Admin Users Policies
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true);

-- 7.2 Subjects Policies
CREATE POLICY "Allow all operations on subjects" ON subjects
    FOR ALL USING (true);

-- 7.3 Chapters Policies
CREATE POLICY "Allow all operations on chapters" ON chapters
    FOR ALL USING (true);

-- 7.4 Courses Policies
CREATE POLICY "Allow all operations on courses" ON courses
    FOR ALL USING (true);

-- 7.5 Tokens Policies
CREATE POLICY "Allow all operations on tokens" ON tokens
    FOR ALL USING (true);

-- 7.6 Users Policies
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- 7.7 Settings Policies
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- 9. INSERT DEFAULT DATA
-- =====================================================

-- 9.1 Insert Default Admin User
INSERT INTO admin_users (username, password_hash, email, is_active)
VALUES ('admin', 'admin123secure', 'admin@example.com', true)
ON CONFLICT (username) DO NOTHING;

-- 9.2 Insert Default Subjects
INSERT INTO subjects (subject_id, name, icon, color, is_active)
VALUES 
    ('amharic', 'Amharic', 'fas fa-book', '#e74c3c', true),
    ('english', 'English', 'fas fa-language', '#3498db', true),
    ('math', 'Mathematics', 'fas fa-calculator', '#2ecc71', true),
    ('physics', 'Physics', 'fas fa-atom', '#9b59b6', true),
    ('chemistry', 'Chemistry', 'fas fa-flask', '#f39c12', true),
    ('biology', 'Biology', 'fas fa-dna', '#1abc9c', true)
ON CONFLICT (subject_id) DO NOTHING;

-- 9.3 Insert Default Chapters for Each Subject
-- Amharic Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('amharic_ch1', 'amharic', 'Chapter 1', 1, true),
    ('amharic_ch2', 'amharic', 'Chapter 2', 2, true),
    ('amharic_ch3', 'amharic', 'Chapter 3', 3, true),
    ('amharic_ch4', 'amharic', 'Chapter 4', 4, true),
    ('amharic_ch5', 'amharic', 'Chapter 5', 5, true),
    ('amharic_ch6', 'amharic', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- English Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('english_ch1', 'english', 'Chapter 1', 1, true),
    ('english_ch2', 'english', 'Chapter 2', 2, true),
    ('english_ch3', 'english', 'Chapter 3', 3, true),
    ('english_ch4', 'english', 'Chapter 4', 4, true),
    ('english_ch5', 'english', 'Chapter 5', 5, true),
    ('english_ch6', 'english', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- Math Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('math_ch1', 'math', 'Chapter 1', 1, true),
    ('math_ch2', 'math', 'Chapter 2', 2, true),
    ('math_ch3', 'math', 'Chapter 3', 3, true),
    ('math_ch4', 'math', 'Chapter 4', 4, true),
    ('math_ch5', 'math', 'Chapter 5', 5, true),
    ('math_ch6', 'math', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- Physics Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('physics_ch1', 'physics', 'Chapter 1', 1, true),
    ('physics_ch2', 'physics', 'Chapter 2', 2, true),
    ('physics_ch3', 'physics', 'Chapter 3', 3, true),
    ('physics_ch4', 'physics', 'Chapter 4', 4, true),
    ('physics_ch5', 'physics', 'Chapter 5', 5, true),
    ('physics_ch6', 'physics', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- Chemistry Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('chemistry_ch1', 'chemistry', 'Chapter 1', 1, true),
    ('chemistry_ch2', 'chemistry', 'Chapter 2', 2, true),
    ('chemistry_ch3', 'chemistry', 'Chapter 3', 3, true),
    ('chemistry_ch4', 'chemistry', 'Chapter 4', 4, true),
    ('chemistry_ch5', 'chemistry', 'Chapter 5', 5, true),
    ('chemistry_ch6', 'chemistry', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- Biology Chapters
INSERT INTO chapters (chapter_id, subject_id, name, number, is_active)
VALUES 
    ('biology_ch1', 'biology', 'Chapter 1', 1, true),
    ('biology_ch2', 'biology', 'Chapter 2', 2, true),
    ('biology_ch3', 'biology', 'Chapter 3', 3, true),
    ('biology_ch4', 'biology', 'Chapter 4', 4, true),
    ('biology_ch5', 'biology', 'Chapter 5', 5, true),
    ('biology_ch6', 'biology', 'Chapter 6', 6, true)
ON CONFLICT (chapter_id) DO NOTHING;

-- 9.4 Insert Default Settings
INSERT INTO settings (key, value, description)
VALUES 
    ('app_name', '"Bright Freshman"', 'Application name'),
    ('app_version', '"1.0.0"', 'Application version'),
    ('default_theme', '"dark"', 'Default theme (dark/light)'),
    ('watermark_enabled', 'true', 'Watermark enabled by default'),
    ('telegram_bot_token', '""', 'Telegram bot token'),
    ('telegram_channel_id', '""', 'Telegram channel ID'),
    ('max_courses_per_subject', '100', 'Maximum courses per subject'),
    ('max_chapters_per_subject', '20', 'Maximum chapters per subject')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

-- Verify all tables were created
SELECT 'Database setup completed successfully!' as status;

-- Show all tables
SELECT 'Tables created:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show all functions
SELECT 'Functions created:' as info, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Show record counts
SELECT 'Default data inserted:' as info, 
       'Admin users: ' || (SELECT COUNT(*) FROM admin_users) as admin_count,
       'Subjects: ' || (SELECT COUNT(*) FROM subjects) as subjects_count,
       'Chapters: ' || (SELECT COUNT(*) FROM chapters) as chapters_count,
       'Settings: ' || (SELECT COUNT(*) FROM settings) as settings_count;

-- =====================================================
-- END OF MASTER SETUP
-- =====================================================
