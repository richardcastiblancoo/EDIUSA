"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CourseManagement from "@/components/coordinator/course-management"

export default function CoordinatorCoursesPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  return (
    <DashboardLayout userRole="coordinator">
      <CourseManagement />
    </DashboardLayout>
  )
}
