"use client";
import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import type { User } from "./supabase";
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    checkUser();
  }, []);
  const checkUser = async () => {
    try {
      const savedUser = localStorage.getItem("auth_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (supabaseUser && !supabaseError) {
        setUser(supabaseUser);
        localStorage.setItem("auth_user", JSON.stringify(supabaseUser));
        document.cookie = `auth_user=${JSON.stringify(supabaseUser)}; path=/; max-age=2592000`;   
        return { success: true };
      }
      return { success: false, error: "Credenciales inválidas" };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: "Error de conexión" };
    } finally {
      setLoading(false);
    }
  };
  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };
  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}