"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import LessonManagement from "@/components/teacher/lesson-management"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function TeacherLessonsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [teacherId, setTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setTeacherId(user.id);
      setLoading(false);
    } else {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del profesor. Por favor, inicia sesión nuevamente.",
        variant: "destructive"
      });
    }
  }, [user]);
  
  if (loading) {
    return (
      <DashboardLayout userRole="teacher">
        <div className="flex items-center justify-center h-full">
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="teacher">
      <LessonManagement teacherId={teacherId} />
    </DashboardLayout>
  )
}