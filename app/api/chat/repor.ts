import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Asume que tu cliente de Supabase está configurado de esta forma
// NOTA IMPORTANTE: Para entornos de producción, se recomienda usar una clave de servicio
// (service role key) y el cliente de Supabase para el servidor para mayor seguridad,
// ya que permite sortear las políticas de Row-Level Security (RLS) si es necesario.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fptbvhzxodzlwhcqshkm.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdGJ2aHp4b2R6bHdoY3FzaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDM3ODgsImV4cCI6MjA3MDQxOTc4OH0.x1TfIG7-qUZ0x3sC9h0valKqOgQqhXokYfFkoVgPUFw"
const supabase = createClient(supabaseUrl, supabaseAnonKey)


export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { reportType, reportSubType, options } = await request.json()

  let data = null
  let title = "Reporte"

  try {
    if (reportType === 'course' && reportSubType === 'grades') {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('name', options.courseName)
        .single()
      
      if (error || !courseData) {
        return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 })
      }

      // Supabase automáticamente une la tabla 'users' a través del 'student_id'
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          grade,
          students: student_id (name)
        `)
        .eq('course_id', courseData.id)

      if (gradesError) throw gradesError
      
      // Uso de encadenamiento opcional (`?.`) para seguridad
      data = grades.map(g => ({ grade: g.grade, student_name: g.students?.name }))
      title = `Reporte de Notas del Curso ${options.courseName}`
      
    } else if (reportType === 'course' && reportSubType === 'attendance') {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('name', options.courseName)
        .single()
      
      if (error || !courseData) {
        return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 })
      }

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          attendance_percentage,
          students: student_id (name)
        `)
        .eq('course_id', courseData.id)
      
      if (attendanceError) throw attendanceError
      
      data = attendance.map(a => ({ attendance_percentage: a.attendance_percentage, student_name: a.students?.name }))
      title = `Reporte de Asistencia del Curso ${options.courseName}`
      
    } else if (reportType === 'student' && reportSubType === 'grades') {
      const { data: studentData, error } = await supabase
        .from('users') // Asume que la tabla 'users' contiene a los estudiantes
        .select('id, name')
        .eq('name', options.studentName)
        .single()
      
      if (error || !studentData) {
        return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 })
      }
      
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          grade,
          courses: course_id (name)
        `)
        .eq('student_id', studentData.id)

      if (gradesError) throw gradesError
      
      data = grades.map(g => ({ grade: g.grade, course_name: g.courses?.name }))
      title = `Reporte de Notas de ${options.studentName}`

    } else if (reportType === 'student' && reportSubType === 'attendance') {
      const { data: studentData, error } = await supabase
        .from('users') // Asume que la tabla 'users' contiene a los estudiantes
        .select('id, name')
        .eq('name', options.studentName)
        .single()
      
      if (error || !studentData) {
        return NextResponse.json({ error: "Estudiante no encontrado." }, { status: 404 })
      }

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          attendance_percentage,
          courses: course_id (name)
        `)
        .eq('student_id', studentData.id)
      
      if (attendanceError) throw attendanceError
      
      data = attendance.map(a => ({ attendance_percentage: a.attendance_percentage, course_name: a.courses?.name }))
      title = `Reporte de Asistencia de ${options.studentName}`
      
    } else {
      return NextResponse.json({ error: "Tipo de reporte no válido." }, { status: 400 })
    }

    return NextResponse.json({ title, data })

  } catch (error: any) {
    console.error('Error en la API de reportes:', error.message)
    return NextResponse.json({ error: error.message || "Error al generar el reporte." }, { status: 500 })
  }
}