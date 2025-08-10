"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Search, Users, GraduationCap, Mail, Phone, Calendar, Grid, List } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser, type User } from "@/lib/auth"

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    academic_level: "",
    enrollment_date: "",
    status: "active" as const,
  })

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const users = await getAllUsers()
      setStudents(users.filter((user) => user.role === "student"))
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async () => {
    try {
      await createUser({
        ...formData,
        role: "student",
        password: "student123", // Default password
      })
      toast({
        title: "Éxito",
        description: "Estudiante creado exitosamente",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      loadStudents()
    } catch (error) {
      console.error("Error creating student:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el estudiante",
        variant: "destructive",
      })
    }
  }

  const handleEditStudent = async () => {
    if (!editingStudent) return

    try {
      await updateUser(editingStudent.id, formData)
      toast({
        title: "Éxito",
        description: "Estudiante actualizado exitosamente",
      })
      setIsEditDialogOpen(false)
      setEditingStudent(null)
      resetForm()
      loadStudents()
    } catch (error) {
      console.error("Error updating student:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estudiante",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este estudiante? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      await deleteUser(studentId)
      toast({
        title: "Éxito",
        description: "Estudiante eliminado exitosamente",
      })
      loadStudents()
    } catch (error) {
      console.error("Error deleting student:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      academic_level: "",
      enrollment_date: "",
      status: "active",
    })
  }

  const openEditDialog = (student: User) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      academic_level: student.academic_level || "",
      enrollment_date: student.enrollment_date || "",
      status: student.status || "active",
    })
    setIsEditDialogOpen(true)
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === "all" || student.academic_level === selectedLevel
    return matchesSearch && matchesLevel
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      graduated: "outline",
    } as const

    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      graduated: "Graduado",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getLevelBadge = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-orange-100 text-orange-800",
      C1: "bg-red-100 text-red-800",
      C2: "bg-purple-100 text-purple-800",
    }

    return <Badge className={colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{level}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando estudiantes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Estudiantes</h1>
          <p className="text-gray-600">Administra los estudiantes del centro de idiomas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Estudiante</DialogTitle>
              <DialogDescription>Completa la información del nuevo estudiante</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_level">Nivel Académico</Label>
                  <Select
                    value={formData.academic_level}
                    onValueChange={(value) => setFormData({ ...formData, academic_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Principiante</SelectItem>
                      <SelectItem value="A2">A2 - Elemental</SelectItem>
                      <SelectItem value="B1">B1 - Intermedio</SelectItem>
                      <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                      <SelectItem value="C1">C1 - Avanzado</SelectItem>
                      <SelectItem value="C2">C2 - Experto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">Fecha de Inscripción</Label>
                  <Input
                    id="enrollment_date"
                    type="date"
                    value={formData.enrollment_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "graduated") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="graduated">Graduado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateStudent}>Crear Estudiante</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">En cursos actuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Inscripciones recientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Retención</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar estudiantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="A1">A1 - Principiante</SelectItem>
                <SelectItem value="A2">A2 - Elemental</SelectItem>
                <SelectItem value="B1">B1 - Intermedio</SelectItem>
                <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                <SelectItem value="C1">C1 - Avanzado</SelectItem>
                <SelectItem value="C2">C2 - Experto</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Display */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes ({filteredStudents.length})</CardTitle>
          <CardDescription>Lista de todos los estudiantes registrados en el centro de idiomas</CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="/diverse-user-avatars.png" alt={student.name} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{student.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {student.academic_level && getLevelBadge(student.academic_level)}
                          {getStatusBadge(student.status || "active")}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Inscripción</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/diverse-user-avatars.png" alt={student.name} />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone || "-"}</TableCell>
                    <TableCell>{student.academic_level ? getLevelBadge(student.academic_level) : "-"}</TableCell>
                    <TableCell>{getStatusBadge(student.status || "active")}</TableCell>
                    <TableCell>
                      {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("es-CO") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
            <DialogDescription>Modifica la información del estudiante</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-academic-level">Nivel Académico</Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) => setFormData({ ...formData, academic_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Principiante</SelectItem>
                    <SelectItem value="A2">A2 - Elemental</SelectItem>
                    <SelectItem value="B1">B1 - Intermedio</SelectItem>
                    <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                    <SelectItem value="C1">C1 - Avanzado</SelectItem>
                    <SelectItem value="C2">C2 - Experto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-enrollment-date">Fecha de Inscripción</Label>
                <Input
                  id="edit-enrollment-date"
                  type="date"
                  value={formData.enrollment_date}
                  onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "graduated") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="graduated">Graduado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditStudent}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
