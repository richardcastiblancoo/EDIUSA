import { supabase } from "@/lib/supabase"

export type Student = {
  id: string;
  name: string;
  email: string;
};

export async function addStudentToCourse(courseId: string, studentId: string): Promise<void> {
  const { error } = await supabase.from("enrollments").insert([
    {
      student_id: studentId,
      course_id: courseId,
    },
  ]);

  if (error) {
    console.error("Error al agregar estudiante al curso:", error);
    throw error;
  }
}

export async function getStudentsForCourse(courseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*, users(id, name, email)") // Select all from enrollments and specific fields from joined users table
    .eq("course_id", courseId);

  if (error) {
    console.error("Error al obtener estudiantes:", error);
    return [];
  }

  // Map the data to the Student type, extracting user details
  return data.map((enrollment: any) => ({
    id: enrollment.users.id,
    name: enrollment.users.name,
    email: enrollment.users.email,
  })) as Student[];
}