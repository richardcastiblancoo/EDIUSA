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
import { FileText, Calendar, TrendingUp, CheckCircle, XCircle, Loader2 } from "lucide-react"
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

// Define las interfaces para los datos del reporte de estudiante
interface LessonReport {
  lessonName: string
  date: string // Fecha obligatoria para cada lección
  attendance: "Presente" | "Ausente" | "Tarde"
  notes: number // Notas del estudiante, 0 por defecto si no tiene
}

interface CourseReport {
  courseId: string
  courseName: string
  lessons: LessonReport[]
}

interface StudentReportData {
  studentName: string
  studentId: string
  overallAvgNotes: number // Promedio general, 0 si no tiene notas
  overallAttendanceRate: number // Tasa de asistencia general, 0 si no tiene registros
  courses: CourseReport[]
}

// Datos de ejemplo para el reporte
const mockStudentData: StudentReportData = {
  studentName: "Juan Pérez",
  studentId: "STU001",
  overallAvgNotes: 85,
  overallAttendanceRate: 92,
  courses: [
    {
      courseId: "ENG101",
      courseName: "Inglés - Nivel B1",
      lessons: [
        { lessonName: "Introducción", date: "2025-08-01", attendance: "Presente", notes: 80 },
        { lessonName: "Gramática I", date: "2025-08-03", attendance: "Presente", notes: 75 },
        { lessonName: "Conversación", date: "2025-08-05", attendance: "Presente", notes: 90 },
        { lessonName: "Vocabulario", date: "2025-08-08", attendance: "Presente", notes: 85 },
        { lessonName: "Evaluación I", date: "2025-08-10", attendance: "Presente", notes: 95 },
      ],
    },
    {
      courseId: "FRE201",
      courseName: "Francés - Nivel A2",
      lessons: [
        { lessonName: "Salud", date: "2025-08-02", attendance: "Presente", notes: 88 },
        { lessonName: "La familia", date: "2025-08-04", attendance: "Presente", notes: 82 },
        { lessonName: "Ausente", date: "2025-08-06", attendance: "Ausente", notes: 0 },
      ],
    },
  ],
}

export default function StudentReportDashboard() {
  const [reportData, setReportData] = useState<StudentReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false); // NUEVOS CAMBIOS: estado de carga para exportar
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const reportRef = useRef<HTMLDivElement>(null); // NUEVOS CAMBIOS: crear una referencia para el div del reporte


  // Simular la carga de datos del estudiante
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true)
      // Simular una llamada a la API con un retardo
      setTimeout(() => {
        setReportData(mockStudentData)
        // Selecciona el primer curso por defecto
        if (mockStudentData.courses.length > 0) {
          setSelectedCourseId(mockStudentData.courses[0].courseId)
        }
        setLoading(false)
      }, 1000)
    }

    fetchReportData()
  }, [])

  const handleExportPdf = async () => {
    setExporting(true);
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`reporte-${reportData?.studentName || "estudiante"}.pdf`);
        toast({
          title: "Éxito",
          description: "Reporte PDF generado exitosamente.",
        });
      } catch (error) {
        console.error("Error al generar el PDF:", error);
        toast({
          title: "Error",
          description: "No se pudo generar el reporte PDF. Inténtalo de nuevo.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "No se encontró el contenido para generar el PDF.",
        variant: "destructive"
      });
    }
    setExporting(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando reporte...</span>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">No se pudo cargar el reporte del estudiante.</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  const selectedCourse = reportData.courses.find(
    (course) => course.courseId === selectedCourseId
  )

  const lessonNotesData = selectedCourse?.lessons.map((lesson) => ({
    name: lesson.lessonName,
    notes: lesson.notes,
  }))

  const getAttendanceBadge = (attendance: string) => {
    switch (attendance) {
      case "Presente":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Presente</Badge>
      case "Ausente":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Ausente</Badge>
      case "Tarde":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Tarde</Badge>
      default:
        return <Badge variant="secondary">N/A</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reporte de {reportData.studentName}</h2>
          <p className="text-muted-foreground">Análisis de rendimiento y asistencia</p>
        </div>
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

      {/* NUEVOS CAMBIOS: el ref para capturar el contenido */}
      <div ref={reportRef} className="space-y-4 p-4 bg-white rounded-md shadow-sm">
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Resumen del Estudiante</TabsTrigger>
            <TabsTrigger value="details">Detalle de Cursos</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio de Notas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overallAvgNotes.toFixed(1)}%</div>
                  <Progress value={reportData.overallAvgNotes} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overallAttendanceRate.toFixed(1)}%</div>
                  <Progress value={reportData.overallAttendanceRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.courses.length}</div>
                  <p className="text-xs text-muted-foreground">Cursos registrados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader className="flex items-center justify-between flex-row">
                <div>
                  <CardTitle>Detalle de Curso</CardTitle>
                  <CardDescription>Selecciona un curso para ver el desglose</CardDescription>
                </div>
                <div className="w-[200px]">
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Notas por Lección</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={lessonNotesData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="notes" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Resumen del Curso</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Promedio del Curso:</span>
                              <Badge variant="secondary">
                                {(
                                  selectedCourse.lessons.reduce((acc, curr) => acc + curr.notes, 0) /
                                  selectedCourse.lessons.length
                                ).toFixed(1)}
                                %
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Asistencia del Curso:</span>
                              <Badge variant="secondary">
                                {(
                                  (selectedCourse.lessons.filter((l) => l.attendance === "Presente").length /
                                    selectedCourse.lessons.length) *
                                  100
                                ).toFixed(1)}
                                %
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
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
                            <TableCell>{lesson.date}</TableCell>
                            <TableCell>{getAttendanceBadge(lesson.attendance)}</TableCell>
                            <TableCell className="text-right">{lesson.notes}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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