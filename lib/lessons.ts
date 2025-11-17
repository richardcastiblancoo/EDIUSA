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
    
    // Handle file uploads
    if (pdfFile || audioFile) {
      try {
        // Try to use the API endpoint first
        const body = new FormData();
        body.append("courseId", courseId);
        if (pdfFile) body.append("pdf", pdfFile);
        if (audioFile) body.append("audio", audioFile);
        
        const res = await fetch("/api/storage/upload", { method: "POST", body });
        if (res.ok) {
          const uploaded = await res.json();
          pdfUrl = uploaded.pdfUrl || null;
          audioUrl = uploaded.audioUrl || null;
        } else {
          console.warn("API upload failed, trying direct storage approach");
          throw new Error("API upload failed");
        }
      } catch (apiError) {
        console.warn("API upload failed, using direct storage approach:", apiError);
        
        // Fallback: Direct upload to Supabase storage
        try {
          // Ensure buckets exist
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketNames = buckets?.map(b => b.name) || [];
          
          // Create buckets if they don't exist
          if (pdfFile && !bucketNames.includes('attachments')) {
            await supabase.storage.createBucket('attachments', {
              public: true,
              fileSizeLimit: 50 * 1024 * 1024,
              allowedMimeTypes: ['application/pdf', 'text/pdf']
            });
          }
          
          if (audioFile && !bucketNames.includes('audio')) {
            await supabase.storage.createBucket('audio', {
              public: true,
              fileSizeLimit: 50 * 1024 * 1024,
              allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
            });
          }
          
          // Upload PDF directly
          if (pdfFile) {
            const pdfFileName = `lessons/${courseId}/${Date.now()}_${pdfFile.name}`;
            const { data: pdfData, error: pdfError } = await supabase.storage
              .from('attachments')
              .upload(pdfFileName, pdfFile);
            
            if (!pdfError && pdfData) {
              const { data: pdfUrlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(pdfFileName);
              pdfUrl = pdfUrlData.publicUrl;
            } else {
              console.warn("Direct PDF upload failed:", pdfError);
            }
          }
          
          // Upload audio directly
          if (audioFile) {
            const audioFileName = `lessons/${courseId}/${Date.now()}_${audioFile.name}`;
            const { data: audioData, error: audioError } = await supabase.storage
              .from('audio')
              .upload(audioFileName, audioFile);
            
            if (!audioError && audioData) {
              const { data: audioUrlData } = supabase.storage
                .from('audio')
                .getPublicUrl(audioFileName);
              audioUrl = audioUrlData.publicUrl;
            } else {
              console.warn("Direct audio upload failed:", audioError);
            }
          }
        } catch (directError) {
          console.error("Direct storage upload also failed:", directError);
          // Continue with lesson creation even if file uploads fail
        }
      }
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

/**
 * Elimina una lección y sus archivos asociados
 * @param lessonId ID de la lección a eliminar
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function deleteLesson(lessonId: string): Promise<boolean> {
  try {
    // Primero obtener la lección para saber qué archivos eliminar
    const { data: lesson, error: getError } = await supabase
      .from("lessons")
      .select("pdf_url, audio_url")
      .eq("id", lessonId)
      .single();

    if (getError) {
      console.error("Error obteniendo lección:", getError);
      return false;
    }

    // Eliminar archivos de almacenamiento si existen
    if (lesson?.pdf_url) {
      try {
        // Extraer el nombre del archivo de la URL
        const pdfPath = lesson.pdf_url.split('/').pop();
        if (pdfPath) {
          await supabase.storage.from('attachments').remove([pdfPath]);
        }
      } catch (fileError) {
        console.warn("Error eliminando archivo PDF:", fileError);
        // Continuar incluso si falla la eliminación del archivo
      }
    }

    if (lesson?.audio_url) {
      try {
        // Extraer el nombre del archivo de la URL
        const audioPath = lesson.audio_url.split('/').pop();
        if (audioPath) {
          await supabase.storage.from('audio').remove([audioPath]);
        }
      } catch (fileError) {
        console.warn("Error eliminando archivo de audio:", fileError);
        // Continuar incluso si falla la eliminación del archivo
      }
    }

    // Eliminar la lección de la base de datos
    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (deleteError) {
      console.error("Error eliminando lección:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en deleteLesson:", error);
    return false;
  }
}

/**
 * Actualiza una lección existente
 * @param lessonId ID de la lección a actualizar
 * @param updates Objeto con los campos a actualizar
 * @returns La lección actualizada o null si hubo error
 */
export async function updateLesson(
  lessonId: string,
  updates: {
    title?: string;
    description?: string | null;
    pdf_url?: string | null;
    audio_url?: string | null;
    is_published?: boolean;
    order_index?: number;
  }
): Promise<Lesson | null> {
  try {
    const { data, error } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", lessonId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando lección:", error);
      return null;
    }

    return data as Lesson;
  } catch (error) {
    console.error("Error en updateLesson:", error);
    return null;
  }
}
