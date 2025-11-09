import { supabase } from "./supabase";

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: "multiple_choice" | "essay" | "true_false" | "fill_blank";
  options?: string[];
  correct_answer: string;
  points: number;
  order_number: number;
  created_at: string;
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
  passing_score?: number;
  show_results?: boolean;
  randomize_questions?: boolean;
}

/**
 * Crea un nuevo examen.
 * @param examData Datos del examen a crear.
 * @returns El examen creado o null.
 */

export async function createExam(
  examData: Partial<Exam>
): Promise<Exam | null> {
  try {
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
      passing_score: examData.passing_score,
      show_results: examData.show_results,
      randomize_questions: examData.randomize_questions,
    };
    const { data, error } = await supabase
      .from("exams")
      .insert([validExamData])
      .select()
      .single();
    if (error) throw error;
    return data as Exam;
  } catch (error) {
    console.error("Create exam error:", error);
    return null;
  }
}

/**
 * Actualiza un examen existente.
 * @param id ID del examen.
 * @param examData Datos a actualizar.
 * @returns El examen actualizado o null.
 */

export async function updateExam(
  id: string,
  examData: Partial<Exam>
): Promise<Exam | null> {
  try {
    const updateData: Partial<Exam> = {};
    Object.keys(examData).forEach((key) => {
      if (examData[key as keyof Partial<Exam>] !== undefined) {
        const value = examData[key as keyof Partial<Exam>];
        if (value !== undefined) {
          (updateData as any)[key] = value;
        }
      }
    });

    const { data, error } = await supabase
      .from("exams")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Exam;
  } catch (error) {
    console.error("Update exam error:", error);
    return null;
  }
}

/**
 * Obtiene los exámenes asociados a los cursos de un profesor.
 * @param teacherId El ID del profesor.
 * @returns Una lista de exámenes.
 */

export async function getExamsByTeacher(teacherId: string): Promise<Exam[]> {
  try {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("is_active", true);
    if (coursesError) throw coursesError;
    if (!courses || courses.length === 0) {
      return [];
    }
    const courseIds = courses.map((course) => course.id);
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

/**
 * Obtiene todos los exámenes asociados a un curso específico.
 * @param courseId El ID del curso.
 * @returns Lista de exámenes del curso.
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
 * Elimina un examen por su ID (incluyendo dependencias: preguntas y envíos).
 * @param id El ID del examen a eliminar.
 * @returns True si la eliminación fue exitosa.
 */

export async function deleteExam(id: string): Promise<boolean> {
  try {
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("exam_id", id);
    if (questionsError) throw questionsError;
    const { error: submissionsError } = await supabase
      .from("exam_submissions")
      .delete()
      .eq("exam_id", id);
    if (submissionsError) throw submissionsError;
    const { error: attemptsError } = await supabase
      .from("exam_attempts")
      .delete()
      .eq("exam_id", id);
    if (attemptsError) throw attemptsError;
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
 * Elimina todos los exámenes asociados a un curso específico.
 * @param courseId El ID del curso.
 * @returns True si la eliminación fue exitosa.
 */

export async function removeExamsForCourse(courseId: string): Promise<boolean> {
  try {
    const { data: exams, error: fetchError } = await supabase
      .from("exams")
      .select("id")
      .eq("course_id", courseId);
    if (fetchError) throw fetchError;
    const examIds = (exams || []).map((e: { id: string }) => e.id);
    if (examIds.length === 0) return true;
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

/**
 * Obtiene las preguntas de un examen específico.
 * @param examId ID del examen.
 * @returns Lista de preguntas.
 */

export async function getExamQuestions(examId: string): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_number", { ascending: true });
    if (error) throw error;
    return data as Question[];
  } catch (error) {
    console.error("Get questions error:", error);
    return [];
  }
}

/**
 * Crea una nueva pregunta para un examen.
 * @param questionData Datos de la pregunta.
 * @returns La pregunta creada o null.
 */

export async function createQuestion(
  questionData: Omit<Question, "id" | "created_at">
): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .insert([questionData])
      .select()
      .single();

    if (error) throw error;
    return data as Question;
  } catch (error) {
    console.error("Create question error:", error);
    return null;
  }
}

/**
 * Actualiza una pregunta existente.
 * @param id ID de la pregunta.
 * @param questionData Datos a actualizar.
 * @returns La pregunta actualizada o null.
 */

export async function updateQuestion(
  id: string,
  questionData: Partial<Question>
): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .update(questionData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Question;
  } catch (error) {
    console.error("Update question error:", error);
    return null;
  }
}

/**
 * Elimina una pregunta.
 * @param id ID de la pregunta.
 * @returns True si fue exitoso.
 */

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    return !error;
  } catch (error) {
    console.error("Delete question error:", error);
    return false;
  }
}

/**
 * Obtiene los exámenes programados para un estudiante específico.
 * @param studentId El ID del estudiante.
 * @returns Una lista de exámenes programados.
 */

export async function getStudentExams(studentId: string): Promise<Exam[]> {
  try {
    // Obtener los cursos del estudiante
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        `
        course_id,
        courses:course_id (id, name, level, language)
        `
      )
      .eq("student_id", studentId);
    if (enrollmentError) throw enrollmentError;
    if (!enrollments || enrollments.length === 0) return []; // Extraemos los IDs de los cursos
    const courseIds = enrollments.map(
      (enrollment) => (enrollment as any).course_id
    ); 
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select(
        `
        *,
        courses:course_id (name, language, level),
        exam_submissions(score)
        `
      )
      .in("course_id", courseIds)
      .eq("is_active", true)
      .order("due_date", { ascending: true });
    if (examsError) throw examsError;
    return (exams as unknown as Exam[]) || [];
  } catch (error) {
    console.error("Error getting student exams:", error);
    return [];
  }
}

/**
 * Envía los datos del examen completado por el estudiante (con datos de monitoreo).
 * @param examSubmissionData Los datos del examen completado.
 * @returns True si el envío fue exitoso.
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
    const { error } = await supabase.from("exam_submissions").insert([
      {
        exam_id: examSubmissionData.exam_id,
        student_id: examSubmissionData.student_id,
        answers: examSubmissionData.answers,
        time_spent: examSubmissionData.time_spent,
        warnings: examSubmissionData.warnings,
        recording_url: examSubmissionData.recording_url,
        screen_captures: examSubmissionData.screen_captures,
        submitted_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error submitting exam:", error);
    return false;
  }
}

/**
 * Obtiene las entregas de un examen específico.
 * @param examId El ID del examen.
 * @returns Lista de entregas del examen.
 */

export async function getExamSubmissions(examId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("exam_submissions")
      .select(
        `
        *,
        students:student_id (id, name, email)
        `
      )
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
 * Actualiza la calificación de una entrega de examen
 * @param submissionId El ID de la entrega
 * @param score La calificación asignada
 * @returns True si la actualización fue exitosa
 */

export async function updateSubmissionScore(
  submissionId: string,
  score: number
): Promise<boolean> {
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
