"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import LessonManagement from "@/components/teacher/lesson-management"
import { supabase } from "@/lib/supabase"

export default function TeacherLessonsPage() {
  const [teacherId, setTeacherId] = useState<string>("");

  useEffect(() => {
    const getTeacherId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
      }
    };
    getTeacherId();
  }, []);
  
  return (
    <DashboardLayout userRole="teacher">
      <LessonManagement teacherId={teacherId} />
    </DashboardLayout>
  )
}