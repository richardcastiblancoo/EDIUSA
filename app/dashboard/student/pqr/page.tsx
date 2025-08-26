"use client";

import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "@/components/layout/dashboard-layout";
import PQRForm from "@/components/student/pqr-form";

export default function StudentPQRPage() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout userRole="student">
      <PQRForm studentId={user?.id || ""} />
    </DashboardLayout>
  );
}