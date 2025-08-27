"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, FileText, Award, Loader2, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getStudentCourses } from "@/lib/courses"
import { getStudentExams } from "@/lib/exams"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (!user) {
          toast({
            title: "Error",
            description: "Debes iniciar sesión para ver tu información.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        // Obtener cursos del estudiante
        const studentCourses = await getStudentCourses(user.id)
        setCourses((studentCourses as CourseWithTeacher[]) ?? [])

        // Obtener exámenes del estudiante
        const studentExams = await getStudentExams(user.id)
        setExams((studentExams as Exam[]) ?? [])
      } catch (error) {
        console.error("Error fetching student data:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar tu información.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Formatear hora para mostrar
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Estudiante</h2>
          <p className="text-muted-foreground">Sigue tu progreso académico</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">En progreso</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próxima Clase</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length > 0 ? "Programada" : "N/A"}</div>
                  <p className="text-xs text-muted-foreground">{courses.length > 0 ? "Ver horario" : "Sin clases"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Exámenes</CardTitle>
                  <FileText className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exams.length}</div>
                  <p className="text-xs text-muted-foreground">Próximamente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                  <Award className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Sobre 5.0</p>
                </CardContent>
              </Card>
            </div>

            {/* PQR Section */}
            <Card>
              <CardHeader>
                <CardTitle>PQR</CardTitle>
                <CardDescription>Peticiones, Quejas y Reclamos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Gestiona tus solicitudes</h3>
                    <p className="text-gray-500 mb-4">Envía peticiones, quejas o reclamos relacionados con tus cursos.</p>
                    <Link href="/dashboard/student/pqr">
                      <Button>
                        Crear nueva solicitud
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Enrolled Courses */}
              <Card>
                <CardHeader>
                  <CardTitle>Mis Cursos</CardTitle>
                  <CardDescription>Cursos en los que estás inscrito</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courses.length > 0 ? (
                      courses.map((course, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{(course as any).name}</h4>
                            <span className="text-sm text-muted-foreground">En progreso</span>
                          </div>
                          <Progress value={75} className="mb-2" />
                          <p className="text-sm text-muted-foreground">{(course as any).teachers?.name || 'Profesor no asignado'}</p>
                          {(course as any).schedule && (
                            <p className="text-sm font-medium text-blue-600">Horario: {(course as any).schedule}</p>
                          )}
                          <Link href="/dashboard/student/courses">
                            <Button size="sm" className="mt-2">
                              Ver Curso
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos inscritos</h3>
                        <p className="text-gray-500">Puedes inscribirte a nuevos cursos con un administrador.</p>
                      </div>
                    )}
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
                    {exams.length > 0 ? (
                      exams.map((exam, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{(exam as any).title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate((exam as any).due_date)} - {formatTime((exam as any).due_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Curso: {(exam as any).courses?.name || 'No especificado'}
                          </p>
                          <Button size="sm" className="mt-2">
                            Iniciar Examen
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay exámenes programados</h3>
                        <p className="text-gray-500">No tienes exámenes próximos en este momento.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
