"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ExamManagement from "@/components/teacher/exam-management"

export default function TeacherExamsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <DashboardLayout userRole="teacher">
      <ExamManagement teacherId={user.id} />
    </DashboardLayout>
  )
}
