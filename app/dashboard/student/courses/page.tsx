"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentCoursesPage() {
  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
          <p className="text-muted-foreground">Cursos en los que estás inscrito</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
            <CardDescription>Tu avance por curso</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aquí verás el listado de cursos y tu progreso.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}