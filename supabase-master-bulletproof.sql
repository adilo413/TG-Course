-- =====================================================
-- BULLETPROOF SUPABASE MASTER SETUP
-- Complete database setup with all features
-- Run this ONCE after clearing all tables
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ALL TABLES (NO DEPENDENCIES)
-- =====================================================

-- 1. Admin Users Table
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

-- 2. Subjects Table
CREATE TABLE subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Chapters Table
CREATE TABLE chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Courses Table
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    price DECIMAL(10,2),
    subject_id TEXT NOT NULL,
    chapter_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tokens Table
CREATE TABLE tokens (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Settings Table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints after all tables exist
ALTER TABLE chapters ADD CONSTRAINT fk_chapters_subject_id 
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE courses ADD CONSTRAINT fk_courses_subject_id 
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE courses ADD CONSTRAINT fk_courses_chapter_id 
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL;

ALTER TABLE tokens ADD CONSTRAINT fk_tokens_course_id 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_chapter_id ON courses(chapter_id);
CREATE INDEX idx_tokens_course_id ON tokens(course_id);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- =====================================================
-- STEP 4: CREATE FUNCTIONS
-- =====================================================

-- Admin Login Function
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

-- Course Token Generation Function
CREATE OR REPLACE FUNCTION generate_course_token(
    input_course_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_value TEXT;
    expires_at TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Generate unique token
    token_value := 'token_' || input_course_id || '_' || extract(epoch from now())::text;
    
    -- Set expiration (24 hours from now)
    expires_at := NOW() + INTERVAL '24 hours';
    
    -- Insert token
    INSERT INTO tokens (id, course_id, token, expires_at)
    VALUES (token_value, input_course_id, token_value, expires_at);
    
    result := json_build_object(
        'success', true,
        'token', token_value,
        'expires_at', expires_at
    );
    
    RETURN result;
END;
$$;

-- Course Token Validation Function
CREATE OR REPLACE FUNCTION validate_course_token(
    input_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token_record RECORD;
    course_record RECORD;
    result JSON;
BEGIN
    -- Find token
    SELECT * INTO token_record
    FROM tokens
    WHERE token = input_token AND expires_at > NOW();
    
    IF token_record IS NULL THEN
        result := json_build_object(
            'success', false,
            'error', 'Invalid or expired token'
        );
        RETURN result;
    END IF;
    
    -- Get course details
    SELECT * INTO course_record
    FROM courses
    WHERE id = token_record.course_id;
    
    IF course_record IS NULL THEN
        result := json_build_object(
            'success', false,
            'error', 'Course not found'
        );
        RETURN result;
    END IF;
    
    result := json_build_object(
        'success', true,
        'course', json_build_object(
            'id', course_record.id,
            'title', course_record.title,
            'description', course_record.description,
            'content', course_record.content,
            'price', course_record.price,
            'subject_id', course_record.subject_id,
            'chapter_id', course_record.chapter_id
        )
    );
    
    RETURN result;
END;
$$;

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE POLICIES
-- =====================================================

-- Admin Users Policies
CREATE POLICY "Allow all operations on admin_users" ON admin_users
    FOR ALL USING (true);

-- Subjects Policies
CREATE POLICY "Allow all operations on subjects" ON subjects
    FOR ALL USING (true);

-- Chapters Policies
CREATE POLICY "Allow all operations on chapters" ON chapters
    FOR ALL USING (true);

-- Courses Policies
CREATE POLICY "Allow all operations on courses" ON courses
    FOR ALL USING (true);

-- Tokens Policies
CREATE POLICY "Allow all operations on tokens" ON tokens
    FOR ALL USING (true);

-- Users Policies
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Settings Policies
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true);

-- =====================================================
-- STEP 7: GRANT PERMISSIONS
-- =====================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT ALL ON admin_users TO anon, authenticated;
GRANT ALL ON subjects TO anon, authenticated;
GRANT ALL ON chapters TO anon, authenticated;
GRANT ALL ON courses TO anon, authenticated;
GRANT ALL ON tokens TO anon, authenticated;
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;

-- Grant sequence permissions
GRANT ALL ON admin_users_id_seq TO anon, authenticated;
GRANT ALL ON settings_id_seq TO anon, authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION verify_admin_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_course_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_course_token TO anon, authenticated;

-- =====================================================
-- STEP 8: INSERT DEFAULT DATA
-- =====================================================

-- Insert default admin user
INSERT INTO admin_users (username, password_hash, email, is_active)
VALUES ('admin', 'admin321', 'admin@example.com', true);

-- Insert default subjects with chapters
INSERT INTO subjects (id, name, description, icon, color) VALUES
('ethiopia', 'Ethiopia', 'Learn about Ethiopian culture, history, and language', '🇪🇹', '#FF6B6B'),
('mathematics', 'Mathematics', 'Master mathematical concepts and problem-solving', '📐', '#4ECDC4'),
('science', 'Science', 'Explore the wonders of science and nature', '🔬', '#45B7D1'),
('language', 'Language', 'Improve your language skills and communication', '📚', '#96CEB4'),
('history', 'History', 'Discover the past and understand the present', '🏛️', '#FFEAA7'),
('geography', 'Geography', 'Learn about the world and its features', '🌍', '#DDA0DD');

-- Insert chapters for each subject
INSERT INTO chapters (id, subject_id, name, number) VALUES
-- Ethiopia chapters
('ethiopia_1', 'ethiopia', 'Introduction to Ethiopia', 1),
('ethiopia_2', 'ethiopia', 'Ethiopian History', 2),
('ethiopia_3', 'ethiopia', 'Ethiopian Culture', 3),
('ethiopia_4', 'ethiopia', 'Ethiopian Language', 4),
('ethiopia_5', 'ethiopia', 'Ethiopian Geography', 5),
('ethiopia_6', 'ethiopia', 'Modern Ethiopia', 6),

-- Mathematics chapters
('math_1', 'mathematics', 'Basic Arithmetic', 1),
('math_2', 'mathematics', 'Algebra Fundamentals', 2),
('math_3', 'mathematics', 'Geometry Basics', 3),
('math_4', 'mathematics', 'Trigonometry', 4),
('math_5', 'mathematics', 'Calculus Introduction', 5),
('math_6', 'mathematics', 'Statistics and Probability', 6),

-- Science chapters
('science_1', 'science', 'Physics Basics', 1),
('science_2', 'science', 'Chemistry Fundamentals', 2),
('science_3', 'science', 'Biology Introduction', 3),
('science_4', 'science', 'Earth Science', 4),
('science_5', 'science', 'Environmental Science', 5),
('science_6', 'science', 'Scientific Method', 6),

-- Language chapters
('language_1', 'language', 'Grammar Basics', 1),
('language_2', 'language', 'Vocabulary Building', 2),
('language_3', 'language', 'Reading Comprehension', 3),
('language_4', 'language', 'Writing Skills', 4),
('language_5', 'language', 'Speaking Practice', 5),
('language_6', 'language', 'Advanced Communication', 6),

-- History chapters
('history_1', 'history', 'Ancient History', 1),
('history_2', 'history', 'Medieval Period', 2),
('history_3', 'history', 'Renaissance and Reformation', 3),
('history_4', 'history', 'Modern History', 4),
('history_5', 'history', 'World Wars', 5),
('history_6', 'history', 'Contemporary History', 6),

-- Geography chapters
('geo_1', 'geography', 'Physical Geography', 1),
('geo_2', 'geography', 'Human Geography', 2),
('geo_3', 'geography', 'Climate and Weather', 3),
('geo_4', 'geography', 'Natural Resources', 4),
('geo_5', 'geography', 'Population and Migration', 5),
('geo_6', 'geography', 'Global Issues', 6);

-- Insert default courses
INSERT INTO courses (id, title, description, content, price, subject_id, chapter_id) VALUES
('ethiopia_intro', 'Introduction to Ethiopia', 'Learn the basics about Ethiopia', 'Ethiopia is a country in the Horn of Africa...', 29.99, 'ethiopia', 'ethiopia_1'),
('math_basics', 'Basic Mathematics', 'Master fundamental math concepts', 'Mathematics is the study of numbers, shapes, and patterns...', 39.99, 'mathematics', 'math_1'),
('science_intro', 'Introduction to Science', 'Explore the world of science', 'Science is a systematic way of understanding the natural world...', 34.99, 'science', 'science_1');

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('site_title', 'Bright Fresh Learning', 'The main title of the learning platform'),
('site_description', 'Learn and grow with our comprehensive courses', 'Description of the learning platform'),
('default_currency', 'USD', 'Default currency for course pricing'),
('max_courses_per_subject', '50', 'Maximum number of courses allowed per subject'),
('token_expiry_hours', '24', 'Number of hours before course tokens expire');

-- =====================================================
-- STEP 9: VERIFICATION
-- =====================================================

-- Verify all tables exist
SELECT 'Tables created successfully:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify admin user
SELECT 'Admin user created:' as info, username, is_active FROM admin_users;

-- Verify subjects and chapters
SELECT 'Subjects created:' as info, COUNT(*) as count FROM subjects;
SELECT 'Chapters created:' as info, COUNT(*) as count FROM chapters;

-- Verify courses
SELECT 'Courses created:' as info, COUNT(*) as count FROM courses;

-- Verify functions
SELECT 'Functions created:' as info, COUNT(*) as count FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Final success message
SELECT '🎉 BULLETPROOF SETUP COMPLETED SUCCESSFULLY! 🎉' as final_status;
SELECT 'All tables, functions, policies, and data have been created.' as message;
SELECT 'Admin login: username=admin, password=admin321' as login_info;
