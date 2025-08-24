"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, TrendingUp, UserCheck, ClipboardList, BarChart3 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function CoordinatorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    activeExams: 0,
    enrollmentGrowth: 0,
    completionRate: 0,
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== "coordinator")) {
      router.push("/")
    }

    const fetchStats = async () => {
      let totalStudents = 0;
      let totalTeachers = 0;
      let totalCourses = 0;
      let activeExams = 0;

      // Fetch total students
      const { count: studentsCount, error: studentsError } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'student');
      if (studentsError) {
        console.error('Error fetching students count:', studentsError);
      } else {
        totalStudents = studentsCount || 0;
      }

      // Fetch total teachers
      const { count: teachersCount, error: teachersError } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'teacher');
      if (teachersError) {
        console.error('Error fetching teachers count:', teachersError);
      } else {
        totalTeachers = teachersCount || 0;
      }

      // Fetch total courses
      const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact' });
      if (coursesError) {
        console.error('Error fetching courses count:', coursesError);
      } else {
        totalCourses = coursesCount || 0;
      }

      // Fetch active exams (assuming 'published' status means active)
      const { count: examsCount, error: examsError } = await supabase
        .from('exams')
        .select('*', { count: 'exact' })
        .eq('status', 'published');
      if (examsError) {
        console.error('Error fetching active exams count:', examsError);
      } else {
        activeExams = examsCount || 0;
      }

      setStats({
        totalStudents,
        totalTeachers,
        totalCourses,
        activeExams,
        enrollmentGrowth: 0, // Placeholder, requires more complex logic
        completionRate: 0, // Placeholder, requires more complex logic
      });
    };

    if (user && user.role === "coordinator") {
      fetchStats();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== "coordinator") {
    return null
  }

  const quickActions = [
    {
      title: "Gestionar Usuarios",
      description: "Crear y administrar cuentas de profesores y estudiantes",
      href: "/dashboard/coordinator/users",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Administrar Cursos",
      description: "Crear, editar y asignar cursos a profesores",
      href: "/dashboard/coordinator/courses",
      icon: BookOpen,
      color: "bg-green-500",
    },
    {
      title: "Gestionar Horarios",
      description: "Configurar horarios de clases y aulas",
      href: "/dashboard/coordinator/schedules",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      title: "Ver Reportes",
      description: "Analizar estadísticas y generar reportes",
      href: "/dashboard/coordinator/reports",
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Coordinación</h1>
          <p className="text-gray-600">Bienvenido, {user.name}. Aquí tienes un resumen del centro de idiomas.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">+{stats.enrollmentGrowth}% desde el mes pasado</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profesores Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground">Todos los profesores están activos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Disponibles</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">En 5 idiomas diferentes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exámenes Activos</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeExams}</div>
                <p className="text-xs text-muted-foreground">Programados para esta semana</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <p className="text-xs text-muted-foreground">+2.1% desde el semestre pasado</p>
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.enrollmentGrowth}%</div>
              <p className="text-xs text-muted-foreground">Inscripciones este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={action.href}>Acceder</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}