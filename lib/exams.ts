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
      instructions: examData.instructions,
      passing_score: examData.passing_score,
      show_results: examData.show_results,
      randomize_questions: examData.randomize_questions,
      created_by: examData.created_by
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
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        courses (id),
        student_id
      `)
      .eq("student_id", studentId)

    if (error) throw error

    if (!data || data.length === 0) return []

    // Extraer los IDs de los cursos en los que está inscrito el estudiante
    const courseIds = data.map(enrollment => {
      const course = enrollment.courses as unknown as { id: string };
      if (!course || typeof course.id !== 'string') {
        throw new Error('Invalid course data structure');
      }
      return course.id;
    })

    // Obtener los exámenes asociados a esos cursos que aún no han vencido
    const currentDate = new Date().toISOString()
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select(`
        *,
        courses:course_id (name, language, level)
      `)
      .in("course_id", courseIds)
      .gt("due_date", currentDate) // Solo exámenes futuros
      .eq("is_active", true)
      .order("due_date", { ascending: true })

    if (examsError) throw examsError

    return exams || []
  } catch (error) {
    console.error("Error fetching student exams:", error)
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
    // Primero eliminamos todas las preguntas asociadas al examen
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("exam_id", id);
    
    if (questionsError) throw questionsError;
    
    // Luego eliminamos el examen
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);
    
    return !error;
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
        students:student_id (id, first_name, last_name, email)
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
