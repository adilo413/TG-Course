-- Supabase Subjects and Chapters Tables Setup
-- Run this in your Supabase SQL Editor

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(subject_id, number);
CREATE INDEX IF NOT EXISTS idx_chapters_active ON chapters(is_active);

-- 4. Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for subjects table
DROP POLICY IF EXISTS "Allow all operations on subjects" ON subjects;
CREATE POLICY "Allow all operations on subjects" ON subjects
    FOR ALL USING (true);

-- 6. Create policies for chapters table
DROP POLICY IF EXISTS "Allow all operations on chapters" ON chapters;
CREATE POLICY "Allow all operations on chapters" ON chapters
    FOR ALL USING (true);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert default subjects with their chapters
INSERT INTO subjects (id, name, description, icon, color) VALUES
('amharic', 'Amharic', 'Learn Amharic language and literature', '📚', '#e74c3c'),
('english', 'English', 'Master the English language and literature', '🔤', '#3498db'),
('math', 'Math', 'Mathematical concepts and problem-solving', '🧮', '#f39c12'),
('science', 'Science', 'Explore the world of science and discovery', '🔬', '#2ecc71')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert default chapters for each subject
INSERT INTO chapters (id, subject_id, name, number) VALUES
-- Amharic chapters
('amharic_ch1', 'amharic', 'Chapter 1', 1),
('amharic_ch2', 'amharic', 'Chapter 2', 2),
('amharic_ch3', 'amharic', 'Chapter 3', 3),
('amharic_ch4', 'amharic', 'Chapter 4', 4),
('amharic_ch5', 'amharic', 'Chapter 5', 5),
('amharic_ch6', 'amharic', 'Chapter 6', 6),
-- English chapters
('english_ch1', 'english', 'Chapter 1', 1),
('english_ch2', 'english', 'Chapter 2', 2),
('english_ch3', 'english', 'Chapter 3', 3),
('english_ch4', 'english', 'Chapter 4', 4),
('english_ch5', 'english', 'Chapter 5', 5),
('english_ch6', 'english', 'Chapter 6', 6),
-- Math chapters
('math_ch1', 'math', 'Chapter 1', 1),
('math_ch2', 'math', 'Chapter 2', 2),
('math_ch3', 'math', 'Chapter 3', 3),
('math_ch4', 'math', 'Chapter 4', 4),
('math_ch5', 'math', 'Chapter 5', 5),
('math_ch6', 'math', 'Chapter 6', 6),
-- Science chapters
('science_ch1', 'science', 'Chapter 1', 1),
('science_ch2', 'science', 'Chapter 2', 2),
('science_ch3', 'science', 'Chapter 3', 3),
('science_ch4', 'science', 'Chapter 4', 4),
('science_ch5', 'science', 'Chapter 5', 5),
('science_ch6', 'science', 'Chapter 6', 6)
ON CONFLICT (id) DO NOTHING;

-- 11. Create function to get subjects with their chapters
CREATE OR REPLACE FUNCTION get_subjects_with_chapters()
RETURNS TABLE (
    subject_id TEXT,
    subject_name TEXT,
    subject_description TEXT,
    subject_icon TEXT,
    subject_color TEXT,
    subject_active BOOLEAN,
    subject_created_at TIMESTAMP WITH TIME ZONE,
    subject_updated_at TIMESTAMP WITH TIME ZONE,
    chapters JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.icon,
        s.color,
        s.is_active,
        s.created_at,
        s.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'number', c.number
                ) ORDER BY c.number
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'::jsonb
        ) as chapters
    FROM subjects s
    LEFT JOIN chapters c ON s.id = c.subject_id AND c.is_active = true
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.description, s.icon, s.color, s.is_active, s.created_at, s.updated_at
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to create subject with chapters
CREATE OR REPLACE FUNCTION create_subject_with_chapters(
    p_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_chapter_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    i INTEGER;
    chapter_id TEXT;
    chapter_name TEXT;
BEGIN
    -- Insert the subject
    INSERT INTO subjects (id, name, description, icon, color)
    VALUES (p_id, p_name, p_description, p_icon, p_color);
    
    -- Insert chapters
    FOR i IN 1..p_chapter_count LOOP
        chapter_id := p_id || '_ch' || i;
        chapter_name := 'Chapter ' || i;
        
        INSERT INTO chapters (id, subject_id, name, number)
        VALUES (chapter_id, p_id, chapter_name, i);
    END LOOP;
    
    -- Return the created subject with chapters
    SELECT jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'icon', s.icon,
        'color', s.color,
        'chapters', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'number', c.number
                ) ORDER BY c.number
            ),
            '[]'::jsonb
        )
    )
    INTO result
    FROM subjects s
    LEFT JOIN chapters c ON s.id = c.subject_id
    WHERE s.id = p_id
    GROUP BY s.id, s.name, s.description, s.icon, s.color;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to update subject and regenerate chapters
CREATE OR REPLACE FUNCTION update_subject_with_chapters(
    p_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_icon TEXT,
    p_color TEXT,
    p_chapter_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    i INTEGER;
    chapter_id TEXT;
    chapter_name TEXT;
BEGIN
    -- Update the subject
    UPDATE subjects 
    SET name = p_name, description = p_description, icon = p_icon, color = p_color, updated_at = NOW()
    WHERE id = p_id;
    
    -- Delete existing chapters
    DELETE FROM chapters WHERE subject_id = p_id;
    
    -- Insert new chapters
    FOR i IN 1..p_chapter_count LOOP
        chapter_id := p_id || '_ch' || i;
        chapter_name := 'Chapter ' || i;
        
        INSERT INTO chapters (id, subject_id, name, number)
        VALUES (chapter_id, p_id, chapter_name, i);
    END LOOP;
    
    -- Return the updated subject with chapters
    SELECT jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'icon', s.icon,
        'color', s.color,
        'chapters', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'number', c.number
                ) ORDER BY c.number
            ),
            '[]'::jsonb
        )
    )
    INTO result
    FROM subjects s
    LEFT JOIN chapters c ON s.id = c.subject_id
    WHERE s.id = p_id
    GROUP BY s.id, s.name, s.description, s.icon, s.color;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Subjects and chapters tables created successfully!' as message;
