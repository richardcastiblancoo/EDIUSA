"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ExamManagement from "@/components/teacher/exam-management"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function TeacherExamsPage() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="p-4 text-red-500">
          Error: No se ha podido cargar la información del usuario. Por favor, inicia sesión nuevamente.
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout userRole="teacher">
      <ExamManagement teacherId={user.id} />
    </DashboardLayout>
  )
}
