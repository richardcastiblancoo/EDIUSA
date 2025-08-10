-- Clean existing course data
DELETE FROM course_enrollments;
DELETE FROM courses;

-- Insert sample courses data
INSERT INTO courses (id, name, description, language, level, duration_weeks, hours_per_week, max_students, price, schedule, start_date, end_date, created_at, updated_at) VALUES
('1', 'Inglés Básico A1', 'Curso introductorio de inglés para principiantes absolutos', 'Inglés', 'A1', 12, 4, 20, 450000, 'Lunes y Miércoles 6:00-8:00 PM', '2024-02-01', '2024-04-24', NOW(), NOW()),
('2', 'Inglés Elemental A2', 'Continuación del nivel básico con mayor vocabulario y gramática', 'Inglés', 'A2', 12, 4, 18, 480000, 'Martes y Jueves 6:00-8:00 PM', '2024-02-01', '2024-04-25', NOW(), NOW()),
('3', 'Inglés Intermedio B1', 'Desarrollo de habilidades conversacionales y comprensión lectora', 'Inglés', 'B1', 16, 4, 16, 520000, 'Lunes y Miércoles 7:00-9:00 PM', '2024-02-05', '2024-05-27', NOW(), NOW()),
('4', 'Inglés Intermedio Alto B2', 'Perfeccionamiento de la comunicación oral y escrita', 'Inglés', 'B2', 16, 4, 15, 550000, 'Martes y Jueves 7:00-9:00 PM', '2024-02-06', '2024-05-28', NOW(), NOW()),
('5', 'Inglés Avanzado C1', 'Dominio avanzado del idioma para contextos académicos y profesionales', 'Inglés', 'C1', 20, 4, 12, 600000, 'Lunes y Miércoles 8:00-10:00 PM', '2024-02-05', '2024-06-24', NOW(), NOW()),
('6', 'Francés Básico A1', 'Introducción al francés: pronunciación, vocabulario básico y gramática elemental', 'Francés', 'A1', 12, 3, 15, 420000, 'Sábados 9:00-12:00 PM', '2024-02-03', '2024-04-20', NOW(), NOW()),
('7', 'Alemán Básico A1', 'Fundamentos del alemán: alfabeto, números, saludos y expresiones básicas', 'Alemán', 'A1', 14, 3, 12, 480000, 'Viernes 6:00-9:00 PM', '2024-02-02', '2024-05-03', NOW(), NOW()),
('8', 'Italiano Básico A1', 'Primeros pasos en italiano: cultura, pronunciación y conversación básica', 'Italiano', 'A1', 10, 3, 14, 400000, 'Sábados 2:00-5:00 PM', '2024-02-03', '2024-04-06', NOW(), NOW()),
('9', 'Portugués Básico A1', 'Introducción al portugués brasileño: fonética, vocabulario y gramática básica', 'Portugués', 'A1', 12, 2, 16, 350000, 'Domingos 10:00-12:00 PM', '2024-02-04', '2024-04-21', NOW(), NOW()),
('10', 'Mandarín Básico A1', 'Iniciación al mandarín: caracteres básicos, tonos y conversación elemental', 'Mandarín', 'A1', 16, 3, 10, 550000, 'Sábados 4:00-7:00 PM', '2024-02-03', '2024-05-18', NOW(), NOW());

-- Update existing courses with course codes
UPDATE courses SET 
course_code = CASE 
  WHEN name LIKE '%Inglés Básico%' THEN 'ENG-A1-001'
  WHEN name LIKE '%Inglés Elemental%' THEN 'ENG-A2-001'
  WHEN name LIKE '%Inglés Intermedio%' THEN 'ENG-B1-001'
  WHEN name LIKE '%Inglés Intermedio Alto%' THEN 'ENG-B2-001'
  WHEN name LIKE '%Inglés Avanzado%' THEN 'ENG-C1-001'
  WHEN name LIKE '%Francés Básico%' THEN 'FRA-A1-001'
  WHEN name LIKE '%Alemán Básico%' THEN 'GER-A1-001'
  WHEN name LIKE '%Italiano Básico%' THEN 'ITA-A1-001'
  WHEN name LIKE '%Portugués Básico%' THEN 'POR-A1-001'
  WHEN name LIKE '%Mandarín Básico%' THEN 'MND-A1-001'
  ELSE 'GEN-' || SUBSTRING(MD5(name), 1, 6)
END,
capacity = max_students,
credits = 3
WHERE course_code IS NULL;

