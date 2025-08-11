"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeacherStudentsPage() {
  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estudiantes</h2>
          <p className="text-muted-foreground">Gestiona y revisa el progreso de tus estudiantes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Estudiantes de tus cursos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente verás aquí el listado de estudiantes.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}