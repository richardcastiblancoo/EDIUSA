import StudentManagement from "@/components/coordinator/student-management"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function StudentsPage() {
  return (
    <DashboardLayout userRole="coordinator">
      <StudentManagement />
    </DashboardLayout>
  )
}
