import { supabase } from "@/lib/supabase";

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

  return data.map((enrollment: any) => ({
    id: enrollment.users.id,
    name: enrollment.users.name,
    email: enrollment.users.email,
    documentId: enrollment.users.document_number,
    photoUrl: enrollment.users.photo,
  })) as Student[];
}


/**
 * Agrega uno o más estudiantes a un curso.
 * @param courseId El ID del curso.
 * @param studentIds Una lista de IDs de estudiantes a inscribir.
 * @returns El resultado de la operación.
 */
export async function addStudentsToCourse(courseId: string, studentIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from("enrollments")
    .delete()
    .eq("course_id", courseId);

  if (deleteError) {
    console.error("Error al eliminar inscripciones existentes:", deleteError);
    throw deleteError;
  }

  if (studentIds.length === 0) {
    return;
  }

  const enrollments = studentIds.map(studentId => ({
    student_id: studentId,
    course_id: courseId,
  }));

  const { error: insertError } = await supabase
    .from("enrollments")
    .insert(enrollments);

  if (insertError) {
    console.error("Error al agregar estudiantes al curso:", insertError);
    throw insertError;
  }
}


/**
 * Busca estudiantes por nombre o número de documento.
 * @param query El término de búsqueda.
 * @returns Una lista de estudiantes que coinciden con la búsqueda.
 */
/**
 * Busca estudiantes por número de documento.
 * @param query El número de documento a buscar.
 * @returns Una lista de estudiantes que coinciden con la búsqueda.
 */
export async function searchStudents(query: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, document_number, photo")
    .eq("document_number", query)
    .eq("role", "student");

  if (error) {
    console.error("Error al buscar estudiantes:", error);
    throw error;
  }

  return data.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    documentId: user.document_number,
    photoUrl: user.photo,
  })) as Student[];
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
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.users.id,
      name: data.users.name,
      email: data.users.email,
      documentId: data.users.document_number,
      photoUrl: data.users.photo,
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