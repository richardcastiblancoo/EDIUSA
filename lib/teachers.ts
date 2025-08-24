import { createClient } from "@supabase/supabase-js";

// Configura el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definición de tipos
export type Teacher = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  name: string;
  photoUrl: string;
};

// Función para obtener la lista de profesores de la base de datos
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "teacher");

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
}

// <--- NUEVA FUNCIÓN AGREGADA --->
// Función para obtener los estudiantes asignados a un profesor por su ID
export async function getStudentsForTeacher(teacherId: string): Promise<Student[]> {
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
      .map(id => studentsData.find(s => s.id === id)) as Student[];

    return uniqueStudents || [];
  } catch (error) {
    console.error("Error fetching students for teacher:", error);
    return [];
  }
}