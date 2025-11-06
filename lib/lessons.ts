import { supabase } from "./supabase";

// 1. DEFINICIÓN DE TIPOS (NUEVOS TIPOS)
export type Lesson = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    pdf_url: string | null;      // URL del archivo PDF subido
    audio_url: string | null;    // URL del archivo de Audio subido
    is_published: boolean;
    order_index: number;
    created_at: string;
    updated_at: string; // Asumiendo que existe en tu tabla
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
        // !! IMPORTANTE: REEMPLAZA 'course_materials' con el nombre de tu bucket de Supabase Storage !!
        const bucketName = 'course_materials'; 
        
        // 1. Subida del Archivo PDF a Supabase Storage
        if (pdfFile) {
            const pdfPath = `${courseId}/lessons/${crypto.randomUUID()}-${pdfFile.name}`;
            const { error: pdfError } = await supabase.storage
                .from(bucketName)
                .upload(pdfPath, pdfFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'application/pdf',
                });

            if (pdfError) throw new Error(`Error al subir PDF: ${pdfError.message}`);
            
            // Obtener la URL pública
            pdfUrl = supabase.storage
                .from(bucketName)
                .getPublicUrl(pdfPath).data.publicUrl;
        }

        // 2. Subida del Archivo de Audio a Supabase Storage
        if (audioFile) {
            const audioPath = `${courseId}/lessons/${crypto.randomUUID()}-${audioFile.name}`;
            const { error: audioError } = await supabase.storage
                .from(bucketName)
                .upload(audioPath, audioFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: audioFile.type, 
                });

            if (audioError) throw new Error(`Error al subir Audio: ${audioError.message}`);

            // Obtener la URL pública
            audioUrl = supabase.storage
                .from(bucketName)
                .getPublicUrl(audioPath).data.publicUrl;
        }

        // 3. Obtener el siguiente order_index
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

        // 4. Inserción de la Lección en la Base de Datos
        const lessonData = {
            course_id: courseId,
            title,
            description,
            pdf_url: pdfUrl,
            audio_url: audioUrl,
            is_published: false, // Por defecto, se crea sin publicar
            order_index: newOrderIndex,
        };

        const { data, error: insertError } = await supabase
            .from('lessons') 
            .insert(lessonData)
            .select()
            .single();

        if (insertError) throw new Error(`Error al insertar lección en DB: ${insertError.message}`);

        return data as Lesson;

    } catch (error) {
        console.error("Error creating new lesson:", error);
        return null;
    }
}


// 2. TUS FUNCIONES EXISTENTES

export async function getStudentLessons(studentId: string) {
  try {
    // Primero obtenemos los cursos del estudiante
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", studentId);

    if (enrollmentsError) throw enrollmentsError;
    
    if (!enrollments || enrollments.length === 0) return [];

    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Obtenemos las lecciones de esos cursos
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`
        *,
        courses:course_id (name)
      `)
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
    return lessons as Lesson[] || [];
  } catch (error) {
    console.error("Error obteniendo lecciones del curso:", error);
    return [];
  }
}