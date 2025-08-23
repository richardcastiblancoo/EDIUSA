export async function addStudentsToCourse(courseId: string, studentIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('students_courses')
    .insert(studentIds.map(studentId => ({
      course_id: courseId,
      student_id: studentId
    })))

  if (error) throw error
}