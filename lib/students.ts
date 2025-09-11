import { supabase } from "@/lib/supabase";
import { getUserImage } from "@/lib/images";

// Definición de tipos para el estudiante, incluyendo campos de la tabla `users`
export type Student = {
  id: string;
  name: string;
  email: string;
  documentId: string;
  photoUrl: string;
};

// Define una estructura para los detalles del estudiante, incluyendo su curso y profesor
export type StudentDetails = {
  id: string;
  name: string;
  email: string;
  documentId: string;
  photoUrl: string;
  course: {
    name: string;
    teacher: {
      name: string;
    } | null;
  } | null;
};

// Definición de tipos para asistencia y notas
export type AttendanceStatus = "Presente" | "Ausente" | "Tarde";

export type AttendanceRecord = {
  id?: string;
  enrollment_id: string;
  lesson_id: string;
  status: AttendanceStatus;
  created_at?: string;
};

export type GradeRecord = {
  id?: string;
  enrollment_id: string;
  lesson_id: string;
  score: number;
  created_at?: string;
  updated_at?: string;
};

/**
 * Obtiene los estudiantes inscritos en un curso específico.
 * @param courseId El ID del curso.
 * @returns Una lista de objetos de estudiantes.
 */
export async function getStudentsForCourse(courseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*, users!inner(id, name, email, document_number, photo)")
    .eq("course_id", courseId);

  if (error) {
    console.error("Error al obtener estudiantes:", error);
    return [];
  }

  const studentsWithImages = await Promise.all(
    data.map(async (enrollment: any) => {
      const photoUrl = await getUserImage(enrollment.users.id, "avatar") ||
        enrollment.users.photo ||
        "/placeholder-user.jpg";

      return {
        id: enrollment.users.id,
        name: enrollment.users.name,
        email: enrollment.users.email,
        documentId: enrollment.users.document_number,
        photoUrl: photoUrl,
      };
    })
  );

  return studentsWithImages as Student[];
}

/**
 * Obtiene todos los estudiantes asignados a un profesor, incluyendo enrollmentId y courseId.
 * @param teacherId El ID del profesor.
 * @returns Una lista de estudiantes con sus cursos.
 */
export async function getStudentsForTeacher(teacherId: string): Promise<any[]> {
  try {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        course_id,
        users!inner(id, name, email, document_number, photo),
        courses!inner(teacher_id)
      `)
      .eq("courses.teacher_id", teacherId);

    if (error) throw error;

    // Eliminar duplicados y enriquecer con photoUrl
    const studentsMap = new Map();

    await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const studentId = enrollment.users.id;
        if (!studentsMap.has(studentId)) {
          const photoUrl = await getUserImage(studentId, "avatar") ||
            enrollment.users.photo ||
            "/placeholder-user.jpg";

          studentsMap.set(studentId, {
            id: studentId,
            enrollmentId: enrollment.id,
            name: enrollment.users.name,
            email: enrollment.users.email,
            documentId: enrollment.users.document_number,
            photoUrl: photoUrl,
            courseId: enrollment.course_id,
          });
        }
      })
    );

    return Array.from(studentsMap.values());
  } catch (error) {
    console.error("Error al obtener estudiantes para el profesor:", error);
    return [];
  }
}

/**
 * Registra la asistencia de un estudiante a una lección.
 * @param enrollmentId ID de la inscripción (relación estudiante-curso)
 * @param lessonId ID de la lección
 * @param status Estado de asistencia (Presente, Ausente, Tarde)
 * @returns El registro de asistencia creado o actualizado
 */
export async function registerAttendance(
  enrollmentId: string,
  lessonId: string,
  status: AttendanceStatus
): Promise<AttendanceRecord | null> {
  try {
    const { data: existingRecord } = await supabase
      .from("attendance")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .eq("lesson_id", lessonId)
      .maybeSingle(); // Cambiado a maybeSingle()

    let result;

    if (existingRecord) {
      const { data, error } = await supabase
        .from("attendance")
        .update({ status })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          status,
          id: crypto.randomUUID()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    return null;
  }
}

/**
 * Registra o actualiza la nota de un estudiante para una lección.
 * @param enrollmentId ID de la inscripción (relación estudiante-curso)
 * @param lessonId ID de la lección
 * @param score Calificación (0-100)
 * @returns El registro de nota creado o actualizado
 */
export async function registerGrade(
  enrollmentId: string,
  lessonId: string,
  score: number
): Promise<GradeRecord | null> {
  try {
    if (score < 0 || score > 100) {
      throw new Error("La calificación debe estar entre 0 y 100");
    }

    // Usamos maybeSingle() para evitar el error 406 si no existe el registro
    const { data: existingRecord } = await supabase
      .from("grades")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let result;

    if (existingRecord) {
      // Si existe, actualiza la nota
      const { data, error } = await supabase
        .from("grades")
        .update({
          score,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Si no existe, inserta una nueva nota
      const { data, error } = await supabase
        .from("grades")
        .insert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          score,
          id: crypto.randomUUID()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  } catch (error) {
    console.error("Error al registrar nota:", error);
    return null;
  }
}

/**
 * Elimina todas las inscripciones de un curso específico.
 * @param courseId El ID del curso cuyas inscripciones se eliminarán.
 * @returns El resultado de la operación.
 */
export async function removeEnrollmentsForCourse(courseId: string) {
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("course_id", courseId);

  if (error) {
    throw error;
  }
}

/**
 * Obtiene los detalles de un estudiante, incluyendo el nombre de su profesor y curso.
 * @param studentId El ID del estudiante.
 * @returns Un objeto de detalles del estudiante o null si no se encuentra.
 */
export async function getStudentDetailsWithTeacher(studentId: string): Promise<StudentDetails | null> {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        users!inner(id, name, email, document_number, photo),
        courses!inner(
          name,
          teachers:teacher_id(name)
        )
      `)
      .eq("student_id", studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      id: data.users.id,
      name: data.users.name,
      email: data.users.email,
      documentId: data.users.document_number,
      photoUrl: data.users.photo || `https://api.dicebear.com/7.x/notionists/svg?seed=${data.users.id}`,
      course: {
        name: data.courses.name,
        teacher: data.courses.teachers || null,
      },
    };
  } catch (error) {
    console.error("Error fetching student details with teacher:", error);
    return null;
  }
}

