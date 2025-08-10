"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProfileSettings from "@/components/shared/profile-settings"
import type { User } from "@/lib/supabase"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      router.push("/")
    }
  }, [router])

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <DashboardLayout userRole={user.role}>
      <ProfileSettings user={user} onUserUpdate={handleUserUpdate} />
    </DashboardLayout>
  )
}
