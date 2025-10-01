"use client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout" // Ruta que debes validar
import AIChat from "@/components/shared/ai-chat"

export default function AIAssistantPage() {
    // ... tu lógica de autenticación y JSX del chat ...
    // ...
    return (
        <DashboardLayout>
          <div className="space-y-6">
            {/* ... */}
            <AIChat />
          </div>
        </DashboardLayout>
    )
}