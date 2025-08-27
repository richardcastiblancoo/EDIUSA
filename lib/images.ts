import { supabase } from "./supabase"

export interface UserImage {
  id: string
  user_id: string
  image_type: "avatar" | "logo" | "banner"
  image_url: string
  original_filename?: string
  file_size?: number
  mime_type?: string
  uploaded_at: string
  is_active: boolean
}

export async function uploadImage(
  file: File,
  userId: string,
  imageType: "avatar" | "logo" | "banner",
): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${imageType}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("images").upload(fileName, file)

    if (uploadError) throw uploadError

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fileName)

    // Save image record to database
    const { data, error } = await supabase
      .from("user_images")
      .insert([
        {
          user_id: userId,
          image_type: imageType,
          image_url: publicUrl,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Deactivate previous images of the same type
    await supabase
      .from("user_images")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("image_type", imageType)
      .neq("id", data.id)

    return publicUrl
  } catch (error) {
    console.error("Upload image error:", error)
    return null
  }
}

export async function getUserImage(userId: string, imageType: "avatar" | "logo" | "banner"): Promise<string | null> {
  try {
    // Verificar que tenemos las credenciales de Supabase
    if (!supabase) {
      console.error("Supabase client not initialized");
      return null;
    }
    
    const { data, error } = await supabase
      .from("user_images")
      .select("image_url")
      .eq("user_id", userId)
      .eq("image_type", imageType)
      .eq("is_active", true)
      .maybeSingle(); // Usar maybeSingle() en lugar de single()

    if (error && error.code !== 'PGRST116') { // Ignorar el error específico de "no rows"
      console.error("Error fetching user image:", error);
      return null;
    }
    
    if (!data) return null;
    return data.image_url;
  } catch (error) {
    console.error("Get user image error:", error);
    return null;
  }
}

export async function deleteUserImage(userId: string, imageType: "avatar" | "logo" | "banner"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_images")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("image_type", imageType)

    return !error
  } catch (error) {
    console.error("Delete user image error:", error)
    return false
  }
}