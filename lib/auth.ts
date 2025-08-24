import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

// Credenciales de Supabase
// Aquí se obtienen las variables de entorno para la URL y la clave de Supabase.
// Es crucial que estas variables estén configuradas en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

// User type definition (expanded for all custom fields)
export type User = User & {
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

export const createUser = async (userData: UserCreateData) => {
    const { email, password, role, ...profileData } = userData;
    
    // Create the user in auth.users table
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    // Insert additional profile data into the public.users table
    const { error: insertError } = await supabase.from("users").insert({
        id: authData.user?.id,
        email: authData.user?.email,
        role,
        ...profileData,
    });

    if (insertError) {
        console.error("Error creating user profile:", insertError);
        throw insertError;
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
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
        console.error("Delete user error:", error)
        throw error
    }
}