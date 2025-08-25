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
            const students = await getStudentsForCourse(assignment.course.id)
            return {
              ...assignment.course,
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
                    <div>
                      <h4 className="text-sm font-medium mb-2">Estudiantes inscritos</h4>
                      <div className="flex flex-wrap gap-2">
                        {course.students.map((student: any) => (
                          <div key={student.id} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photoUrl} />
                              <AvatarFallback>{student.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{student.name}</span>
                          </div>
                        ))}
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