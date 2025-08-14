"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, BookOpen, Users, Clock, Calendar } from "lucide-react"
// Define Course type inline since module is not found
type Course = {
  id: string
  name: string
  description?: string
  language: string
  level: string
  duration_weeks?: number
  hours_per_week?: number
  max_students?: number
  price?: number
  teacher_id?: string
  schedule?: string
  start_date?: string
  end_date?: string
}
import { createCourse, updateCourse, deleteCourse, getCourses } from "@/lib/courses"
import { toast } from "@/hooks/use-toast"

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLanguage, setFilterLanguage] = useState("all")
  const [filterLevel, setFilterLevel] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language: "",
    level: "",
    duration_weeks: 12,
    hours_per_week: 4,
    max_students: 20,
    price: 0,
    teacher_id: "",
    schedule: "",
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, filterLanguage, filterLevel])

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses()
      setCourses(coursesData)
    } catch (error) {
      console.error("Error loading courses:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive",
      })
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false,
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      language: "",
      level: "",
      duration_weeks: 12,
      hours_per_week: 4,
      max_students: 20,
      price: 0,
      teacher_id: "",
      schedule: "",
      start_date: "",
      end_date: "",
    })
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.language || !formData.level) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await createCourse({
        ...formData,
        code: formData.name.substring(0, 10), // Generate a code from course name
        capacity: formData.max_students,
        enrolled_count: 0,
        room: "TBD" // Default room assignment
      })
      await loadCourses()
      setIsCreateDialogOpen(false)
      resetForm()
      toast({
        title: "Éxito",
        description: "Curso creado exitosamente",
      })
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el curso",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description || "",
      language: course.language,
      level: course.level,
      duration_weeks: course.duration_weeks || 12,
      hours_per_week: course.hours_per_week || 4,
      max_students: course.max_students || 20,
      price: course.price || 0,
      teacher_id: course.teacher_id || "",
      schedule: course.schedule || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingCourse || !formData.name || !formData.language || !formData.level) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateCourse(editingCourse.id, formData)
      await loadCourses()
      setIsEditDialogOpen(false)
      setEditingCourse(null)
      resetForm()
      toast({
        title: "Éxito",
        description: "Curso actualizado exitosamente",
      })
    } catch (error) {
      console.error("Error updating course:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el curso",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (courseId: string) => {
    setIsLoading(true)
    try {
      await deleteCourse(courseId)
      await loadCourses()
      toast({
        title: "Éxito",
        description: "Curso eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el curso",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-green-200 text-green-900",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-yellow-200 text-yellow-900",
      C1: "bg-orange-100 text-orange-800",
      C2: "bg-red-100 text-red-800",
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getLanguageFlag = (language: string) => {
    const flags = {
      Inglés: "🇺🇸",
      Francés: "🇫🇷",
      Alemán: "🇩🇪",
      Italiano: "🇮🇹",
      Portugués: "🇧🇷",
      Mandarín: "🇨🇳",
    }
    return flags[language as keyof typeof flags] || "🌐"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600">Administra los cursos del centro de idiomas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>Completa la información del nuevo curso</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Curso *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Inglés Básico A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                    <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                    <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                    <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                    <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel *</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Principiante</SelectItem>
                    <SelectItem value="A2">A2 - Elemental</SelectItem>
                    <SelectItem value="B1">B1 - Intermedio</SelectItem>
                    <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                    <SelectItem value="C1">C1 - Avanzado</SelectItem>
                    <SelectItem value="C2">C2 - Dominio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">Máximo Estudiantes</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_weeks">Duración (semanas)</Label>
                <Input
                  id="duration_weeks"
                  type="number"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_per_week">Horas por semana</Label>
                <Input
                  id="hours_per_week"
                  type="number"
                  value={formData.hours_per_week}
                  onChange={(e) => setFormData({ ...formData, hours_per_week: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el contenido y objetivos del curso"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Curso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los idiomas</SelectItem>
                <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="A1">A1 - Principiante</SelectItem>
                <SelectItem value="A2">A2 - Elemental</SelectItem>
                <SelectItem value="B1">B1 - Intermedio</SelectItem>
                <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                <SelectItem value="C1">C1 - Avanzado</SelectItem>
                <SelectItem value="C2">C2 - Dominio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageFlag(course.language)}</span>
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.language}</CardDescription>
                  </div>
                </div>
                <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {course.description && <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration_weeks}w
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Max {course.max_students}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {course.hours_per_week}h/sem
                  </div>
                </div>

                {course.schedule && (
                  <div className="text-sm">
                    <span className="font-medium">Horario:</span> {course.schedule}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-lg font-bold text-blue-600">${course.price?.toLocaleString() || "Gratis"}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el curso "{course.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(course.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
            <p className="text-gray-500">
              {searchTerm || filterLanguage !== "all" || filterLevel !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primer curso"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>Modifica la información del curso</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Curso *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-language">Idioma *</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                  <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                  <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                  <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                  <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-level">Nivel *</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1 - Principiante</SelectItem>
                  <SelectItem value="A2">A2 - Elemental</SelectItem>
                  <SelectItem value="B1">B1 - Intermedio</SelectItem>
                  <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                  <SelectItem value="C1">C1 - Avanzado</SelectItem>
                  <SelectItem value="C2">C2 - Dominio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max_students">Máximo Estudiantes</Label>
              <Input
                id="edit-max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration_weeks">Duración (semanas)</Label>
              <Input
                id="edit-duration_weeks"
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hours_per_week">Horas por semana</Label>
              <Input
                id="edit-hours_per_week"
                type="number"
                value={formData.hours_per_week}
                onChange={(e) => setFormData({ ...formData, hours_per_week: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
