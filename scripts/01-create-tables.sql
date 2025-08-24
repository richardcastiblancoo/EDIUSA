-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'teacher', 'student')),
  phone VARCHAR(20),
  document_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,
  teacher_id UUID REFERENCES users(id),
  max_students INTEGER DEFAULT 25,
  start_date DATE,
  end_date DATE,
  schedule VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  final_grade DECIMAL(3,2),
  UNIQUE(student_id, course_id)
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  exam_type VARCHAR(50) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  max_attempts INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES users(id),
  attempt_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  answers JSONB,
  warnings JSONB,
  recording_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);

-------
ALTER TABLE users ADD COLUMN english_level TEXT;

------
ALTER TABLE public.users ADD COLUMN academic_level TEXT;

-- Añade la columna 'cohort'
ALTER TABLE public.users ADD COLUMN cohort TEXT;

-- Añade la columna 'status' con valores específicos
ALTER TABLE public.users ADD COLUMN status TEXT CHECK (status IN ('active', 'inactive', 'graduado', 'egresado'));

-----
ALTER TABLE public.users ADD COLUMN photo TEXT;


----------------------------
-- Creación de la tabla de lecciones
-- Esta tabla se usa para estructurar el contenido de cada curso.
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT, -- Aquí puedes almacenar el contenido de la lección (texto, Markdown, etc.)
  order_index INTEGER NOT NULL, -- Para controlar el orden de las lecciones dentro de un curso
  media_url VARCHAR(500), -- URL a un video, archivo, etc.
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creación de un índice para mejorar la consulta de lecciones por curso.
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

-- Creación de la tabla de recursos de lecciones (opcional, para archivos adjuntos, etc.)
CREATE TABLE IF NOT EXISTS lesson_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id),
    resource_type VARCHAR(50) NOT NULL,
    resource_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creación de un índice para los recursos de lecciones.
CREATE INDEX IF NOT EXISTS idx_resources_lesson ON lesson_resources(lesson_id);

-----
ALTER TABLE courses
ADD COLUMN code TEXT;