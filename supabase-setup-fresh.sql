-- Fresh Supabase Database Setup Script
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tokens table
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create admin table
CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_channel_member BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_tokens_course_id ON tokens(course_id);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for courses table
CREATE POLICY "Courses are viewable by everyone" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert courses" ON courses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update courses" ON courses
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete courses" ON courses
    FOR DELETE USING (true);

-- Create policies for tokens table
CREATE POLICY "Tokens are viewable by everyone" ON tokens
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert tokens" ON tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update tokens" ON tokens
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete tokens" ON tokens
    FOR DELETE USING (true);

-- Create policies for admin table (restrict access)
CREATE POLICY "Admin table is restricted" ON admin
    FOR ALL USING (false);

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true);

-- Create storage policies for course images
CREATE POLICY "Course images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'course-images');

CREATE POLICY "Anyone can upload course images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Anyone can update course images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'course-images');

CREATE POLICY "Anyone can delete course images" ON storage.objects
    FOR DELETE USING (bucket_id = 'course-images');

-- Insert default admin user (password: admin123)
INSERT INTO admin (username, password_hash) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database setup completed successfully!' as message;
