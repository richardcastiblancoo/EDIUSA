"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeacherCoursesPage() {
  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
          <p className="text-muted-foreground">Listado de cursos que estás enseñando</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximas clases</CardTitle>
            <CardDescription>Resumen de tus próximas sesiones</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aquí aparecerán tus cursos asignados.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}