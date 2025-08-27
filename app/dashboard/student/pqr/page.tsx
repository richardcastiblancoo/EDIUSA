"use client";

import { useAuth } from "@/lib/auth-context";
import PQRForm from "@/components/student/pqr-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PQRPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para acceder a esta página.",
        variant: "destructive",
      });
    } else {
      setIsLoading(false);
    }
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return user ? <PQRForm studentId={user.id} /> : null;
}