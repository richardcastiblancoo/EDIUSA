"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StudentGradesPage() {
  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calificaciones</h2>
          <p className="text-muted-foreground">Consulta tus notas por examen y curso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de calificaciones</CardTitle>
            <CardDescription>Promedios y últimos resultados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tus calificaciones aparecerán aquí.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}