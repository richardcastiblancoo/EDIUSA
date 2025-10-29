"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProfileSettings from "@/components/shared/profile-settings";
import type { User } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }
  const handleUserUpdate = (updatedUser: User) => {
    updateUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };
  return (
    <DashboardLayout
      userRole={user.role === "assistant" ? undefined : user.role}
    >
      <ProfileSettings user={user} onUserUpdate={handleUserUpdate} />
    </DashboardLayout>
  );
}
