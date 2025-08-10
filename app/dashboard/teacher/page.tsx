"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Calendar, ClipboardCheck } from "lucide-react"

export default function TeacherDashboard() {
  const myCourses = [
    {
      name: "Inglés Intermedio A",
      students: 25,
      schedule: "Lun-Mie-Vie 8:00-10:00",
      nextClass: "Mañana 8:00 AM",
    },
    {
      name: "Inglés Avanzado B",
      students: 18,
      schedule: "Mar-Jue 14:00-16:00",
      nextClass: "Hoy 2:00 PM",
    },
  ]

  const pendingTasks = [
    { task: "Calificar exámenes Inglés Intermedio", due: "Hoy" },
    { task: "Preparar material para clase avanzada", due: "Mañana" },
    { task: "Reunión con coordinador", due: "Viernes" },
  ]

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Profesor</h2>
          <p className="text-muted-foreground">Gestiona tus cursos y estudiantes</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">43</div>
              <p className="text-xs text-muted-foreground">Total estudiantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clases Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Próxima: 2:00 PM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Tareas por hacer</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* My Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos</CardTitle>
              <CardDescription>Cursos que estás enseñando actualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myCourses.map((course, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{course.name}</h4>
                    <p className="text-sm text-muted-foreground">{course.students} estudiantes</p>
                    <p className="text-sm text-muted-foreground">{course.schedule}</p>
                    <p className="text-sm font-medium text-blue-600 mt-2">Próxima clase: {course.nextClass}</p>
                    <Button size="sm" className="mt-2">
                      Ver Detalles
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
              <CardDescription>Actividades que requieren tu atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTasks.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{item.task}</p>
                      <p className="text-sm text-muted-foreground">Vence: {item.due}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Completar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
