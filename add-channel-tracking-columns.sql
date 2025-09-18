-- Add channel tracking columns to courses table
-- This script adds columns to track which channel a course was posted to

-- Add channel_type column to track which channel the course was posted to
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS channel_type TEXT;

-- Add last_posted_at column to track when the course was last posted
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS last_posted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when querying by channel type
CREATE INDEX IF NOT EXISTS idx_courses_channel_type ON courses(channel_type);

-- Add index for better performance when querying by last posted date
CREATE INDEX IF NOT EXISTS idx_courses_last_posted_at ON courses(last_posted_at);

-- Add comment to document the new columns
COMMENT ON COLUMN courses.channel_type IS 'Channel type where the course was posted (brightfresh or brighttrial)';
COMMENT ON COLUMN courses.last_posted_at IS 'Timestamp when the course was last posted to a channel';
