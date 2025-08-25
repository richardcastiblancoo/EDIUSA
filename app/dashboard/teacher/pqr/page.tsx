"use client"

import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "@/components/layout/dashboard-layout"
import PQRManagement from "@/components/teacher/pqr-management"

export default function TeacherPQRPage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout userRole="teacher">
      <PQRManagement teacherId={user?.id || ""} />
    </DashboardLayout>
  )
}