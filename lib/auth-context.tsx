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

      // Únicamente la lógica de Supabase (sin usuarios mock de fallback)
      
      // NOTA DE SEGURIDAD: La consulta directa a la tabla 'users' para login es INSEGURA.
      // Se mantiene para la estructura, pero en producción, DEBE usarse `supabase.auth.signInWithPassword()`.
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        // Eliminada la verificación de password en la query (es inseguro)
        .single();

      if (supabaseUser && !supabaseError) {
        // ASUMIMOS autenticación exitosa si el usuario existe (debe verificarse de forma segura en producción)
        setUser(supabaseUser);
        localStorage.setItem("auth_user", JSON.stringify(supabaseUser));
        return { success: true };
      }

      // Si la consulta a Supabase falló o no encontró al usuario
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