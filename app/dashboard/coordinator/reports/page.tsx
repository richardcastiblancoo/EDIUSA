"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ReportsDashboard from "@/components/coordinator/reports-dashboard"

export default function CoordinatorReportsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  return (
    <DashboardLayout userRole="coordinator">
      <ReportsDashboard coordinatorId={user.id} />
    </DashboardLayout>
  )
}
