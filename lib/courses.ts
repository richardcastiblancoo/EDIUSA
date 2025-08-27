import { createClient } from "@supabase/supabase-js";
import { removeEnrollmentsForCourse } from "./students";
import { supabase } from "./supabase";

// Tipos para los datos del curso
export type Course = {
    id: string;
    name: string;
    description: string | null;
    language: string;
    level: string;
    code: string | null;
    max_students: number | null;
    enrolled_count: number | null;
    duration_weeks: number | null;
    hours_per_week: number | null;
    teacher_id: string | null;
    schedule: string | null;
    start_date: string | null;
    end_date: string | null;
    room: string | null;
};
// Tipo para la creación de un curso, omitiendo los campos generados por la DB
type CourseCreate = Omit<Course, "id" | "enrolled_count">;
// Nuevo tipo para el curso con información del profesor
export type CourseWithTeacher = Course & {
    teachers: {
        name: string;
    } | null;
};
/**
 * Obtiene todos los cursos de la base de datos.
 * @returns {Promise<Course[]>} Una lista de objetos de curso.
 */
export async function getCourses(): Promise<Course[]> {
    const { data, error } = await supabase.from("courses").select("*");

    if (error) {
        console.error("Error fetching courses:", error.message);
        throw error;
    }
    return data || [];
}
/**
 * Crea un nuevo curso en la base de datos.
 * @param courseData Los datos del nuevo curso.
 * @returns {Promise<Course | null>} El curso creado o null si hay un error.
 */
export async function createCourse(courseData: CourseCreate): Promise<Course | null> {
    const { data, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

    if (error) {
        console.error("Error creating course:", error.message);
        throw error;
    }
    return data;
}
/**
 * Actualiza un curso existente en la base de datos.
 * @param id El ID del curso a actualizar.
 * @param courseData Los datos del curso a actualizar.
 * @returns {Promise<void>}
 */
export async function updateCourse(id: string, courseData: Partial<Course>): Promise<void> {
    const { error } = await supabase.from("courses").update(courseData).eq("id", id);

    if (error) {
        console.error("Error updating course:", error.message);
        throw error;
    }
}
/**
 * Elimina un curso de la base de datos.
 *
 * NOTA: Esta función ahora elimina primero todas las inscripciones asociadas
 * para evitar el error de clave foránea.
 *
 * @param id El ID del curso a eliminar.
 * @returns {Promise<void>}
 */
export async function deleteCourse(id: string): Promise<void> {
    try {
        // Primero, elimina todas las inscripciones asociadas en la tabla 'enrollments'
        await removeEnrollmentsForCourse(id);

        // Luego, procede a eliminar el curso
        const { error } = await supabase.from("courses").delete().eq("id", id);

        if (error) {
            console.error("Error deleting course:", error.message);
            throw error;
        }
    } catch (e) {
        console.error("Error en la operación de eliminación del curso:", e);
        throw e;
    }
}
/**
 * Obtiene los cursos en los que un estudiante está inscrito, incluyendo el nombre del profesor.
 * @param studentId El ID del estudiante.
 * @returns {Promise<CourseWithTeacher[]>} Una lista de cursos con la información del profesor.
 */
export async function getStudentCourses(studentId: string): Promise<CourseWithTeacher[]> {
    const { data, error } = await supabase
        .from('enrollments')
        .select(`
            courses (
                *,
                teachers:teacher_id (name)
            )
        `)
        .eq('student_id', studentId);

    if (error) {
        console.error("Error fetching student courses:", error);
        throw error;
    }

    return data.map(enrollment => enrollment.courses) as unknown as CourseWithTeacher[];
}