import DashboardLayout from "@/components/layout/dashboard-layout"
import ReportsDashboard from "@/components/coordinator/reports-dashboard";

export default function StudentsPage() {
  return (
    <DashboardLayout userRole="coordinator">
      <ReportsDashboard />
    </DashboardLayout>
  )
}
