import { supabase } from "@/lib/supabase"

type Student = {
  id: string
  name: string
  course_id: string
}

export async function addStudentToCourse(courseId: string, studentName: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .insert([
      { name: studentName, course_id: courseId }
    ])
    .select()
    .single()

  if (error) {
    console.error("Error al agregar estudiante:", error)
    throw error
  }

  return data as Student
}

export async function getStudentsForCourse(courseId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('course_id', courseId)

  if (error) {
    console.error("Error al obtener estudiantes:", error)
    return []
  }

  return data as Student[]
}