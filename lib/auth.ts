import { createClient } from "@supabase/supabase-js"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { supabase } from "./supabase"

// User type definition (expanded for all custom fields)
export type User = SupabaseUser & {
    name: string;
    document_number?: string;
    phone?: string;
    academic_level?: string;
    cohort?: string;
    status?: "active" | "inactive" | "graduado" | "egresado";
}

// Data types for creation and update
export type UserCreateData = {
    name: string;
    email: string;
    password?: string;
    role: string;
    document_number?: string;
    phone?: string;
    academic_level?: string;
    cohort?: string;
    status?: "active" | "inactive" | "graduado" | "egresado";
    photo?: string;
}

export type UserUpdateData = {
    name?: string;
    email?: string;
    document_number?: string;
    phone?: string;
    academic_level?: string;
    cohort?: string;
    status?: "active" | "inactive" | "graduado" | "egresado";
    photo?: string;
}

// Functions
export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from("users").select("*")

    if (error) {
        console.error("Error fetching users:", error)
        throw error
    }

    return data as User[]
}

export const createUser = async (userData: UserCreateData, maxRetries = 3, initialDelay = 1000) => {
    const { email, password, role, ...profileData } = userData;

    try {
        // Generar un ID único para el usuario
        const userId = crypto.randomUUID();
        
        // Insertar directamente en la tabla users sin usar supabase.auth.signUp
        const { data, error: insertError } = await supabase.from("users").insert({
            id: userId,
            email,
            password, // Ahora puede ser de cualquier longitud
            role,
            ...profileData,
        }).select().single();

        if (insertError) {
            console.error("Error creating user profile:", insertError);
            throw insertError;
        }

        return data;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

export const updateUser = async (userId: string, updateData: UserUpdateData) => {
    const { error } = await supabase.from("users").update(updateData).eq("id", userId)

    if (error) {
        console.error("Update user error:", error)
        throw error
    }
}

export async function deleteUser(userId: string): Promise<boolean> {
    try {
        // First, delete all enrollments for this user
        const { error: enrollmentError } = await supabase
            .from("enrollments")
            .delete()
            .eq("student_id", userId)

        if (enrollmentError) {
            console.error("Error al eliminar inscripciones del estudiante:", enrollmentError)
            throw enrollmentError
        }

        // Update any courses where this user is a teacher
        const { error: courseError } = await supabase
            .from("courses")
            .update({ teacher_id: null })
            .eq("teacher_id", userId)

        if (courseError) {
            console.error("Error al actualizar cursos del profesor:", courseError)
            throw courseError
        }

        // Next, update any exams where this user is the creator
        const { error: examError } = await supabase
            .from("exams")
            .update({ created_by: null })
            .eq("created_by", userId)

        if (examError) {
            console.error("Error al actualizar exámenes creados por el usuario:", examError)
            throw examError
        }

        // Update any PQRs where this user is the student or teacher
        const { error: pqrStudentError } = await supabase
            .from("pqrs")
            .update({ student_id: null })
            .eq("student_id", userId)

        if (pqrStudentError) {
            console.error("Error al actualizar PQRs del estudiante:", pqrStudentError)
            throw pqrStudentError
        }

        const { error: pqrTeacherError } = await supabase
            .from("pqrs")
            .update({ teacher_id: null })
            .eq("teacher_id", userId)

        if (pqrTeacherError) {
            console.error("Error al actualizar PQRs del profesor:", pqrTeacherError)
            throw pqrTeacherError
        }

        // Then delete references in user_images table
        const { error: imageError } = await supabase
            .from("user_images")
            .delete()
            .eq("user_id", userId)

        if (imageError) {
            console.error("Error al eliminar imágenes del usuario:", imageError)
            throw imageError
        }

        // Finally delete the user
        const { error } = await supabase.from("users").delete().eq("id", userId)

        if (error) {
            console.error("Delete user error:", error)
            throw error
        }

        return true
    } catch (error) {
        console.error("Error al eliminar usuario:", error)
        throw error
    }
}