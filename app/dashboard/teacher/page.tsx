"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { getStudentsForCourse } from "@/lib/students"

type Course = {
  id: string
  name: string
  description: string | null
  language: string
  level: string
  schedule: string | null
  studentCount: number
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return
      
      setIsLoading(true)
      try {
        // Obtener cursos donde el profesor está asignado
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .eq("teacher_id", user.id)

        if (coursesError) throw coursesError

        // Obtener estudiantes para cada curso
        const coursesWithStudents = await Promise.all(
          (coursesData || []).map(async (course) => {
            const students = await getStudentsForCourse(course.id)
            return {
              ...course,
              studentCount: students.length
            }
          })
        )

        setMyCourses(coursesWithStudents)
        
        // Calcular el total de estudiantes
        const total = coursesWithStudents.reduce((sum, course) => sum + course.studentCount, 0)
        setTotalStudents(total)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [user?.id])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  const cardHoverEffect = {
    scale: 1.05,
    boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.1)",
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Profesor</h2>
          <p className="text-muted-foreground">Gestiona tus cursos y estudiantes</p>
        </div>

        {isLoading ? (
          <div className="text-center text-lg text-muted-foreground">Cargando datos...</div>
        ) : (
          <>
            {/* Quick Stats */}
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} whileHover={cardHoverEffect}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{myCourses.length}</div>
                    <p className="text-xs text-muted-foreground">Cursos activos</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={cardHoverEffect}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStudents}</div>
                    <p className="text-xs text-muted-foreground">Total estudiantes asignados</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* My Courses */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Mis Cursos</CardTitle>
                      <CardDescription>Cursos que estás enseñando actualmente</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myCourses.length > 0 ? (
                      <motion.div
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {myCourses.slice(0, 3).map((course, index) => (
                          <motion.div
                            key={course.id}
                            className="border rounded-lg p-4"
                            variants={itemVariants}
                            whileHover={cardHoverEffect}
                          >
                            <h4 className="font-semibold">{course.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">{course.studentCount} estudiantes</p>
                            </div>
                            {course.schedule && (
                              <p className="text-sm text-muted-foreground">{course.schedule}</p>
                            )}
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => router.push(`/dashboard/teacher/courses`)}
                            >
                              Ver Detalles
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <div className="text-center text-muted-foreground p-8">
                        No hay cursos asignados en este momento.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}