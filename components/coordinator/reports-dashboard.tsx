"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FileText, Calendar, TrendingUp, CheckCircle, Loader2, ListX, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

// --- Interfaces y datos de ejemplo ---
interface LessonReport {
  lessonName: string
  date: string
  attendance: "Presente" | "Ausente" | "Tarde"
  notes: number
}
interface ExamReport {
  title: string
  date: string
}
interface CourseReport {
  courseId: string
  courseName: string
  lessons: LessonReport[]
  teacher?: {
    id: string
    name: string
    email?: string
  } | null
  exams?: ExamReport[]
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

interface TeacherInfo {
  id: string
  name: string
  email?: string
  assignedCourses: number
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
        { lessonName: "Introducción", date: "2025-08-01", attendance: "Presente", notes: 85 },
        { lessonName: "Gramática I", date: "2025-08-03", attendance: "Presente", notes: 78 },
        { lessonName: "Conversación", date: "2025-08-05", attendance: "Tarde", notes: 92 },
        { lessonName: "Vocabulario", date: "2025-08-08", attendance: "Ausente", notes: 0 },
        { lessonName: "Evaluación I", date: "2025-08-10", attendance: "Presente", notes: 95 },
      ],
    },
    {
      courseId: "FRE201",
      courseName: "Francés - Nivel A2",
      lessons: [
        { lessonName: "Salud", date: "2025-08-02", attendance: "Presente", notes: 88 },
        { lessonName: "La familia", date: "2025-08-04", attendance: "Presente", notes: 75 },
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
/**
 * Este componente implementa la lógica del diagrama:
 * 1. Muestra un "Reporte de Estudiante" (`Tipo de Reporte: Informacion`).
 * 2. Muestra el nombre y las notas generales del estudiante (`Informacion -> Apellidos` y `Notas`).
 * 3. Permite un desglose detallado por "Curso", con "Asistencia" y "Notas".
 */
export default function StudentReportDashboard() {
  const [reportData, setReportData] = useState<StudentReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("summary")
  const reportRef = useRef<HTMLDivElement>(null)
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null)
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null)

  // Función auxiliar para calcular el promedio general de notas (`Notas` a nivel general)
  const calculateOverallAverage = (courses: CourseReport[]): number => {
    if (!courses || courses.length === 0) return 0
    const allNotes = courses.flatMap(course =>
      course.lessons?.filter(lesson => lesson.notes > 0).map(lesson => lesson.notes) || []
    )
    return allNotes.length > 0
      ? allNotes.reduce((acc: number, curr: number) => acc + curr, 0) / allNotes.length
      : 0
  }

  // Función auxiliar para calcular la asistencia general (`Asistencia` a nivel general)
  const calculateOverallAttendance = (courses: CourseReport[]): number => {
    if (!courses || courses.length === 0) return 0
    const allLessons = courses.flatMap(course => course.lessons || [])
    if (allLessons.length === 0) return 0
    const presentCount = allLessons.filter(lesson => lesson.attendance === "Presente" || lesson.attendance === "Tarde").length
    return (presentCount / allLessons.length) * 100
  }

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
            teachers:teacher_id (
              id,
              name,
              email
            ),
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
        const coursesData = await Promise.all(
          enrollmentData.map(async (enrollment: any) => {
            const lessons = enrollment.course.lessons || []
            const lessonReports = await Promise.all(
              lessons.map(async (lesson: any) => {
                const { data: attendanceData } = await supabase
                  .from('attendance')
                  .select('status')
                  .eq('enrollment_id', enrollment.id)
                  .eq('lesson_id', lesson.id)
                  .single()

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

            // NUEVO: cargar exámenes del curso
            const { data: examsData } = await supabase
              .from('exams')
              .select('title, due_date')
              .eq('course_id', enrollment.course.id)
              .order('due_date', { ascending: true })

            const examReports: ExamReport[] = (examsData || []).map((exam: any) => ({
              title: exam.title,
              date: exam.due_date,
            }))

            const teacher = enrollment.course?.teachers
              ? {
                id: enrollment.course.teachers.id,
                name: enrollment.course.teachers.name,
                email: enrollment.course.teachers.email,
              }
              : null

            return {
              courseId: enrollment.course.id,
              courseName: enrollment.course.name,
              lessons: lessonReports,
              teacher,
              exams: examReports,
            }
          })
        )

        // Estructura de datos que representa el reporte del estudiante
        const formattedData: StudentReportData = {
          studentName: enrollmentData[0].student.name,
          studentId: enrollmentData[0].student.id,
          overallAvgNotes: calculateOverallAverage(coursesData),
          overallAttendanceRate: calculateOverallAttendance(coursesData),
          courses: coursesData,
        }

        setReportData(formattedData)
        if (coursesData.length > 0) {
          setSelectedCourseId(coursesData[0].courseId)
        }
      } else {
        // Usar los datos de ejemplo si no hay datos reales
        const calculatedMockData = {
          ...mockStudentData,
          overallAvgNotes: calculateOverallAverage(mockStudentData.courses),
          overallAttendanceRate: calculateOverallAttendance(mockStudentData.courses),
        }
        setReportData(calculatedMockData)
        if (mockStudentData.courses.length > 0) {
          setSelectedCourseId(mockStudentData.courses[0].courseId)
        }
      }
    } catch (error) {
      console.error('Error al obtener datos del reporte:', error)
      const calculatedMockData = {
        ...mockStudentData,
        overallAvgNotes: calculateOverallAverage(mockStudentData.courses),
        overallAttendanceRate: calculateOverallAttendance(mockStudentData.courses),
      }
      setReportData(calculatedMockData)
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

  // Effect para cargar datos iniciales
  useEffect(() => {
    fetchCoordinatorData()
    fetchReportData()
  }, [])

  // Effect para actualizar la info del profesor al cambiar el curso
  useEffect(() => {
    const updateTeacherInfo = async () => {
      if (!reportData) {
        setTeacherInfo(null)
        return
      }
      const currentCourse = reportData.courses.find(c => c.courseId === selectedCourseId)
      const t = currentCourse?.teacher
      if (!t?.id) {
        setTeacherInfo(null)
        return
      }
      try {
        const { count, error } = await supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', t.id)
        if (error) throw error
        setTeacherInfo({
          id: t.id,
          name: t.name,
          email: t.email,
          assignedCourses: count ?? 0,
        })
      } catch (e) {
        console.error('Error al obtener cursos asignados del profesor:', e)
        setTeacherInfo({
          id: t.id,
          name: t.name,
          email: t.email,
          assignedCourses: 0,
        })
      }
    }

    if (selectedCourseId) {
      updateTeacherInfo()
    } else {
      setTeacherInfo(null)
    }
  }, [selectedCourseId, reportData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchReportData()
  }

  // Función para calcular el promedio de notas por lección (`Notas` por curso)
  const calculateAverage = (lessons: LessonReport[]): number => {
    if (!lessons || lessons.length === 0) return 0
    const scoredLessons = lessons.filter(l => l.notes > 0);
    if (scoredLessons.length === 0) return 0;
    const totalNotes = scoredLessons.reduce((acc, curr) => acc + curr.notes, 0)
    return totalNotes / scoredLessons.length
  }

  // Función para calcular la tasa de asistencia por lección (`Asistencia` por curso)
  const calculateAttendanceRate = (lessons: LessonReport[]): number => {
    if (!lessons || lessons.length === 0) return 0
    const presentCount = lessons.filter((l) => l.attendance === "Presente" || l.attendance === "Tarde").length
    return (presentCount / lessons.length) * 100
  }

  // NUEVO: formateo de fecha exacta (`fecha` del reporte)
  const formatExactDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
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

  // El diagrama muestra que se puede filtrar por "Curso"
  const selectedCourse = reportData.courses.find((course) => course.courseId === selectedCourseId)
  const lessonNotesData = selectedCourse?.lessons.map((lesson) => ({
    name: lesson.lessonName,
    notes: lesson.notes,
  })) ?? []
  const courseAvgNotes = calculateAverage(selectedCourse?.lessons ?? [])
  const courseAttendanceRate = calculateAttendanceRate(selectedCourse?.lessons ?? [])

  // NUEVO: combinar lecciones y exámenes
  const combinedRecords = (
    [
      ...(selectedCourse?.lessons ?? []).map(l => ({
        type: "Lección" as const,
        name: l.lessonName,
        date: l.date,
        attendance: l.attendance,
        notes: l.notes,
      })),
      ...(selectedCourse?.exams ?? []).map(e => ({
        type: "Examen" as const,
        name: e.title,
        date: e.date,
        attendance: null as any,
        notes: null as any,
      })),
    ] as Array<{ type: "Lección" | "Examen"; name: string; date: string; attendance?: string | null; notes?: number | null; }>
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex-1">
          {/* El diagrama menciona "Tipo de Reporte: Informacion" */}
          <h1 className="text-3xl font-bold tracking-tight">
            Reporte de {reportData.studentName}
          </h1>
          <p className="text-muted-foreground mt-1">Análisis de rendimiento y asistencia</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button onClick={handleRefresh} disabled={refreshing || loading}>
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Actualizar Datos
              </>
            )}
          </Button>
          <Button onClick={handleExportPdf} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Exportando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" /> Exportar a PDF
              </>
            )}
          </Button>
        </div>
      </div>
      <div ref={reportRef} className="space-y-6 bg-white rounded-xl shadow-lg p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-muted-foreground">
              Coordinador: {coordinator?.name || 'Cargando...'}
            </h2>
            <span className="text-xs text-gray-400">
              ({coordinator?.email || ''})
            </span>
          </div>
          <div className="flex-1 text-right">
            <h2 className="text-lg font-medium text-muted-foreground">
              Profesor asignado: {teacherInfo?.name ?? "No asignado"}
            </h2>
            {teacherInfo?.email ? (
              <span className="text-xs text-gray-400">
                ({teacherInfo.email})
              </span>
            ) : null}
            <div className="mt-1 text-xs text-muted-foreground">
              Cursos asignados: <strong className="ml-1">{teacherInfo?.assignedCourses ?? 0}</strong>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Resumen del Estudiante</TabsTrigger>
            <TabsTrigger value="details">Detalle de Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-l-4 border-blue-600 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("details")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  {/* El diagrama menciona "Notas" a nivel de estudiante */}
                  <CardTitle className="text-sm font-medium text-gray-500">Promedio General de Notas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.overallAvgNotes.toFixed(1)}%</div>
                  <Progress value={reportData.overallAvgNotes} className="mt-2 h-2 bg-blue-100" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-green-600 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("details")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  {/* El diagrama menciona "Asistencia" a nivel de estudiante */}
                  <CardTitle className="text-sm font-medium text-gray-500">Tasa de Asistencia</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData.overallAttendanceRate.toFixed(1)}%</div>
                  <Progress value={reportData.overallAttendanceRate} className="mt-2 h-2 bg-green-100" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-purple-600 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("details")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Cursos Activos</CardTitle>
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
                {/* La selección del curso corresponde al "Curso" del diagrama */}
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
                    <div className="rounded-md border bg-gray-50 p-3">
                      <p className="text-sm text-gray-600">Profesor asignado:</p>
                      <p className="font-medium">
                        {selectedCourse.teacher?.name ?? "No asignado"}
                        {selectedCourse.teacher?.email ? (
                          <span className="text-sm text-muted-foreground"> ({selectedCourse.teacher.email})</span>
                        ) : null}
                      </p>
                    </div>

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
                              {/* Esta sección muestra "Notas" por curso */}
                              <span className="font-medium text-gray-600">Promedio del Curso:</span>
                              <Badge variant="secondary" className="text-base">
                                {courseAvgNotes.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              {/* Esta sección muestra "Asistencia" por curso */}
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
                    {combinedRecords.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        {/* Esta tabla muestra los "Períodos" (lecciones/exámenes), con "Fecha", "Asistencia" y "Notas" */}
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Lección</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Asistencia</TableHead>
                              <TableHead className="text-right">Notas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {combinedRecords.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.type}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatExactDate(item.date)}
                                </TableCell>
                                <TableCell>
                                  {item.type === "Lección"
                                    ? getAttendanceBadge(item.attendance || "N/A")
                                    : <span className="text-gray-400">—</span>}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.type === "Lección" ? `${item.notes}%` : <span className="text-gray-400">—</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <ListX size={64} className="mb-4" />
                        <p className="text-lg font-medium">No se encontraron actividades (lecciones/exámenes) para este curso.</p>
                        <p className="text-sm mt-1">Por favor, selecciona otro curso o verifica los datos.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Selecciona un curso para ver los detalles.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}