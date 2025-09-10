"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { getStudentGrades } from "@/lib/students"
import { supabase } from "@/lib/supabase"

export default function StudentGradesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        
        // Obtener las inscripciones del estudiante
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('id, course:courses(id, name)')
          .eq('student_id', user.id)
        
        if (enrollmentsError) throw enrollmentsError
        
        if (!enrollments || enrollments.length === 0) {
          setGrades([])
          return
        }
        
        // Obtener los exámenes y sus calificaciones
        const { data: examSubmissions, error: submissionsError } = await supabase
          .from('exam_submissions')
          .select(`
            id,
            score,
            submitted_at,
            exam:exams(id, title, course_id)
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false })
        
        if (submissionsError) throw submissionsError
        
        // Formatear los datos para mostrarlos
        const formattedGrades = examSubmissions.map(submission => {
          const course = enrollments.find(e => e.course.id === submission.exam.course_id)
          return {
            id: submission.id,
            exam_name: submission.exam.title,
            course_name: course?.course?.name || 'Curso sin nombre',
            score: submission.score,
            created_at: new Date(submission.submitted_at).toLocaleDateString(),
            time: new Date(submission.submitted_at).toLocaleTimeString()
          }
        })
        
        setGrades(formattedGrades)
      } catch (error) {
        console.error('Error al cargar calificaciones:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar tus calificaciones',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchGrades()
  }, [user?.id])

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>
    return <Badge className="bg-red-100 text-red-800">Insuficiente</Badge>
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calificaciones</h2>
          <p className="text-muted-foreground">Consulta tus calificaciones por examen y curso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de calificaciones</CardTitle>
            <CardDescription>Tus calificaciones por examen y curso</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando calificaciones...</p>
            ) : grades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes calificaciones registradas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Examen</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{grade.exam_name}</TableCell>
                      <TableCell>{grade.course_name}</TableCell>
                      <TableCell>{grade.score}</TableCell>
                      <TableCell>{getScoreBadge(grade.score)}</TableCell>
                      <TableCell>{grade.created_at}</TableCell>
                      <TableCell>{grade.time}</TableCell>
                    </TableRow>
                  ))}                  
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}