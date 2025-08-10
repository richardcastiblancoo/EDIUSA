-- Create questions table for exam questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'essay', 'true_false', 'fill_blank')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT,
  points DECIMAL(4,2) DEFAULT 1.0,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_images table for profile pictures and system images
CREATE TABLE IF NOT EXISTS user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('avatar', 'logo', 'banner')),
  image_url VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Update exams table to include more fields for teacher management
ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_score DECIMAL(4,2) DEFAULT 60.0;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(exam_id, order_number);
CREATE INDEX IF NOT EXISTS idx_user_images_user ON user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_type ON user_images(image_type);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
