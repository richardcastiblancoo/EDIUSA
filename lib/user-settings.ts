import { supabase } from "./supabase";

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  exam_reminders: boolean;
  grade_notifications: boolean;
  theme: "light" | "dark" | "system";
  language: "es" | "en" | "fr";
  timezone: string;
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        return await createDefaultUserSettings(userId);
      }
      throw error;
    }
    return data as UserSettings;
  } catch (error) {
    console.error("Get user settings error:", error);
    return null;
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<
    Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserSettings;
  } catch (error) {
    console.error("Update user settings error:", error);
    return null;
  }
}

export async function createDefaultUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .insert([{ user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as UserSettings;
  } catch (error) {
    console.error("Create user settings error:", error);
    return null;
  }
}
