import { supabase } from "./supabase"

export interface Question {
  id: string
  exam_id: string
  question_text: string
  question_type: "multiple_choice" | "essay" | "true_false" | "fill_blank"
  options?: string[]
  correct_answer: string
  points: number
  order_number: number
  created_at: string
}

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_questions: number;
  exam_type: string;
  due_date: string;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
}

export async function createExam(examData: Partial<Exam>): Promise<Exam | null> {
  try {
    // Extraer solo los campos que existen en la tabla
    const validExamData = {
      course_id: examData.course_id,
      title: examData.title,
      description: examData.description,
      duration_minutes: examData.duration_minutes,
      total_questions: examData.total_questions,
      exam_type: examData.exam_type,
      due_date: examData.due_date,
      max_attempts: examData.max_attempts,
      is_active: examData.is_active !== undefined ? examData.is_active : true,
      // Incluir estos campos si existen en la tabla
      // Remove instructions field since it's not defined in Exam interface
      passing_score: (examData as any).passing_score,
      show_results: (examData as any).show_results,
      randomize_questions: (examData as any).randomize_questions,
      created_at: examData.created_at
    };

    const { data, error } = await supabase.from("exams").insert([validExamData]).select().single()

    if (error) throw error
    return data as Exam
  } catch (error) {
    console.error("Create exam error:", error)
    return null
  }
}

export async function updateExam(id: string, examData: Partial<Exam>): Promise<Exam | null> {
  try {
    // Filtrar solo los campos válidos que existen en la tabla
    const validFields = [
      "course_id", "title", "description", "duration_minutes",
      "total_questions", "exam_type", "due_date", "max_attempts", "is_active"
    ];

    const validExamData: Record<string, any> = {};
    for (const field of validFields) {
      if (field in examData) {
        validExamData[field] = (examData as any)[field];
      }
    }

    const { data, error } = await supabase.from("exams").update(validExamData).eq("id", id).select().single()

    if (error) throw error
    return data as Exam
  } catch (error) {
    console.error("Update exam error:", error)
    return null
  }
}

export async function getExamsByTeacher(teacherId: string): Promise<Exam[]> {
  try {
    // Primero obtenemos los cursos del profesor
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("is_active", true);

    if (coursesError) throw coursesError;

    if (!courses || courses.length === 0) {
      return [];
    }

    // Obtenemos los IDs de los cursos
    const courseIds = courses.map(course => course.id);

    // Ahora obtenemos los exámenes relacionados con esos cursos
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .in("course_id", courseIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Exam[];
  } catch (error) {
    console.error("Get exams error:", error);
    return [];
  }
}

export async function getExamQuestions(examId: string): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_number", { ascending: true })

    if (error) throw error
    return data as Question[]
  } catch (error) {
    console.error("Get questions error:", error)
    return []
  }
}

export async function createQuestion(questionData: Omit<Question, "id" | "created_at">): Promise<Question | null> {
  try {
    const { data, error } = await supabase.from("questions").insert([questionData]).select().single()

    if (error) throw error
    return data as Question
  } catch (error) {
    console.error("Create question error:", error)
    return null
  }
}

export async function updateQuestion(id: string, questionData: Partial<Question>): Promise<Question | null> {
  try {
    const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single()

    if (error) throw error
    return data as Question
  } catch (error) {
    console.error("Update question error:", error)
    return null
  }
}

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("questions").delete().eq("id", id)
    return !error
  } catch (error) {
    console.error("Delete question error:", error)
    return false
  }
}

/**
 * Obtiene los exámenes programados para un estudiante específico.
 * @param studentId El ID del estudiante.
 * @returns {Promise<Exam[]>} Una lista de exámenes programados para el estudiante.
 */
export async function getStudentExams(studentId: string): Promise<Exam[]> {
  try {
    // Primero obtenemos las inscripciones del estudiante con los datos del curso
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(`
        course_id,
        courses:course_id (id, name, level, language)
      `)
      .eq("student_id", studentId)

    if (enrollmentError) throw enrollmentError
    if (!enrollments || enrollments.length === 0) return []

    // Extraemos los IDs de los cursos
    const courseIds = enrollments.map(enrollment => enrollment.course_id)

    // Obtenemos los exámenes activos y sus calificaciones para estos cursos
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select(`
        *,
        courses:course_id (name, language, level),
        exam_submissions(score)
      `)
      .in("course_id", courseIds)
      .eq("is_active", true)
      .order("due_date", { ascending: true })

    if (examsError) throw examsError
    return exams || []
  } catch (error) {
    console.error("Error getting student exams:", error)
    return []
  }
}

