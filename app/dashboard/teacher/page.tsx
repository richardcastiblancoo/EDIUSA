"use client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

// Asegúrate de configurar estas variables de entorno en tu proyecto.
// Es la forma más segura de manejar tus claves.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)

export default function TeacherDashboard() {
  const [myCourses, setMyCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from("courses").select("*")

      if (error) {
        console.error("Error fetching courses:", error)
        // Podrías mostrar un mensaje de error al usuario aquí
      } else {
        setMyCourses(data as Course[] ?? [])
      }
      setIsLoading(false)
    }

    fetchCourses()
  }, [])

const totalStudents = myCourses.reduce((sum, course: { students: number }) => sum + course.students, 0)

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
                    <p className="text-xs text-muted-foreground">Total estudiantes</p>
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
                  <CardHeader>
                    <CardTitle>Mis Cursos</CardTitle>
                    <CardDescription>Cursos que estás enseñando actualmente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myCourses.length > 0 ? (
                      <motion.div
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {myCourses.map((course, index) => (
                          <motion.div
                            key={index}
                            className="border rounded-lg p-4"
                            variants={itemVariants}
                            whileHover={cardHoverEffect}
                          >
                            <h4 className="font-semibold">{(course as {name: string}).name}</h4>
                            <p className="text-sm text-muted-foreground">{(course as {students: number}).students} estudiantes</p>
                            <p className="text-sm text-muted-foreground">{(course as {schedule: string}).schedule}</p>
                            <p className="text-sm font-medium text-blue-600 mt-2">Próxima clase: {(course as {nextClass: string}).nextClass}</p>
                            <Button size="sm" className="mt-2">
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