"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, FileText, Clock, Loader2, Save, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "../../lib/supabase"

interface Lesson {
  id: string
  title: string
  description: string
  course_id: string
  created_at: string
  content?: string
  order_index: number
  media_url?: string
  attachments?: string[]
  audio_url?: string
  is_published: boolean
  updated_at: string
  due_date?: string | null
  status?: "active" | "draft" | "completed"
  teacher_id?: string
  course?: {
    name: string
  }
}

interface LessonManagementProps {
  teacherId: string
}

export default function LessonManagement({ teacherId }: LessonManagementProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [courses, setCourses] = useState<{ id: string, name: string }[]>([])

  // **********************************************
  // NUEVOS ESTADOS PARA LA CONFIRMACIÓN DE ELIMINACIÓN
  // **********************************************
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    course_id: "",
    due_date: "",
    status: "draft" as "active" | "draft" | "completed",
    is_published: false,
    attachments: [] as string[],
    audio_url: ""
  })

  useEffect(() => {
    fetchLessons()
    fetchCourses()
  }, [])

  useEffect(() => {
    setTotalPages(Math.ceil(lessons.length / itemsPerPage))
  }, [lessons, itemsPerPage])

  const fetchLessons = async () => {
    setLoading(true)
    try {
      // En una implementación real, filtrarías por teacherId
      const { data, error } = await supabase
        .from("lessons")
        .select("*, course:courses(name)")

      if (error) throw error

      setLessons(data || [])
    } catch (error) {
      console.error("Error fetching lessons:", error)
      setMessage({ type: "error", text: "No se pudieron cargar las lecciones" })
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      // En una implementación real, filtrarías por teacherId
      const { data, error } = await supabase
        .from("courses")
        .select("id, name")

      if (error) throw error

      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherId || teacherId === "") {
      setMessage({ type: "error", text: "Por favor, espera a que se cargue la información del profesor o inicia sesión nuevamente" })
      return
    }
    setCreating(true)

    try {
      const { data: lastLesson } = await supabase
        .from("lessons")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = lastLesson && lastLesson[0] ? lastLesson[0].order_index + 1 : 1

      const newLesson = {
        ...lessonForm,
        teacher_id: teacherId,
        order_index: nextOrderIndex,
        is_published: lessonForm.is_published,
        attachments: lessonForm.attachments,
        audio_url: lessonForm.audio_url
      }

      const { error } = await supabase.from("lessons").insert([newLesson])

      if (error) throw error

      setMessage({ type: "success", text: "Lección creada exitosamente" })
      setDialogOpen(false)
      resetForm()
      fetchLessons()
    } catch (error) {
      console.error("Error creating lesson:", error)
      setMessage({ type: "error", text: "Error al crear la lección" })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLesson) return

    setCreating(true)

    try {
      const { error } = await supabase
        .from("lessons")
        .update(lessonForm)
        .eq("id", editingLesson.id)

      if (error) throw error

      setMessage({ type: "success", text: "Lección actualizada exitosamente" })
      setDialogOpen(false)
      resetForm()
      fetchLessons()
    } catch (error) {
      console.error("Error updating lesson:", error)
      setMessage({ type: "error", text: "Error al actualizar la lección" })
    } finally {
      setCreating(false)
    }
  }

  // **********************************************
  // LÓGICA DE ELIMINACIÓN MEJORADA
  // **********************************************

  // Función que se llama desde la tabla para abrir el diálogo de confirmación
  const confirmDelete = (id: string) => {
    setLessonToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Función que se llama al confirmar en el diálogo
  const handleConfirmedDelete = async () => {
    if (!lessonToDelete) return

    setCreating(true) // Usar 'creating' para deshabilitar el botón mientras se elimina

    try {
      // First delete associated grades
      const { error: gradesError } = await supabase
        .from("grades")
        .delete()
        .eq("lesson_id", lessonToDelete)

      if (gradesError) throw gradesError

      // Then delete the lesson
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonToDelete)

      if (error) throw error

      setMessage({ type: "success", text: "Lección eliminada exitosamente" })
      fetchLessons()
    } catch (error) {
      console.error("Error deleting lesson:", error)
      setMessage({ type: "error", text: "Error al eliminar la lección" })
    } finally {
      setCreating(false)
      setDeleteDialogOpen(false)
      setLessonToDelete(null)
    }
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      course_id: lesson.course_id,
      due_date: lesson.due_date || "",
      status: lesson.status || "draft",
      is_published: lesson.is_published || false,
      attachments: lesson.attachments || [],
      audio_url: lesson.audio_url || ""
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingLesson(null)
    setLessonForm({
      title: "",
      description: "",
      course_id: "",
      due_date: "",
      status: "draft",
      is_published: false,
      attachments: [],
      audio_url: ""
    })
  }

  const handleOpenDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      draft: "secondary",
      completed: "outline",
    }

    const labels: Record<string, string> = {
      active: "Activo",
      draft: "Borrador",
      completed: "Completado",
    }

    // Se asume que 'default', 'secondary', 'outline', 'destructive' son variantes válidas en tu Badge.
    // Aquí, se usa 'default' si el estado no está mapeado para evitar errores.
    const variant = variants[status] || "default" 

    return <Badge variant={variant}>{labels[status] || status}</Badge>
  }

  // Paginación
  const indexOfLastLesson = currentPage * itemsPerPage
  const indexOfFirstLesson = indexOfLastLesson - itemsPerPage
  const currentLessons = lessons.slice(indexOfFirstLesson, indexOfLastLesson)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Lecciones</h2>
          <p className="text-muted-foreground">Gestiona las lecciones y tareas para tus estudiantes</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Lección
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lecciones y Tareas</CardTitle>
          <CardDescription>Administra el contenido para tus cursos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Fecha Límite</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLessons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No hay lecciones disponibles. Crea una nueva lección para comenzar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentLessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell className="font-medium">{lesson.title}</TableCell>
                          <TableCell>{lesson.course?.name || "Sin curso"}</TableCell>
                          <TableCell>
                            {lesson.due_date ? new Date(lesson.due_date).toLocaleDateString() : "Sin fecha"}
                          </TableCell>
                          <TableCell>{lesson.status ? getStatusBadge(lesson.status) : getStatusBadge('draft')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditLesson(lesson)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {/* **********************************************
                                  BOTÓN DE ELIMINACIÓN MODIFICADO para usar la nueva función
                                  ********************************************** */}
                              <Button variant="destructive" size="sm" onClick={() => confirmDelete(lesson.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* **********************************************
          DIÁLOGO DE CREACIÓN/EDICIÓN
          ********************************************** */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Editar Lección" : "Crear Nueva Lección"}</DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Modifica los detalles de la lección existente"
                : "Completa el formulario para crear una nueva lección o tarea"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Select
                  value={lessonForm.course_id}
                  onValueChange={(value) => setLessonForm({ ...lessonForm, course_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha Límite (Opcional)</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={lessonForm.due_date}
                  onChange={(e) => setLessonForm({ ...lessonForm, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={lessonForm.status}
                  onValueChange={(value) => setLessonForm({ ...lessonForm, status: value as "active" | "draft" | "completed" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* This is the corrected section for attachments and audio */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="attachments">Archivos Adjuntos</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    const uploadedUrls = await Promise.all(
                      files.map(async (file) => {
                        const fileExt = file.name.split(".").pop()
                        const fileName = `lessons/${lessonForm.course_id}/${Date.now()}-${file.name}`
                        const { data, error } = await supabase.storage
                          .from("attachments")
                          .upload(fileName, file)
                        if (error) throw error
                        const { data: { publicUrl } } = supabase.storage
                          .from("attachments")
                          .getPublicUrl(fileName)
                        return publicUrl
                      })
                    )
                    setLessonForm(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), ...uploadedUrls]
                    }))
                  }}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="audio">Audio</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const fileExt = file.name.split(".").pop()
                      const fileName = `lessons/${lessonForm.course_id}/${Date.now()}-${file.name}`
                      const { data, error } = await supabase.storage
                        .from("attachments") // Changed from "audio" to "attachments"
                        .upload(fileName, file)
                      if (error) throw error
                      const { data: { publicUrl } } = supabase.storage
                        .from("attachments") // Changed from "audio" to "attachments"
                        .getPublicUrl(fileName)
                      setLessonForm(prev => ({
                        ...prev,
                        audio_url: publicUrl
                      }))
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_published">Estado de publicación</Label>
                <Select
                  value={lessonForm.is_published ? "true" : "false"}
                  onValueChange={(value) => setLessonForm(prev => ({ ...prev, is_published: value === "true" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado de publicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Publicado</SelectItem>
                    <SelectItem value="false">No publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingLesson ? "Actualizar Lección" : "Crear Lección"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* **********************************************
          DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN
          ********************************************** */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <Trash2 className="h-6 w-6 mr-2" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la lección (y las calificaciones asociadas). ¿Estás seguro de que deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmedDelete}
              disabled={creating}
            >
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {creating ? "Eliminando..." : "Eliminar Lección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}