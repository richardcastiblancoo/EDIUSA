-- Insert sample exams created by teachers
INSERT INTO exams (course_id, title, description, duration_minutes, total_questions, exam_type, due_date, max_attempts, created_by, instructions, passing_score)
SELECT 
  c.id,
  'Examen Final - Inglés Básico',
  'Evaluación final del curso de inglés básico nivel A1',
  90,
  20,
  'mixed',
  '2024-06-15 10:00:00',
  2,
  u.id,
  'Lee cuidadosamente cada pregunta. Tienes 90 minutos para completar el examen. Se requiere 70% para aprobar.',
  70.0
FROM courses c
JOIN users u ON c.teacher_id = u.id
WHERE c.name = 'Inglés Básico A1'
ON CONFLICT DO NOTHING;

-- Insert sample questions for the exam
WITH exam_data AS (
  SELECT e.id as exam_id
  FROM exams e
  WHERE e.title = 'Examen Final - Inglés Básico'
  LIMIT 1
)
INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, points, order_number)
SELECT 
  exam_id,
  'What is the correct form of the verb "to be" for "I"?',
  'multiple_choice',
  '["am", "is", "are", "be"]'::jsonb,
  'am',
  1.0,
  1
FROM exam_data
UNION ALL
SELECT 
  exam_id,
  'Choose the correct article: "I have ___ apple"',
  'multiple_choice',
  '["a", "an", "the", "no article"]'::jsonb,
  'an',
  1.0,
  2
FROM exam_data
UNION ALL
SELECT 
  exam_id,
  'Write a short paragraph (50 words) describing your family using present simple tense.',
  'essay',
  NULL,
  '',
  5.0,
  3
FROM exam_data
ON CONFLICT DO NOTHING;
