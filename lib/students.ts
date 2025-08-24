import { supabase } from "@/lib/supabase"

// Definición de tipos para el estudiante, incluyendo campos de la tabla `users`
export type Student = {
  id: string;
  name: string;
  email: string;
  documentId: string;
  photoUrl: string;
};

/**
 * Obtiene los estudiantes inscritos en un curso específico.
 * @param courseId El ID del curso.
 * @returns Una lista de objetos de estudiantes.
 */
export async function getStudentsForCourse(courseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*, users(id, name, email, document_number, photo)") // Solicitamos los campos necesarios de la tabla 'users'
    .eq("course_id", courseId);

  if (error) {
    console.error("Error al obtener estudiantes:", error);
    return [];
  }

  // Mapea los datos para devolver una estructura de estudiante más útil
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
    // Primero, eliminamos las inscripciones existentes para el curso para evitar duplicados
    const { error: deleteError } = await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId);

    if (deleteError) {
        console.error("Error al eliminar inscripciones existentes:", deleteError);
        throw deleteError;
    }

    // Si no hay estudiantes para inscribir, salimos de la función
    if (studentIds.length === 0) {
        return;
    }

    // Creamos los objetos de inscripción
    const enrollments = studentIds.map(studentId => ({
        student_id: studentId,
        course_id: courseId,
    }));

    // Insertamos las nuevas inscripciones
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
export async function searchStudents(query: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, document_number, photo")
    .ilike("name", `%${query}%`); // Búsqueda simple por nombre

  if (error) {
    console.error("Error al buscar estudiantes:", error);
    throw error;
  }
  
  // Mapeamos los resultados a nuestro tipo de dato `Student`
  return data.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    documentId: user.document_number,
    photoUrl: user.photo,
  })) as Student[];
}