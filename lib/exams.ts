import { supabase } from "./supabase"

export interface Question {
  id: string
  exam_id: string
  question_text: string
  question_type: "multiple_choice" | "essay" | "true_false" | "fill_blank"
  options?: string[]
  correct_answer: string
  points: number
  order_number: number
  created_at: string
}

export interface Exam {
  id: string
  course_id: string
  title: string
  description?: string
  duration_minutes: number
  total_questions: number
  exam_type: string
  due_date: string
  max_attempts: number
  created_by: string
  instructions?: string
  passing_score: number
  show_results: boolean
  randomize_questions: boolean
  is_active: boolean
  created_at: string
}

export async function createExam(examData: Omit<Exam, "id" | "created_at">): Promise<Exam | null> {
  try {
    const { data, error } = await supabase.from("exams").insert([examData]).select().single()

    if (error) throw error
    return data as Exam
  } catch (error) {
    console.error("Create exam error:", error)
    return null
  }
}

export async function updateExam(id: string, examData: Partial<Exam>): Promise<Exam | null> {
  try {
    const { data, error } = await supabase.from("exams").update(examData).eq("id", id).select().single()

    if (error) throw error
    return data as Exam
  } catch (error) {
    console.error("Update exam error:", error)
    return null
  }
}

export async function getExamsByTeacher(teacherId: string): Promise<Exam[]> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("created_by", teacherId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Exam[]
  } catch (error) {
    console.error("Get exams error:", error)
    return []
  }
}

export async function getExamQuestions(examId: string): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_number", { ascending: true })

    if (error) throw error
    return data as Question[]
  } catch (error) {
    console.error("Get questions error:", error)
    return []
  }
}

export async function createQuestion(questionData: Omit<Question, "id" | "created_at">): Promise<Question | null> {
  try {
    const { data, error } = await supabase.from("questions").insert([questionData]).select().single()

    if (error) throw error
    return data as Question
  } catch (error) {
    console.error("Create question error:", error)
    return null
  }
}

export async function updateQuestion(id: string, questionData: Partial<Question>): Promise<Question | null> {
  try {
    const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single()

    if (error) throw error
    return data as Question
  } catch (error) {
    console.error("Update question error:", error)
    return null
  }
}

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("questions").delete().eq("id", id)
    return !error
  } catch (error) {
    console.error("Delete question error:", error)
    return false
  }
}
