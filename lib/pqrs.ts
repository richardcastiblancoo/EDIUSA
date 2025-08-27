import { supabase } from "./supabase";
import type { PQR } from "./supabase";

/**
 * Obtiene todos los PQRs asociados a un profesor específico.
 * @param teacherId ID del profesor
 * @returns Lista de PQRs
 */
export async function getPQRsByTeacher(teacherId: string): Promise<PQR[]> {
  const { data, error } = await supabase
    .from("pqrs")
    .select(`
      *,
      courses:course_id (name),
      students:student_id (name)
    `)
    .eq("teacher_id", teacherId);

  if (error) {
    console.error("Error fetching PQRs:", error);
    throw error;
  }

  return data || [];
}

/**
 * Crea un nuevo PQR enviado por un estudiante.
 * @param studentId ID del estudiante que envía el PQR
 * @param courseId ID del curso relacionado con el PQR
 * @param teacherId ID del profesor del curso (null si va dirigido al coordinador)
 * @param subject Asunto del PQR
 * @param message Mensaje o contenido del PQR
 * @param isForCoordinator Indica si el PQR va dirigido al coordinador
 * @returns El PQR creado
 */
export async function createPQR(
  studentId: string,
  courseId: string,
  teacherId: string | null,
  subject: string,
  message: string,
  isForCoordinator: boolean = false
): Promise<PQR | null> {
  const pqrData: any = {
    student_id: studentId,
    course_id: courseId,
    subject,
    message,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Si es para el coordinador, dejamos teacher_id como null
  if (!isForCoordinator && teacherId) {
    pqrData.teacher_id = teacherId;
  }

  const { data, error } = await supabase
    .from("pqrs")
    .insert([pqrData])
    .select()
    .single();

  if (error) {
    console.error("Error creating PQR:", error);
    throw error;
  }

  return data;
}

/**
 * Actualiza un PQR con la respuesta del profesor y/o cambio de estado.
 * @param pqrId ID del PQR a actualizar
 * @param status Nuevo estado del PQR
 * @param teacherResponse Respuesta del profesor
 * @returns El PQR actualizado
 */
export async function updatePQR(
  pqrId: string,
  status: string,
  teacherResponse?: string
): Promise<PQR | null> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (teacherResponse) {
    updates.teacher_response = teacherResponse;
  }

  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("pqrs")
    .update(updates)
    .eq("id", pqrId)
    .select()
    .single();

  if (error) {
    console.error("Error updating PQR:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene todos los PQRs enviados por un estudiante específico.
 * @param studentId ID del estudiante
 * @returns Lista de PQRs
 */
export async function getPQRsByStudent(studentId: string): Promise<PQR[]> {
  const { data, error } = await supabase
    .from("pqrs")
    .select(`
      *,
      courses:course_id (name),
      teachers:teacher_id (name)
    `)
    .eq("student_id", studentId);

  if (error) {
    console.error("Error fetching student PQRs:", error);
    throw error;
  }

  return data || [];
}