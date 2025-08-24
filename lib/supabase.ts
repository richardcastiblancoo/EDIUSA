import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key. Check your .env.local file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tu código de interfaces
export interface UserImage {
  id: string
  user_id: string
  image_type: "avatar" | "logo" | "banner"
  image_url: string
  original_filename?: string
  file_size?: number
  mime_type?: string
  uploaded_at: string
  is_active: boolean
}

export interface User {
  id: string
  email: string
  password?: string
  name: string
  role: "coordinator" | "teacher" | "student"
  avatar?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  code: string
  description: string
  level: string
  language: string
  teacher_id: string
  capacity: number
  enrolled_count: number
  start_date: string
  end_date: string
  schedule: string
  room: string
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  title: string
  description: string
  course_id: string
  teacher_id: string
  date: string
  duration: number
  total_points: number
  status: "draft" | "published" | "completed"
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  exam_id: string
  question_text: string
  question_type: "multiple_choice" | "true_false" | "short_answer" | "essay"
  options?: string[]
  correct_answer: string
  points: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  course_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string
  created_at: string
  updated_at: string
}