"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, FileText, TrendingUp, Users, BookOpen, GraduationCap, Loader2 } from "lucide-react"
// Define ReportData interface directly in the component file since types module is missing
interface ReportData {
  enrollmentStats: {
    totalStudents: number;
    activeEnrollments: number;
    completedCourses: number;
    dropoutRate: number;
  };
  courseStats: {
    activeCourses: number;
    totalCourses: number;
    capacityUtilization: number;
    averageEnrollment: number;
  };
  teacherStats: {
    activeTeachers: number;
    totalTeachers: number;
    averageCoursesPerTeacher: number;
  };
  languageDistribution: Array<{
    language: string;
    courses: number;
    students: number;
  }>;
  enrollmentTrends: Array<{
    month: string;
    enrollments: number;
  }>;
}

interface ReportsDashboardProps {
  coordinatorId: string // Esta prop ya no se usa, puedes eliminarla si quieres.
}

export default function ReportsDashboard({ coordinatorId }: ReportsDashboardProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchReportData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/dashboard-reports', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        throw new Error("Error al cargar los datos del reporte del dashboard.")
      }

      const data: ReportData = await response.json()
      setReportData(data)
    } catch (error: any) {
      console.error(error)
      setMessage({ type: "error", text: error.message || "Error al cargar los datos del reporte." })
      setReportData(null);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const handleGenerateReport = async () => {
    setGenerating(true)
    setMessage(null)
    // El botón "Generar Reporte" ahora simplemente refresca los datos.
    await fetchReportData()
    setMessage({ type: "success", text: "Reporte actualizado exitosamente." });
    setGenerating(false)
  }
  
  // Si deseas implementar la funcionalidad de "Exportar a PDF",
  // necesitarías una biblioteca como html-to-image o jsPDF.
  const handleExportPdf = () => {
    setMessage({ type: "success", text: "Funcionalidad de exportar a PDF en desarrollo." });
    // Aquí iría la lógica para generar el PDF
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">No se pudieron cargar los datos del reporte.</p>
        <Button onClick={fetchReportData}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
          <p className="text-muted-foreground">Estadísticas y reportes del Centro de Idiomas</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateReport} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Actualizar Reporte
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.enrollmentStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.enrollmentStats.activeEnrollments} inscripciones activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.courseStats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">de {reportData.courseStats.totalCourses} cursos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesores Activos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.teacherStats.activeTeachers}</div>
            <p className="text-xs text-muted-foreground">de {reportData.teacherStats.totalTeachers} profesores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Deserción</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.enrollmentStats.dropoutRate.toFixed(1)}%</div>
            <Progress value={reportData.enrollmentStats.dropoutRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="enrollment">Inscripciones</TabsTrigger>
          <TabsTrigger value="languages">Idiomas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Utilización de Capacidad</CardTitle>
                <CardDescription>Porcentaje de ocupación de los cursos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Capacidad Utilizada</span>
                    <span className="text-sm text-muted-foreground">
                      {reportData.courseStats.capacityUtilization.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={reportData.courseStats.capacityUtilization} />

                  <div className="text-sm text-muted-foreground">
                    <p>Promedio de estudiantes por curso: {reportData.courseStats.averageEnrollment.toFixed(1)}</p>
                    <p>Cursos por profesor: {reportData.teacherStats.averageCoursesPerTeacher.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Idiomas</CardTitle>
                <CardDescription>Estudiantes por idioma</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={reportData.languageDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="students"
                    >
                      {reportData.languageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Inscripciones</CardTitle>
              <CardDescription>Inscripciones por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="enrollments" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Inscripciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Activas</span>
                    <span className="font-bold text-green-600">{reportData.enrollmentStats.activeEnrollments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completadas</span>
                    <span className="font-bold text-blue-600">{reportData.enrollmentStats.completedCourses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tasa de Deserción</span>
                    <span className="font-bold text-red-600">{reportData.enrollmentStats.dropoutRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyecciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Inscripciones Proyectadas (Próximo Mes)</span>
                    <span className="font-bold text-blue-600">
                      {Math.round(
                        reportData.enrollmentTrends[reportData.enrollmentTrends.length - 1]?.enrollments * 1.1,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Capacidad Disponible</span>
                    <span className="font-bold text-green-600">
                      {Math.round(
                        ((100 - reportData.courseStats.capacityUtilization) * reportData.courseStats.totalCourses) /
                          100,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos por Idioma</CardTitle>
              <CardDescription>Distribución de cursos y estudiantes por idioma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.languageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="language" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="courses" fill="#8884d8" name="Cursos" />
                  <Bar dataKey="students" fill="#82ca9d" name="Estudiantes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {reportData.languageDistribution.map((lang, index) => (
              <Card key={lang.language}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{lang.language}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cursos:</span>
                      <span className="font-bold">{lang.courses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Estudiantes:</span>
                      <span className="font-bold">{lang.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Promedio por curso:</span>
                      <span className="font-bold">
                        {lang.courses > 0 ? (lang.students / lang.courses).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Tasa de Retención</span>
                      <span className="text-sm font-medium">
                        {(100 - reportData.enrollmentStats.dropoutRate).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={100 - reportData.enrollmentStats.dropoutRate} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Utilización de Capacidad</span>
                      <span className="text-sm font-medium">
                        {reportData.courseStats.capacityUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={reportData.courseStats.capacityUtilization} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Profesores Activos</span>
                      <span className="text-sm font-medium">
                        {(
                          (reportData.teacherStats.activeTeachers / reportData.teacherStats.totalTeachers) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(reportData.teacherStats.activeTeachers / reportData.teacherStats.totalTeachers) * 100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {reportData.enrollmentStats.dropoutRate > 15 && (
                    <Alert>
                      <AlertDescription>
                        La tasa de deserción es alta ({reportData.enrollmentStats.dropoutRate.toFixed(1)}%). Considera
                        implementar programas de retención.
                      </AlertDescription>
                    </Alert>
                  )}

                  {reportData.courseStats.capacityUtilization < 70 && (
                    <Alert>
                      <AlertDescription>
                        La utilización de capacidad es baja ({reportData.courseStats.capacityUtilization.toFixed(1)}%).
                        Considera estrategias de marketing o reducir el número de cursos.
                      </AlertDescription>
                    </Alert>
                  )}

                  {reportData.courseStats.capacityUtilization > 90 && (
                    <Alert>
                      <AlertDescription>
                        La utilización de capacidad es muy alta ({reportData.courseStats.capacityUtilization.toFixed(1)}
                        %). Considera abrir más secciones o contratar más profesores.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}