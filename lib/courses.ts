import { createClient } from "@supabase/supabase-js";

// Reemplaza con tus propias credenciales de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type Course = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  level: string;
  code: string;
  capacity: number;
  enrolled_count: number;
  duration_weeks: number | null;
  hours_per_week: number | null;
  price: number | null;
  teacher_id: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  room: string | null;
};

type CourseCreate = Omit<Course, "id" | "created_at" | "enrolled_count">;

/**
 * Obtiene todos los cursos de la base de datos.
 * @returns {Promise<Course[]>} Una lista de objetos de curso.
 */
export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase.from("courses").select("*");

  if (error) {
    console.error("Error fetching courses:", error.message);
    throw error;
  }
  return data || [];
}

/**
 * Crea un nuevo curso en la base de datos.
 * @param courseData Los datos del nuevo curso.
 * @returns {Promise<Course | null>} El curso creado o null si hay un error.
 */
export async function createCourse(courseData: CourseCreate): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .insert([courseData])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error.message);
    throw error;
  }
  return data;
}

/**
 * Actualiza un curso existente en la base de datos.
 * @param id El ID del curso a actualizar.
 * @param courseData Los datos del curso a actualizar.
 * @returns {Promise<void>}
 */
export async function updateCourse(id: string, courseData: Partial<Course>): Promise<void> {
  const { error } = await supabase.from("courses").update(courseData).eq("id", id);

  if (error) {
    console.error("Error updating course:", error.message);
    throw error;
  }
}

/**
 * Elimina un curso de la base de datos.
 * @param id El ID del curso a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    console.error("Error deleting course:", error.message);
    throw error;
  }
}
