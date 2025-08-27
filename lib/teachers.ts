import { supabase } from "./supabase";

// Definición de tipos
// Actualizar el tipo Teacher para incluir la URL de la foto
export type Teacher = {
  id: string;
  name: string;
  photoUrl: string; // Añadido campo para la foto
};

// Función para obtener la lista de profesores de la base de datos
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, photo") // Añadido campo photo
      .eq("role", "teacher");

    if (error) {
      throw error;
    }

    return data.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      photoUrl: teacher.photo || "https://api.dicebear.com/7.x/notionists/svg?seed=" + teacher.id // Imagen por defecto si no hay foto
    })) || [];
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
}

// <--- NUEVA FUNCIÓN AGREGADA --->
// Función para obtener los estudiantes asignados a un profesor por su ID
export async function getStudentsForTeacher(teacherId: string): Promise<{id: string, name: string, photoUrl: string}[]> {
  try {
    // 1. Obtener los IDs de los cursos que imparte este profesor
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId);

    if (coursesError) {
      throw coursesError;
    }

    const courseIds = coursesData.map(course => course.id);

    if (courseIds.length === 0) {
      return []; // No hay cursos, por lo tanto no hay estudiantes
    }

    // 2. Obtener los estudiantes inscritos en esos cursos
    // Asume que tu tabla de estudiantes tiene una columna `course_id`
    // y una columna `user_id` que apunta al estudiante
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select(`
        id,
        name,
        photoUrl
      `)
      .in("course_id", courseIds);

    if (studentsError) {
      throw studentsError;
    }

    // Usar un Set para eliminar duplicados si un estudiante está en varios cursos del mismo profesor
    const uniqueStudents = Array.from(new Set(studentsData.map(s => s.id)))
      .map(id => studentsData.find(s => s.id === id)) as {id: string, name: string, photoUrl: string}[];

    return uniqueStudents || [];
  } catch (error) {
    console.error("Error fetching students for teacher:", error);
    return [];
  }
}