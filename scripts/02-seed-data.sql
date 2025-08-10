-- Insert default coordinator
INSERT INTO users (email, password, name, role, phone, document_number) VALUES
('coordinador@usa.edu.co', '123456', 'cristian', 'coordinator', '+57 300 123 4567', '12345678')
ON CONFLICT (email) DO NOTHING;

-- Insert sample teachers
INSERT INTO users (email, password, name, role, phone, document_number) VALUES
('profesor@usa.edu.co', '123456', 'Carlos Rodríguez', 'teacher', '+57 301 234 5678', '23456789'),
('maria.lopez@usa.edu.co', '123456', 'María López', 'teacher', '+57 302 345 6789', '34567890'),
('john.smith@usa.edu.co', '123456', 'John Smith', 'teacher', '+57 303 456 7890', '45678901')
ON CONFLICT (email) DO NOTHING;

-- Insert sample students
INSERT INTO users (email, password, name, role, phone, document_number) VALUES
('estudiante@usa.edu.co', '123456', 'María López Estudiante', 'student', '+57 304 567 8901', '56789012'),
('juan.perez@usa.edu.co', '123456', 'Juan Pérez', 'student', '+57 305 678 9012', '67890123'),
('sofia.martinez@usa.edu.co', '123456', 'Sofía Martínez', 'student', '+57 306 789 0123', '78901234'),
('diego.rodriguez@usa.edu.co', '123456', 'Diego Rodríguez', 'student', '+57 307 890 1234', '89012345')
ON CONFLICT (email) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (name, description, language, level, teacher_id, max_students, start_date, end_date, schedule) 
SELECT 
  'Inglés Básico A1',
  'Curso introductorio de inglés para principiantes',
  'Inglés',
  'Básico',
  u.id,
  25,
  '2024-02-01',
  '2024-06-30',
  'Lunes, Miércoles, Viernes 8:00-10:00'
FROM users u WHERE u.email = 'profesor@usa.edu.co'
ON CONFLICT DO NOTHING;

INSERT INTO courses (name, description, language, level, teacher_id, max_students, start_date, end_date, schedule) 
SELECT 
  'Francés Intermedio B1',
  'Curso de francés nivel intermedio',
  'Francés',
  'Intermedio',
  u.id,
  20,
  '2024-02-01',
  '2024-06-30',
  'Martes, Jueves 14:00-16:00'
FROM users u WHERE u.email = 'maria.lopez@usa.edu.co'
ON CONFLICT DO NOTHING;
