-- Update courses table with more fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(20) UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 25;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0;

-- Create schedules table for class schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teacher_languages table for languages each teacher can teach
CREATE TABLE IF NOT EXISTS teacher_languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN ('native', 'advanced', 'intermediate')),
  certification VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, language)
);

-- Create course_assignments table for tracking course assignments
CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id), -- coordinator who made the assignment
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  UNIQUE(course_id, teacher_id)
);

-- Create reports table for system reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('enrollment', 'grades', 'attendance', 'teacher_performance', 'course_completion')),
  generated_by UUID REFERENCES users(id),
  parameters JSONB,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create attendance table for tracking class attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  class_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, class_date)
);

-- Update enrollments table with more fields
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES users(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_time ON schedules(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_teacher_languages_teacher ON teacher_languages(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_teacher ON course_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_attendance_student_course ON attendance(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(class_date);