-- Insert teacher languages for existing teachers
INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Inglés',
'advanced',
'TESOL Certified'
FROM users u 
WHERE u.email = 'profesor@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Alemán',
'advanced',
'DAAD Certified'
FROM users u 
WHERE u.email = 'hans.muller@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Italiano',
'advanced',
'DPI Certified'
FROM users u 
WHERE u.email = 'giuseppe.rossi@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Portugués',
'advanced',
'CNPq Certified'
FROM users u 
WHERE u.email = 'maria.silva@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Francés',
'advanced',
'DELF Certified'
FROM users u 
WHERE u.email = 'francisca.garcia@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

INSERT INTO teacher_languages (teacher_id, language, proficiency_level, certification)
SELECT 
u.id,
'Mandarín',
'advanced',
'HSK Certified'
FROM users u 
WHERE u.email = 'mandarin.teacher@usa.edu.co' AND u.role = 'teacher'
ON CONFLICT (teacher_id, language) DO NOTHING;

-- Insert sample schedules
INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
1, -- Monday
'18:00:00',
'20:00:00',
'Aula 101'
FROM courses c 
WHERE c.course_code = 'ENG-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
3, -- Wednesday
'18:00:00',
'20:00:00',
'Aula 101'
FROM courses c 
WHERE c.course_code = 'ENG-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
5, -- Friday
'18:00:00',
'20:00:00',
'Aula 101'
FROM courses c 
WHERE c.course_code = 'ENG-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
2, -- Tuesday
'19:00:00',
'21:00:00',
'Aula 102'
FROM courses c 
WHERE c.course_code = 'ENG-A2-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
4, -- Thursday
'19:00:00',
'21:00:00',
'Aula 102'
FROM courses c 
WHERE c.course_code = 'ENG-A2-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
2, -- Tuesday
'19:00:00',
'21:00:00',
'Aula 103'
FROM courses c 
WHERE c.course_code = 'ENG-B1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
4, -- Thursday
'19:00:00',
'21:00:00',
'Aula 103'
FROM courses c 
WHERE c.course_code = 'ENG-B1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
1, -- Monday
'19:00:00',
'21:00:00',
'Aula 104'
FROM courses c 
WHERE c.course_code = 'ENG-B2-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
3, -- Wednesday
'19:00:00',
'21:00:00',
'Aula 104'
FROM courses c 
WHERE c.course_code = 'ENG-B2-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
5, -- Friday
'19:00:00',
'21:00:00',
'Aula 104'
FROM courses c 
WHERE c.course_code = 'ENG-C1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
6, -- Saturday
'09:00:00',
'12:00:00',
'Aula 105'
FROM courses c 
WHERE c.course_code = 'FRA-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
6, -- Saturday
'09:00:00',
'12:00:00',
'Aula 106'
FROM courses c 
WHERE c.course_code = 'GER-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
6, -- Saturday
'14:00:00',
'17:00:00',
'Aula 107'
FROM courses c 
WHERE c.course_code = 'ITA-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
7, -- Sunday
'10:00:00',
'12:00:00',
'Aula 108'
FROM courses c 
WHERE c.course_code = 'POR-A1-001'
ON CONFLICT DO NOTHING;

INSERT INTO schedules (course_id, day_of_week, start_time, end_time, classroom)
SELECT 
c.id,
6, -- Saturday
'16:00:00',
'19:00:00',
'Aula 109'
FROM courses c 
WHERE c.course_code = 'MND-A1-001'
ON CONFLICT DO NOTHING;

-- Insert course assignments
INSERT INTO course_assignments (course_id, teacher_id, assigned_by, notes)
SELECT 
c.id,
c.teacher_id,
coord.id,
'Asignación inicial del sistema'
FROM courses c
JOIN users coord ON coord.role = 'coordinator'
WHERE c.teacher_id IS NOT NULL
ON CONFLICT (course_id, teacher_id) DO NOTHING;

-- Insert sample enrollments
INSERT INTO enrollments (student_id, course_id, enrolled_by, status, progress_percentage)
SELECT 
s.id,
c.id,
coord.id,
'active',
RANDOM() * 100
FROM users s
CROSS JOIN courses c
JOIN users coord ON coord.role = 'coordinator'
WHERE s.role = 'student' 
AND s.email IN ('estudiante@usa.edu.co', 'juan.perez@usa.edu.co')
LIMIT 4
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Update enrolled_count in courses
UPDATE courses SET enrolled_count = (
SELECT COUNT(*) 
FROM enrollments e 
WHERE e.course_id = courses.id AND e.status = 'active'
);
