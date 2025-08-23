import TeachersManagement from "@/components/coordinator/teachers-management";
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function TeachersPage() {
  return (
    <DashboardLayout>
      <TeachersManagement />
    </DashboardLayout>
  );
}