"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Search,
  BookOpen,
  Users,
  Clock,
  Calendar,
  Loader2,
  Eye as EyeIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Course, getCourses } from "@/lib/courses"
import { getStudentsForCourse } from "@/lib/students"
import { getTeachers, Teacher } from "@/lib/teachers"

export default function AssistantCourseManagement() {
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, number>>({})
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewingCourse, setPreviewingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, filterLanguage, filterLevel])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [coursesData, teacherData] = await Promise.all([getCourses(), getTeachers()])
      setCourses(coursesData || [])
      setTeachers(teacherData || [])

      // Pre-cargar conteo de inscritos por curso
      const counts: Record<string, number> = {}
      await Promise.all(
        (coursesData || []).map(async (c) => {
          const students = await getStudentsForCourse(c.id)
          counts[c.id] = students.length
        })
      )
      setStudentsByCourse(counts)
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = [...courses]
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      )
    }
    if (filterLanguage !== "all") {
      filtered = filtered.filter((course) => course.language === filterLanguage)
    }
    if (filterLevel !== "all") {
      filtered = filtered.filter((course) => course.level === filterLevel)
    }
    setFilteredCourses(filtered)
  }

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "No asignado"
    const t = teachers.find((x) => x.id === teacherId)
    return t?.name || "No asignado"
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toISOString().slice(0, 10)
  }

  const handleGenerateReport = () => {
    try {
      const header = [
        "ID",
        "Nombre",
        "Idioma",
        "Nivel",
        "Profesor",
        "Inscritos",
        "Máx Estudiantes",
        "Duración (semanas)",
        "Horas/semana",
        "Inicio",
        "Fin",
        "Horario",
      ]
      const rows = filteredCourses.map((c) => [
        c.id,
        c.name,
        c.language,
        c.level,
        getTeacherName(c.teacher_id),
        String(studentsByCourse[c.id] || 0),
        String(c.max_students ?? ""),
        String(c.duration_weeks ?? ""),
        String(c.hours_per_week ?? ""),
        formatDate(c.start_date),
        formatDate(c.end_date),
        c.schedule ?? "",
      ])
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "reporte_cursos.csv"
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: "Reporte generado", description: "Se descargó reporte_cursos.csv" })
    } catch (error) {
      console.error("Error generando reporte:", error)
      toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Asistente: Gestión de Cursos</h2>
          <p className="text-gray-600">
            Administra y consulta cursos. No se permite eliminar. Genera reportes CSV.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra cursos por idioma y nivel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Inglés">Inglés</SelectItem>
                  <SelectItem value="Español">Español</SelectItem>
                  <SelectItem value="Francés">Francés</SelectItem>
                  <SelectItem value="Italiano">Italiano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <CardDescription>{course.language}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={
                        course.level === "Inicial"
                          ? "bg-green-600"
                          : course.level === "Intermedio"
                          ? "bg-yellow-600"
                          : "bg-purple-600"
                      }
                    >
                      {course.level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    )}

                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Profesor:</span> {getTeacherName(course.teacher_id)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration_weeks ?? "-"}w
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(studentsByCourse[course.id] || 0)} / {course.max_students ?? "-"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {course.hours_per_week ?? "-"}h/sem
                      </div>
                    </div>

                    {course.schedule && (
                      <div className="text-sm">
                        <span className="font-medium">Horario:</span> {course.schedule}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setPreviewingCourse(course)
                          setIsPreviewDialogOpen(true)
                        }}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" /> Previsualizar
                      </Button>
                      {/* Importante: No hay opción de eliminar aquí */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
                <p className="text-gray-500">Ajusta los filtros o verifica la búsqueda</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewingCourse?.name}</DialogTitle>
            <DialogDescription>Detalles del curso</DialogDescription>
          </DialogHeader>
          {previewingCourse && (
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Código:</span> {previewingCourse.code ?? "-"}</div>
              <div><span className="font-semibold">Idioma:</span> {previewingCourse.language}</div>
              <div><span className="font-semibold">Nivel:</span> {previewingCourse.level}</div>
              <div><span className="font-semibold">Profesor:</span> {getTeacherName(previewingCourse.teacher_id)}</div>
              <div><span className="font-semibold">Inscritos:</span> {studentsByCourse[previewingCourse.id] || 0}</div>
              <div><span className="font-semibold">Capacidad:</span> {previewingCourse.max_students ?? "-"}</div>
              <div><span className="font-semibold">Duración:</span> {previewingCourse.duration_weeks ?? "-"} semanas</div>
              <div><span className="font-semibold">Horas por semana:</span> {previewingCourse.hours_per_week ?? "-"}</div>
              <div><span className="font-semibold">Inicio:</span> {formatDate(previewingCourse.start_date)}</div>
              <div><span className="font-semibold">Fin:</span> {formatDate(previewingCourse.end_date)}</div>
              {previewingCourse.schedule && (
                <div><span className="font-semibold">Horario:</span> {previewingCourse.schedule}</div>
              )}
              {previewingCourse.room && (
                <div><span className="font-semibold">Aula:</span> {previewingCourse.room}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}