/**
 * Busca estudiantes por nombre o número de documento.
 * @param query Término de búsqueda (nombre o documento)
 * @returns Lista de estudiantes que coinciden con la búsqueda
 */
export async function searchStudents(query: string): Promise<Student[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  try {
    let { data: documentMatch, error: documentError } = await supabase
      .from("users")
      .select("id, name, email, document_number, photo")
      .eq("role", "student")
      .eq("document_number", searchTerm)
      .limit(10);

    if (documentError) throw documentError;

    if (!documentMatch || documentMatch.length === 0) {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, document_number, photo")
        .eq("role", "student")
        .or(`name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      documentMatch = data;
    }

    return documentMatch.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      documentId: user.document_number,
      photoUrl: user.photo || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`,
    }));
  } catch (error) {
    console.error("Error searching students:", error);
    return [];
  }
}

/**
 * Añade múltiples estudiantes a un curso específico.
 * @param courseId El ID del curso al que se añadirán los estudiantes.
 * @param studentIds Array con los IDs de los estudiantes a añadir.
 * @returns Un booleano indicando si la operación fue exitosa.
 */
export async function addStudentsToCourse(courseId: string, studentIds: string[]): Promise<boolean> {
  try {
    if (!studentIds.length) return true;

    const { data: existingEnrollments, error: checkError } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("course_id", courseId)
      .in("student_id", studentIds);

    if (checkError) {
      console.error("Error al verificar inscripciones existentes:", checkError);
      return false;
    }

    const existingStudentIds = existingEnrollments.map(e => e.student_id);
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
      return true;
    }

    const enrollments = newStudentIds.map(studentId => ({
      id: crypto.randomUUID(),
      course_id: courseId,
      student_id: studentId,
      enrollment_date: new Date().toISOString(),
      status: "active"
    }));

    const { error } = await supabase
      .from("enrollments")
      .insert(enrollments);

    if (error) {
      console.error("Error al añadir estudiantes al curso:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al añadir estudiantes al curso:", error);
    return false;
  }
}

/**
 * Obtiene las calificaciones de un estudiante para una lección específica o todas las lecciones.
 * @param enrollmentId ID de la inscripción (relación estudiante-curso)
 * @param lessonId ID de la lección (opcional)
 * @returns Lista de registros de calificaciones
 */
export async function getStudentGrades(
  enrollmentId: string,
  lessonId?: string
): Promise<GradeRecord[]> {
  try {
    let query = supabase
      .from("grades")
      .select("*")
      .eq("enrollment_id", enrollmentId);

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener calificaciones del estudiante:", error);
    return [];
  }
}

/**
 * Obtiene los registros de asistencia de un estudiante.
 * @param enrollmentId ID de la inscripción (relación estudiante-curso)
 * @param lessonId ID de la lección (opcional)
 * @returns Lista de registros de asistencia
 */
export async function getStudentAttendance(
  enrollmentId: string,
  lessonId?: string
): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from("attendance")
      .select("*")
      .eq("enrollment_id", enrollmentId);

    if (lessonId) {
      query = query.eq("lesson_id", lessonId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener registros de asistencia del estudiante:", error);
    return [];
  }
}

/**
 * Obtiene todas las lecciones para un curso dado.
 * @param courseId ID del curso.
 * @returns Lista de lecciones.
 */
export async function getLessonsForCourse(courseId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title") // Changed 'name' to 'title'
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching lessons for course:", error);
    return [];
  }
}

/**
 * Elimina la calificación de un estudiante
 * @param gradeId ID de la calificación a eliminar
 * @returns true si se eliminó correctamente, false si hubo un error
 */
export async function deleteGrade(gradeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("grades")
      .delete()
      .eq("id", gradeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al eliminar la calificación:", error);
    return false;
  }
}

/**
 * Elimina un registro de asistencia
 * @param attendanceId ID del registro de asistencia a eliminar
 * @returns true si se eliminó correctamente, false si hubo un error
 */
export async function deleteAttendance(attendanceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("id", attendanceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error al eliminar el registro de asistencia:", error);
    return false;
  }
}