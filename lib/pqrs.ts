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