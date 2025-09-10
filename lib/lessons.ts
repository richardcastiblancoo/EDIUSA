import { supabase } from "./supabase";

export async function getStudentLessons(studentId: string) {
  try {
    // Primero obtenemos los cursos del estudiante
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", studentId);

    if (enrollmentsError) throw enrollmentsError;
    
    if (!enrollments || enrollments.length === 0) return [];

    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Obtenemos las lecciones de esos cursos
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`
        *,
        courses:course_id (name)
      `)
      .in("course_id", courseIds)
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (lessonsError) throw lessonsError;
    return lessons || [];
  } catch (error) {
    console.error("Error obteniendo lecciones del estudiante:", error);
    return [];
  }
}