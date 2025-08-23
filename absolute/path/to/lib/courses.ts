// En la función createCourse, asegurarse de incluir teacher_id
const { data, error } = await supabase
  .from('courses')
  .insert([{
    ...courseData,
    teacher_id: courseData.teacher_id
  }])