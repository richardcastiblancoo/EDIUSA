import { supabase } from "./supabase"

export interface Report {
  id: string
  title: string
  report_type: "enrollment" | "grades" | "attendance" | "teacher_performance" | "course_completion"
  generated_by: string
  parameters?: any
  data?: any
  created_at: string
  expires_at?: string
}

export interface ReportData {
  enrollmentStats: {
    totalStudents: number
    activeEnrollments: number
    completedCourses: number
    dropoutRate: number
  }
  courseStats: {
    totalCourses: number
    activeCourses: number
    averageEnrollment: number
    capacityUtilization: number
  }
  teacherStats: {
    totalTeachers: number
    activeTeachers: number
    averageCoursesPerTeacher: number
  }
  languageDistribution: Array<{
    language: string
    courses: number
    students: number
  }>
  enrollmentTrends: Array<{
    month: string
    enrollments: number
  }>
}

export async function generateEnrollmentReport(): Promise<ReportData | null> {
  try {
    // Get enrollment statistics
    const { data: enrollments } = await supabase.from("enrollments").select("*, course:courses(language)")

    const { data: courses } = await supabase.from("courses").select("*").eq("is_active", true)

    const { data: teachers } = await supabase.from("users").select("*").eq("role", "teacher").eq("is_active", true)

    const { data: students } = await supabase.from("users").select("*").eq("role", "student").eq("is_active", true)

    if (!enrollments || !courses || !teachers || !students) {
      throw new Error("Failed to fetch data")
    }

    const activeEnrollments = enrollments.filter((e) => e.status === "active")
    const completedEnrollments = enrollments.filter((e) => e.status === "completed")

    // Calculate statistics
    const enrollmentStats = {
      totalStudents: students.length,
      activeEnrollments: activeEnrollments.length,
      completedCourses: completedEnrollments.length,
      dropoutRate:
        enrollments.length > 0
          ? (enrollments.filter((e) => e.status === "dropped").length / enrollments.length) * 100
          : 0,
    }

    const courseStats = {
      totalCourses: courses.length,
      activeCourses: courses.filter((c) => c.is_active).length,
      averageEnrollment:
        courses.length > 0 ? courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0) / courses.length : 0,
      capacityUtilization:
        courses.length > 0
          ? (courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0) /
              courses.reduce((sum, c) => sum + (c.capacity || 25), 0)) *
            100
          : 0,
    }

    const teacherStats = {
      totalTeachers: teachers.length,
      activeTeachers: courses.filter((c) => c.teacher_id).length,
      averageCoursesPerTeacher: teachers.length > 0 ? courses.length / teachers.length : 0,
    }

    // Language distribution
    const languageMap = new Map()
    courses.forEach((course) => {
      const lang = course.language
      if (!languageMap.has(lang)) {
        languageMap.set(lang, { courses: 0, students: 0 })
      }
      languageMap.get(lang).courses++
      languageMap.get(lang).students += course.enrolled_count || 0
    })

    const languageDistribution = Array.from(languageMap.entries()).map(([language, stats]) => ({
      language,
      courses: stats.courses,
      students: stats.students,
    }))

    // Mock enrollment trends (in a real app, you'd calculate this from historical data)
    const enrollmentTrends = [
      { month: "Enero", enrollments: 45 },
      { month: "Febrero", enrollments: 52 },
      { month: "Marzo", enrollments: 48 },
      { month: "Abril", enrollments: 61 },
      { month: "Mayo", enrollments: 55 },
      { month: "Junio", enrollments: 58 },
    ]

    return {
      enrollmentStats,
      courseStats,
      teacherStats,
      languageDistribution,
      enrollmentTrends,
    }
  } catch (error) {
    console.error("Generate report error:", error)
    return null
  }
}

export async function saveReport(reportData: Omit<Report, "id" | "created_at">): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          ...reportData,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as Report
  } catch (error) {
    console.error("Save report error:", error)
    return null
  }
}

export async function getReports(userId: string): Promise<Report[]> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("generated_by", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Report[]
  } catch (error) {
    console.error("Get reports error:", error)
    return []
  }
}