/**
 * Envía los datos del examen completado por el estudiante al profesor
 * @param examSubmissionData Los datos del examen completado
 * @returns {Promise<boolean>} True si el envío fue exitoso
 */
export async function submitExamWithMonitoring(examSubmissionData: {
  exam_id: string;
  student_id: string;
  answers: Record<number, string>;
  time_spent: number;
  warnings: string[];
  recording_url?: string;
  screen_captures?: string[];
}): Promise<boolean> {
  try {
    // Insertar los datos del examen en la tabla exam_submissions
    const { error } = await supabase.from("exam_submissions").insert([{
      exam_id: examSubmissionData.exam_id,
      student_id: examSubmissionData.student_id,
      answers: examSubmissionData.answers,
      time_spent: examSubmissionData.time_spent,
      warnings: examSubmissionData.warnings,
      recording_url: examSubmissionData.recording_url,
      screen_captures: examSubmissionData.screen_captures,
      submitted_at: new Date().toISOString()
    }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error submitting exam:", error);
    return false;
  }
}

/**
 * Elimina un examen por su ID
 * @param id El ID del examen a eliminar
 * @returns {Promise<boolean>} True si la eliminación fue exitosa
 */
export async function deleteExam(id: string): Promise<boolean> {
  try {
    // First delete all questions associated with the exam
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("exam_id", id);

    if (questionsError) throw questionsError;

    // Then delete all submissions associated with the exam
    const { error: submissionsError } = await supabase
      .from("exam_submissions")
      .delete()
      .eq("exam_id", id);

    if (submissionsError) throw submissionsError;

    // Finally delete the exam itself
    const { error: examError } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    if (examError) throw examError;

    return true;
  } catch (error) {
    console.error("Delete exam error:", error);
    return false;
  }
}

/**
 * Obtiene las entregas de un examen específico
 * @param examId El ID del examen
 * @returns {Promise<any[]>} Lista de entregas del examen
 */
export async function getExamSubmissions(examId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("exam_submissions")
      .select(`
        *,
        students:student_id (id, name, email)
      `)
      .eq("exam_id", examId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get exam submissions error:", error);
    return [];
  }
}

/**
 * Obtiene todos los exámenes asociados a un curso específico
 * @param courseId El ID del curso
 * @returns {Promise<Exam[]>} Lista de exámenes del curso
 */
export async function getExamsByCourse(courseId: string): Promise<Exam[]> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("course_id", courseId);

    if (error) throw error;
    return data as Exam[];
  } catch (error) {
    console.error("Get exams by course error:", error);
    return [];
  }
}

/**
 * Elimina todos los exámenes asociados a un curso específico
 * @param courseId El ID del curso
 * @returns {Promise<boolean>} True si la eliminación fue exitosa
 */
export async function removeExamsForCourse(courseId: string): Promise<boolean> {
  try {
    // Obtener IDs de exámenes del curso
    const { data: exams, error: fetchError } = await supabase
      .from("exams")
      .select("id")
      .eq("course_id", courseId);

    if (fetchError) throw fetchError;

    const examIds = (exams || []).map((e: { id: string }) => e.id);
    if (examIds.length === 0) return true;

    // Borrar dependencias: envíos, intentos y preguntas
    const { error: submissionsError } = await supabase
      .from("exam_submissions")
      .delete()
      .in("exam_id", examIds);
    if (submissionsError) throw submissionsError;

    const { error: attemptsError } = await supabase
      .from("exam_attempts")
      .delete()
      .in("exam_id", examIds);
    if (attemptsError) throw attemptsError;

    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .in("exam_id", examIds);
    if (questionsError) throw questionsError;

    // Borrar los exámenes
    const { error: examsDeleteError } = await supabase
      .from("exams")
      .delete()
      .in("id", examIds);
    if (examsDeleteError) throw examsDeleteError;

    return true;
  } catch (error) {
    console.error("Remove exams for course error:", error);
    return false;
  }
}

// Add this function at the end of the file

/**
 * Actualiza la calificación de una entrega de examen
 * @param submissionId El ID de la entrega
 * @param score La calificación asignada
 * @returns {Promise<boolean>} True si la actualización fue exitosa
 */
export async function updateSubmissionScore(submissionId: string, score: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("exam_submissions")
      .update({ score })
      .eq("id", submissionId);

    return !error;
  } catch (error) {
    console.error("Update submission score error:", error);
    return false;
  }
}
