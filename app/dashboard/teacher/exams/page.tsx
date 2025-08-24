"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ExamManagement from "@/components/teacher/exam-management"

export default function TeacherExamsPage() {
  
  return (
    <DashboardLayout userRole="teacher">
      <ExamManagement teacherId={""} />
    </DashboardLayout>
  )
}
