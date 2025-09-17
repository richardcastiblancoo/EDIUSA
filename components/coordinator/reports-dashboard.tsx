"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { FileText, Calendar, TrendingUp, CheckCircle, Loader2, ListX, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase" // Agregamos la importación de supabase

// --- Interfaces y datos de ejemplo ---
interface LessonReport {
  lessonName: string
  date: string
  attendance: "Presente" | "Ausente" | "Tarde"
  notes: number
}

interface CourseReport {
  courseId: string
  courseName: string
  lessons: LessonReport[]
}

interface StudentReportData {
  studentName: string
  studentId: string
  overallAvgNotes: number
  overallAttendanceRate: number
  courses: CourseReport[]
}

interface Coordinator {
  id: string
  name: string
  email: string
  role: "coordinator"
  created_at: string
}

const mockStudentData: StudentReportData = {
  studentName: "Juan Pérez",
  studentId: "STU001",
  overallAvgNotes: 0,
  overallAttendanceRate: 0,
  courses: [
    {
      courseId: "ENG101",
      courseName: "Inglés - Nivel B1",
      lessons: [
        { lessonName: "Introducción", date: "2025-08-01", attendance: "Ausente", notes: 0 },
        { lessonName: "Gramática I", date: "2025-08-03", attendance: "Ausente", notes: 0 },
        { lessonName: "Conversación", date: "2025-08-05", attendance: "Ausente", notes: 0 },
        { lessonName: "Vocabulario", date: "2025-08-08", attendance: "Ausente", notes: 0 },
        { lessonName: "Evaluación I", date: "2025-08-10", attendance: "Ausente", notes: 0 },
      ],
    },
    {
      courseId: "FRE201",
      courseName: "Francés - Nivel A2",
      lessons: [
        { lessonName: "Salud", date: "2025-08-02", attendance: "Ausente", notes: 0 },
        { lessonName: "La familia", date: "2025-08-04", attendance: "Ausente", notes: 0 },
        { lessonName: "Evaluación I", date: "2025-08-06", attendance: "Ausente", notes: 0 },
      ],
    },
    {
      courseId: "ESP301",
      courseName: "Español - Nivel C1",
      lessons: [],
    },
  ],
}

