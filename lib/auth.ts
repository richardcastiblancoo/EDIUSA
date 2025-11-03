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

// Dentro del módulo auth.ts

// Helper para sanear cadenas (elimina NUL y recorta)
const sanitizeString = (val?: string) => (typeof val === "string" ? val.replace(/\u0000/g, "").trim() : val);

export const createUser = async (userData: UserCreateData, maxRetries = 3, initialDelay = 1000) => {
    // Sanear todos los campos de texto antes de insertar
    const cleaned = {
        name: sanitizeString(userData.name)!,
        email: sanitizeString(userData.email)!,
        password: sanitizeString(userData.password),
        role: sanitizeString(userData.role)!,
        document_number: sanitizeString(userData.document_number),
        phone: sanitizeString(userData.phone),
        academic_level: sanitizeString(userData.academic_level),
        cohort: sanitizeString(userData.cohort),
        status: userData.status,
        photo: sanitizeString(userData.photo),
    };

    const { email, password, role, ...profileData } = cleaned;

    try {
        // Generar un ID único para el usuario
        const userId = crypto.randomUUID();

        // Insertar directamente en la tabla users sin usar supabase.auth.signUp
        const { data, error: insertError } = await supabase
            .from("users")
            .insert({
                id: userId,
                email,
                password, // Puede ser cualquier longitud
                role,
                ...profileData,
            })
            .select()
            .single();

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
    // Sanear campos de actualización
    const cleanedUpdate = {
        name: sanitizeString(updateData.name),
        email: sanitizeString(updateData.email),
        document_number: sanitizeString(updateData.document_number),
        phone: sanitizeString(updateData.phone),
        academic_level: sanitizeString(updateData.academic_level),
        cohort: sanitizeString(updateData.cohort),
        status: updateData.status,
        photo: sanitizeString(updateData.photo),
    };

    const { error } = await supabase.from("users").update(cleanedUpdate).eq("id", userId)

    if (error) {
        console.error("Update user error:", error)
        throw error
    }
}

export async function deleteUser(userId: string): Promise<boolean> {
    try {
        // First, update any courses where this user is a teacher
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