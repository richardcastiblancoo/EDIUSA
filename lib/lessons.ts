import { supabase } from "./supabase";

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

/**
 * Crea una nueva lección, incluyendo la subida de archivos opcionales. (NUEVA FUNCIÓN)
 * @param courseId ID del curso.
 * @param title Título de la lección.
 * @param description Descripción de la lección.
 * @param pdfFile Archivo PDF (opcional).
 * @param audioFile Archivo de Audio (opcional).
 * @returns La lección creada o null si hay un error.
 */

export async function createNewLesson(
  courseId: string,
  title: string,
  description: string,
  pdfFile: File | null,
  audioFile: File | null
): Promise<Lesson | null> {
  try {
    let pdfUrl = null;
    let audioUrl = null;
    if (pdfFile || audioFile) {
      const body = new FormData();
      body.append("courseId", courseId);
      if (pdfFile) body.append("pdf", pdfFile);
      if (audioFile) body.append("audio", audioFile);
      const res = await fetch("/api/storage/upload", { method: "POST", body });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Error al subir archivos: ${err?.error || res.statusText}`);
      }
      const uploaded = await res.json();
      pdfUrl = uploaded.pdfUrl || null;
      audioUrl = uploaded.audioUrl || null;
    }
    const { data: maxOrder, error: orderError } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();
    let newOrderIndex = 1;
    if (maxOrder) {
      newOrderIndex = maxOrder.order_index + 1;
    }
    const lessonData = {
      course_id: courseId,
      title,
      description,
      pdf_url: pdfUrl,
      audio_url: audioUrl,
      is_published: true,
      order_index: newOrderIndex,
    };
    const { data, error: insertError } = await supabase
      .from("lessons")
      .insert(lessonData)
      .select()
      .single();
    if (insertError)
      throw new Error(
        `Error al insertar lección en DB: ${insertError.message}`
      );
    return data as Lesson;
  } catch (error) {
    console.error("Error creating new lesson:", error);
    return null;
  }
}

export async function getStudentLessons(studentId: string) {
  try {
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", studentId);
        if (enrollmentsError) throw enrollmentsError;
        if (!enrollments || enrollments.length === 0) return [];
        const courseIds = enrollments.map((enrollment) => enrollment.course_id);
        const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(
        `
        *,
        courses:course_id (name)
        `
      )
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

export async function getLessonsForCourse(courseId: string): Promise<Lesson[]> {
  try {
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (lessons as Lesson[]) || [];
  } catch (error) {
    console.error("Error obteniendo lecciones del curso:", error);
    return [];
  }
}
