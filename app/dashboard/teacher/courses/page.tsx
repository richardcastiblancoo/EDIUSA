"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { getCourseAssignmentsByTeacher } from "@/lib/assignments"
import { getStudentsForCourse } from "@/lib/students"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

export default function TeacherCoursesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return
      
      try {
        const assignments = await getCourseAssignmentsByTeacher(user.id)
        const coursesWithStudents = await Promise.all(
          assignments.map(async (assignment) => {
            // Cambiado de assignment.course_id a assignment.id
            const students = await getStudentsForCourse(assignment.id)
            return {
              ...assignment,
              students
            }
          })
        )
        setCourses(coursesWithStudents)
      } catch (error) {
        console.error("Error cargando cursos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [user?.id])

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
          <p className="text-muted-foreground">Listado de cursos que estás enseñando</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cargando cursos...</p>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">No tienes cursos asignados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id}>                
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mr-2">
                      {course.language}
                    </Badge>
                    <Badge variant="outline">
                      {course.level}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Descripción</h4>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Duración</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.duration_weeks ? `${course.duration_weeks} semanas` : "No especificada"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Horas/Semana</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.hours_per_week ? `${course.hours_per_week} horas` : "No especificado"}
                        </p>
                      </div>
                    </div>
                    
                    {course.schedule && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Horario</h4>
                        <p className="text-sm text-muted-foreground">{course.schedule}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Estudiantes inscritos</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {course.students.length} de {course.max_students || "∞"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {course.students.slice(0, 5).map((student: any) => (
                          <div key={student.id} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photoUrl} />
                              <AvatarFallback>{student.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{student.name}</span>
                          </div>
                        ))}
                        {course.students.length > 5 && (
                          <Badge variant="secondary">+{course.students.length - 5} más</Badge>
                        )}
                        {course.students.length === 0 && (
                          <p className="text-sm text-muted-foreground">No hay estudiantes inscritos</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}