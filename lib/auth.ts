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

export const deleteUser = async (userId: string) => {
    try {
        // Primero eliminar las referencias en la tabla user_images
        const { error: imageError } = await supabase
            .from("user_images")
            .delete()
            .eq("user_id", userId)

        if (imageError) {
            console.error("Error al eliminar imágenes del usuario:", imageError)
            throw imageError
        }

        // Luego eliminar el usuario
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