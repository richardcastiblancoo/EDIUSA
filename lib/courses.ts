import { supabase } from "./supabase"
import type { Course, Schedule } from "./supabase"

// Mock data for demo purposes
const mockCourses: Course[] = [
  {
    id: "1",
    name: "Inglés Básico A1",
    code: "ENG-A1-001",
    description: "Curso introductorio de inglés para principiantes",
    level: "A1",
    language: "Inglés",
    teacher_id: "2",
    capacity: 25,
    enrolled_count: 18,
    start_date: "2024-02-01",
    end_date: "2024-05-31",
    schedule: "Lunes y Miércoles 8:00-10:00",
    room: "Aula 101",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Francés Intermedio B1",
    code: "FRA-B1-001",
    description: "Curso de francés nivel intermedio",
    level: "B1",
    language: "Francés",
    teacher_id: "2",
    capacity: 20,
    enrolled_count: 15,
    start_date: "2024-02-01",
    end_date: "2024-05-31",
    schedule: "Martes y Jueves 10:00-12:00",
    room: "Aula 102",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Alemán Básico A2",
    code: "GER-A2-001",
    description: "Curso de alemán nivel básico alto",
    level: "A2",
    language: "Alemán",
    teacher_id: "2",
    capacity: 15,
    enrolled_count: 12,
    start_date: "2024-02-01",
    end_date: "2024-05-31",
    schedule: "Viernes 14:00-17:00",
    room: "Aula 103",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockSchedules: Schedule[] = [
  {
    id: "1",
    course_id: "1",
    day_of_week: 1, // Monday
    start_time: "08:00",
    end_time: "10:00",
    room: "Aula 101",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    course_id: "1",
    day_of_week: 3, // Wednesday
    start_time: "08:00",
    end_time: "10:00",
    room: "Aula 101",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    course_id: "2",
    day_of_week: 2, // Tuesday
    start_time: "10:00",
    end_time: "12:00",
    room: "Aula 102",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    course_id: "2",
    day_of_week: 4, // Thursday
    start_time: "10:00",
    end_time: "12:00",
    room: "Aula 102",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    course_id: "3",
    day_of_week: 5, // Friday
    start_time: "14:00",
    end_time: "17:00",
    room: "Aula 103",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function getCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Get courses error:", error)
      return mockCourses
    }

    return data || mockCourses
  } catch (error) {
    console.error("Get courses error:", error)
    return mockCourses
  }
}

export async function getAllCourses(): Promise<Course[]> {
  return getCourses()
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const { data, error } = await supabase.from("courses").select("*").eq("id", id).single()

    if (error) {
      console.error("Get course error:", error)
      return mockCourses.find((course) => course.id === id) || null
    }

    return data
  } catch (error) {
    console.error("Get course error:", error)
    return mockCourses.find((course) => course.id === id) || null
  }
}

export async function createCourse(
  courseData: Omit<Course, "id" | "created_at" | "updated_at">,
): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .insert([
        {
          ...courseData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Create course error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Create course error:", error)
    return null
  }
}

export async function updateCourse(id: string, courseData: Partial<Course>): Promise<Course | null> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .update({
        ...courseData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Update course error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Update course error:", error)
    return null
  }
}

export async function deleteCourse(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("courses").delete().eq("id", id)

    if (error) {
      console.error("Delete course error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Delete course error:", error)
    return false
  }
}

export async function getAllSchedules(): Promise<Schedule[]> {
  try {
    const { data, error } = await supabase.from("schedules").select("*").order("day_of_week", { ascending: true })

    if (error) {
      console.error("Get schedules error:", error)
      return mockSchedules
    }

    return data || mockSchedules
  } catch (error) {
    console.error("Get schedules error:", error)
    return mockSchedules
  }
}

export async function getCourseSchedules(courseId: string): Promise<Schedule[]> {
  try {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("course_id", courseId)
      .order("day_of_week", { ascending: true })

    if (error) {
      console.error("Get course schedules error:", error)
      return mockSchedules.filter((schedule) => schedule.course_id === courseId)
    }

    return data || mockSchedules.filter((schedule) => schedule.course_id === courseId)
  } catch (error) {
    console.error("Get course schedules error:", error)
    return mockSchedules.filter((schedule) => schedule.course_id === courseId)
  }
}
