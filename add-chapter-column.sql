-- Add chapter column to courses table
-- Run this in your Supabase SQL editor

-- First, check if the column already exists
DO $$ 
BEGIN
    -- Add chapter column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'chapter'
    ) THEN
        ALTER TABLE courses ADD COLUMN chapter TEXT;
        RAISE NOTICE 'Chapter column added to courses table';
    ELSE
        RAISE NOTICE 'Chapter column already exists in courses table';
    END IF;
END $$;

-- Update existing courses to have null chapter (they will appear in "Unassigned Courses")
UPDATE courses SET chapter = NULL WHERE chapter IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;
