"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import LessonManagement from "@/components/teacher/lesson-management"

export default function TeacherLessonsPage() {
  
  return (
    <DashboardLayout userRole="teacher">
      <LessonManagement teacherId={""} />
    </DashboardLayout>
  )
}