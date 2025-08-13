import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Supabase Auth login error:", authError.message);
      // Si hay un error de autenticación de Supabase, puedes manejarlo aquí.
      // Por ejemplo, si las credenciales son incorrectas, authError contendrá el mensaje.
      
      // Si aún quieres mantener los usuarios mock para desarrollo o pruebas,
      // puedes intentar autenticar con ellos si la autenticación de Supabase falla.
      const mockUsers: User[] = [
        {
          id: "1",
          email: "coordinador@usa.edu.co",
          password: "123456",
          name: "María González",
          role: "coordinator",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          email: "profesor@usa.edu.co",
          password: "123456",
          name: "Carlos Rodríguez",
          role: "teacher",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          email: "estudiante@usa.edu.co",
          password: "123456",
          name: "Ana López",
          role: "student",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      return mockUsers.find((user) => user.email === email && user.password === password) || null;
    }

    if (authData.user) {
      // Si la autenticación de Supabase es exitosa, obtenemos el ID del usuario autenticado.
      // Luego, podemos buscar los datos adicionales del usuario en tu tabla 'users' si es necesario.
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return null;
      }
      return userData as User;
    }

    return null; // Si no hay usuario autenticado y no se encontró en los mocks
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

  export async function createUser(userData: Omit<User, "id" | "created_at" | "updated_at">): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Create user error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Create user error:", error)
      return null
    }
  }

  export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Update user error:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Update user error:", error)
      return null
    }
  }

  export async function deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) {
        console.error("Delete user error:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Delete user error:", error)
      return false
    }
  }

  export async function getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Get users error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Get users error:", error)
      return []
    }
  }
