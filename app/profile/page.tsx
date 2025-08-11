"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProfileSettings from "@/components/shared/profile-settings"
import type { User } from "@/lib/supabase"

import { useAuth } from "@/lib/auth-context"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  const handleUserUpdate = (updatedUser: User) => {
    // Opcional: ProfileSettings ya actualiza el contexto y localStorage
  }

  return (
    <DashboardLayout userRole={user.role}>
      <ProfileSettings user={user} onUserUpdate={handleUserUpdate} />
    </DashboardLayout>
  )
}
