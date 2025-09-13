"use client"

import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "@/components/layout/dashboard-layout"
import PQRManagement from "@/components/teacher/pqr-management"

export default function TeacherPQRPage() {
  const { user, loading } = useAuth();
  
  return (
    <DashboardLayout userRole="teacher">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : user ? (
        <PQRManagement teacherId={user.id} />
      ) : null}
    </DashboardLayout>
  )
}