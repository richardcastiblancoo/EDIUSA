-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'teacher', 'student', 'assistant')),
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



----------  reporte 
create table attendance (
    id uuid primary key,
    enrollment_id uuid references enrollments(id),
    lesson_id uuid references lessons(id),
    status varchar(20), -- 'Presente', 'Ausente', 'Tarde'
    created_at timestamp with time zone default timezone('utc'::text, now())
);


create table grades (
    id uuid primary key,
    enrollment_id uuid references enrollments(id),
    lesson_id uuid references lessons(id),
    score numeric(5,2), -- Nota del estudiante
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

------------------- pqr

-- Crear tabla de PQR
CREATE TABLE IF NOT EXISTS pqrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  student_id UUID REFERENCES users(id),
  teacher_id UUID REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  teacher_response TEXT,
  coordinator_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS pqrs_course_id_idx ON pqrs(course_id);
CREATE INDEX IF NOT EXISTS pqrs_student_id_idx ON pqrs(student_id);
CREATE INDEX IF NOT EXISTS pqrs_teacher_id_idx ON pqrs(teacher_id);
CREATE INDEX IF NOT EXISTS pqrs_status_idx ON pqrs(status);


-----------------------
-- Crear tabla para almacenar información de imágenes de usuario
CREATE TABLE IF NOT EXISTS user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  image_type VARCHAR(50) CHECK (image_type IN ('avatar', 'logo', 'banner')),
  image_url TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_images_user ON user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_type ON user_images(image_type);
CREATE INDEX IF NOT EXISTS idx_user_images_active ON user_images(is_active);

--------------------
ALTER TABLE exams ADD COLUMN created_by UUID REFERENCES users(id);

ALTER TABLE exams 
  ADD COLUMN instructions TEXT,
  ADD COLUMN passing_score INTEGER DEFAULT 70,
  ADD COLUMN show_results BOOLEAN DEFAULT true,
  ADD COLUMN randomize_questions BOOLEAN DEFAULT false;

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

--------------------
CREATE TABLE exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) NOT NULL,
  student_id UUID REFERENCES users(id) NOT NULL,
  answers JSONB NOT NULL,
  time_spent INTEGER NOT NULL,
  warnings TEXT[] DEFAULT '{}',
  recording_url TEXT,
  screen_captures TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded BOOLEAN DEFAULT FALSE,
  score NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMP WITH TIME ZONE
);

-----------
ALTER TABLE lessons ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

-- Agregar columna status con restricción de valores
ALTER TABLE lessons ADD COLUMN status VARCHAR(50) CHECK (status IN ('active', 'draft', 'completed'));

-- Agregar columna teacher_id con referencia a la tabla users
ALTER TABLE lessons ADD COLUMN teacher_id UUID REFERENCES users(id);


-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);

----------
ALTER TABLE lessons
ADD COLUMN attachments TEXT[],
ADD COLUMN audio_url TEXT;

-- Política para permitir lectura pública
CREATE POLICY "Archivos accesibles públicamente" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('attachments', 'audio'));

-- Política para permitir subida de archivos a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir archivos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('attachments', 'audio'));

-- Ejecutar en el SQL Editor de Supabase
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);



---examen pantalla
-- Create the exam-recordings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-recordings', 'exam-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload exam recordings
CREATE POLICY "Usuarios autenticados pueden subir grabaciones de exámenes" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'exam-recordings' AND 
  auth.uid() = (SPLIT_PART(name, '_', 3))::uuid
);

-- Policy to allow authenticated users to read their own recordings
CREATE POLICY "Usuarios pueden ver sus propias grabaciones" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'exam-recordings' AND 
  auth.uid() = (SPLIT_PART(name, '_', 3))::uuid
);

-- Policy to allow teachers and coordinators to access all recordings
CREATE POLICY "Profesores y coordinadores pueden acceder a todas las grabaciones" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'exam-recordings' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'coordinator')
  )
);