// --- Componente principal ---
export default function StudentReportDashboard() {
  const [reportData, setReportData] = useState<StudentReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("summary")
  const reportRef = useRef<HTMLDivElement>(null)
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null)

  // Función para obtener los datos del coordinador
  const fetchCoordinatorData = async () => {
    try {
      const { data: coordinatorData, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('role', 'coordinator')
        .single()

      if (error) throw error

      if (coordinatorData) {
        setCoordinator(coordinatorData as Coordinator)
      }
    } catch (error) {
      console.error('Error al obtener datos del coordinador:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del coordinador.",
        variant: "destructive",
      })
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Obtener datos del estudiante y sus matrículas
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          student:users!student_id(id, name),
          course:courses(
            id,
            name,
            lessons(
              id,
              title,
              due_date
            )
          )
        `)
        .eq('status', 'active')

      if (enrollmentError) throw enrollmentError

      if (enrollmentData && enrollmentData.length > 0) {
        // Obtener asistencia y notas para cada lección
        const coursesData = await Promise.all(
          enrollmentData.map(async (enrollment) => {
            const lessons = enrollment.course.lessons || []
            const lessonReports = await Promise.all(
              lessons.map(async (lesson: any) => {
                // Obtener asistencia
                const { data: attendanceData } = await supabase
                  .from('attendance')
                  .select('status')
                  .eq('enrollment_id', enrollment.id)
                  .eq('lesson_id', lesson.id)
                  .single()

                // Obtener notas
                const { data: gradeData } = await supabase
                  .from('grades')
                  .select('score')
                  .eq('enrollment_id', enrollment.id)
                  .eq('lesson_id', lesson.id)
                  .single()

                return {
                  lessonName: lesson.title,
                  date: lesson.due_date,
                  attendance: attendanceData?.status || "Ausente",
                  notes: gradeData?.score || 0
                }
              })
            )

            return {
              courseId: enrollment.course.id,
              courseName: enrollment.course.name,
              lessons: lessonReports
            }
          })
        )

        const formattedData: StudentReportData = {
          studentName: enrollmentData[0].student.name,
          studentId: enrollmentData[0].student.id,
          overallAvgNotes: calculateOverallAverage(coursesData),
          overallAttendanceRate: calculateOverallAttendance(coursesData),
          courses: coursesData
        }

        setReportData(formattedData)
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].courseId)
        }
      } else {
        // Si no hay datos, usar los datos de ejemplo
        setReportData(mockStudentData)
        if (mockStudentData.courses.length > 0) {
          setSelectedCourseId(mockStudentData.courses[0].courseId)
        }
      }
    } catch (error) {
      console.error('Error al obtener datos del reporte:', error)
      // En caso de error, usar los datos de ejemplo
      setReportData(mockStudentData)
      if (mockStudentData.courses.length > 0) {
        setSelectedCourseId(mockStudentData.courses[0].courseId)
      }
      toast({
        title: "Error",
        description: "Error al cargar los datos del reporte. Usando datos de ejemplo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
      toast({
        title: "Reporte actualizado",
        description: "Los datos del reporte han sido cargados.",
      })
    }
  }

  // Función auxiliar para calcular el promedio general
  const calculateOverallAverage = (courses: any[]): number => {
    if (!courses || courses.length === 0) return 0
    const allNotes = courses.flatMap(course => 
      course.lessons?.map((lesson: any) => lesson.notes) || []
    )
    return allNotes.length > 0 
      ? allNotes.reduce((acc: number, curr: number) => acc + curr, 0) / allNotes.length 
      : 0
  }

  // Función auxiliar para calcular la asistencia general
  const calculateOverallAttendance = (courses: any[]): number => {
    if (!courses || courses.length === 0) return 0
    const allLessons = courses.flatMap(course => course.lessons || [])
    if (allLessons.length === 0) return 0
    const presentCount = allLessons.filter((lesson: any) => 
      lesson.attendance === "Presente"
    ).length
    return (presentCount / allLessons.length) * 100
  }

  useEffect(() => {
    fetchCoordinatorData()
    fetchReportData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchReportData()
  }

  const calculateAverage = (lessons: LessonReport[]): number => {
    if (!lessons || lessons.length === 0) return 0
    const totalNotes = lessons.reduce((acc, curr) => acc + curr.notes, 0)
    return totalNotes / lessons.length
  }

  const calculateAttendanceRate = (lessons: LessonReport[]): number => {
    if (!lessons || lessons.length === 0) return 0
    const presentCount = lessons.filter((l) => l.attendance === "Presente").length
    return (presentCount / lessons.length) * 100
  }

  const handleExportPdf = async () => {
    setExporting(true)
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, { scale: 2 })
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")
        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft > 0) {
          position = -heightLeft
          pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`reporte-${reportData?.studentName || "estudiante"}.pdf`)
        toast({
          title: "Éxito",
          description: "Reporte PDF generado exitosamente.",
        })
      } catch (error) {
        console.error("Error al generar el PDF:", error)
        toast({
          title: "Error",
          description: "No se pudo generar el reporte PDF. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Error",
        description: "No se encontró el contenido para generar el PDF.",
        variant: "destructive",
      })
    }
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Cargando reporte...</span>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">No se pudo cargar el reporte del estudiante.</p>
        <Button onClick={handleRefresh}>Reintentar</Button>
      </div>
    )
  }

  const selectedCourse = reportData.courses.find(
    (course) => course.courseId === selectedCourseId
  )
  const lessonNotesData = selectedCourse?.lessons.map((lesson) => ({
    name: lesson.lessonName,
    notes: lesson.notes,
  })) ?? []

  const courseAvgNotes = calculateAverage(selectedCourse?.lessons ?? [])
  const courseAttendanceRate = calculateAttendanceRate(selectedCourse?.lessons ?? [])

  const getAttendanceBadge = (attendance: string) => {
    switch (attendance) {
      case "Presente":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            Presente
          </Badge>
        )
      case "Ausente":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            Ausente
          </Badge>
        )
      case "Tarde":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            Tarde
          </Badge>
        )
      default:
        return <Badge variant="secondary">N/A</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm text-muted-foreground mb-2">
            Coordinador: {coordinator?.name || 'Cargando...'}
            <span className="ml-2 text-xs text-gray-400">
              ({coordinator?.email || ''})
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Reporte de {reportData.studentName}
          </h2>
          <p className="text-muted-foreground mt-1">
            Análisis de rendimiento y asistencia
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button onClick={handleExportPdf} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white rounded-xl shadow-lg p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Resumen del Estudiante</TabsTrigger>
            <TabsTrigger value="details">Detalle de Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card
                className="border-l-4 border-blue-600 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab("details")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Promedio General de Notas
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.overallAvgNotes.toFixed(1)}%</div>
                  <Progress value={reportData.overallAvgNotes} className="mt-2 h-2 bg-blue-100" />
                </CardContent>
              </Card>

              <Card
                className="border-l-4 border-green-600 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab("details")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Tasa de Asistencia
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.overallAttendanceRate.toFixed(1)}%</div>
                  <Progress value={reportData.overallAttendanceRate} className="mt-2 h-2 bg-green-100" />
                </CardContent>
              </Card>

              <Card
                className="border-l-4 border-purple-600 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab("details")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Cursos Activos
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.courses.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cursos registrados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between flex-row flex-wrap gap-4">
                <div>
                  <CardTitle>Detalle de Curso</CardTitle>
                  <CardDescription>Selecciona un curso para ver el desglose detallado</CardDescription>
                </div>
                <div className="w-[250px]">
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportData.courses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId}>
                          {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCourse ? (
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="border-l-4 border-slate-600">
                        <CardHeader>
                          <CardTitle>Promedio de Notas por Lección</CardTitle>
                          <CardDescription>Progreso visual de las calificaciones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {lessonNotesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={lessonNotesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="notes" fill="#475569" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                              <ListX size={48} className="mb-2" />
                              <p>No hay datos de notas para este curso.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-slate-600">
                        <CardHeader>
                          <CardTitle>Resumen del Curso</CardTitle>
                          <CardDescription>Estadísticas clave del curso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-600">Promedio del Curso:</span>
                              <Badge variant="secondary" className="text-base">
                                {courseAvgNotes.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-600">Tasa de Asistencia:</span>
                              <Badge variant="secondary" className="text-base">
                                {courseAttendanceRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <h3 className="text-xl font-semibold mt-8">Registro de Lecciones</h3>
                    {selectedCourse.lessons.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead>Lección</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Asistencia</TableHead>
                              <TableHead className="text-right">Notas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCourse.lessons.map((lesson, index) => (
                              <TableRow key={index}>
                                <TableCell>{lesson.lessonName}</TableCell>
                                <TableCell className="text-muted-foreground">{lesson.date}</TableCell>
                                <TableCell>{getAttendanceBadge(lesson.attendance)}</TableCell>
                                <TableCell className="text-right font-medium">{lesson.notes}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <ListX size={64} className="mb-4" />
                        <p className="text-lg font-medium">No se encontraron lecciones para este curso.</p>
                        <p className="text-sm mt-1">
                          Por favor, selecciona otro curso o verifica los datos.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecciona un curso para ver los detalles.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}