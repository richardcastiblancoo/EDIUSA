"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "./supabase"
import type { User } from "./supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const savedUser = localStorage.getItem("auth_user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error("Error checking user:", error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      // Try Supabase first
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single()

      if (data && !error) {
        setUser(data)
        localStorage.setItem("auth_user", JSON.stringify(data))
        return { success: true }
      }

      // Fallback to mock users
      const mockUsers = [
        {
          id: "1",
          email: "coordinador@usa.edu.co",
          password: "123456",
          name: "María González",
          role: "coordinator" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          email: "profesor@usa.edu.co",
          password: "123456",
          name: "Carlos Rodríguez",
          role: "teacher" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          email: "estudiante@usa.edu.co",
          password: "123456",
          name: "Ana López",
          role: "student" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      const mockUser = mockUsers.find((u) => u.email === email && u.password === password)
      if (mockUser) {
        setUser(mockUser)
        localStorage.setItem("auth_user", JSON.stringify(mockUser))
        return { success: true }
      }

      return { success: false, error: "Credenciales inválidas" }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: "Error de conexión" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("auth_user", JSON.stringify(updatedUser))
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
