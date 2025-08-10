"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import UserManagement from "@/components/coordinator/user-management"

export default function CoordinatorUsersPage() {
  return (
    <DashboardLayout userRole="coordinator">
      <UserManagement />
    </DashboardLayout>
  )
}
