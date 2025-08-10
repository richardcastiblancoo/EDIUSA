"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, FileText, Award } from "lucide-react"

export default function StudentDashboard() {
  const enrolledCourses = [
    {
      name: "Inglés Intermedio",
      progress: 75,
      nextClass: "Mañana 8:00 AM",
      teacher: "Prof. García",
    },
    {
      name: "Francés Básico",
      progress: 45,
      nextClass: "Viernes 10:00 AM",
      teacher: "Prof. Dubois",
    },
  ]

  const upcomingExams = [
    { subject: "Inglés Intermedio", date: "25 Enero 2024", time: "9:00 AM" },
    { subject: "Francés Básico", date: "28 Enero 2024", time: "11:00 AM" },
  ]

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Estudiante</h2>
          <p className="text-muted-foreground">Sigue tu progreso académico</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Clase</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Mañana</div>
              <p className="text-xs text-muted-foreground">8:00 AM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2</div>
              <p className="text-xs text-muted-foreground">Sobre 5.0</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Enrolled Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos</CardTitle>
              <CardDescription>Cursos en los que estás inscrito</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.map((course, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{course.name}</h4>
                      <span className="text-sm text-muted-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{course.teacher}</p>
                    <p className="text-sm font-medium text-blue-600">Próxima clase: {course.nextClass}</p>
                    <Button size="sm" className="mt-2">
                      Ver Curso
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Exámenes</CardTitle>
              <CardDescription>Exámenes programados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingExams.map((exam, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold">{exam.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exam.date} - {exam.time}
                    </p>
                    <Button size="sm" className="mt-2">
                      Iniciar Examen
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
