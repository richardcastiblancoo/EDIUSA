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
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Search, Users, GraduationCap, Mail, Phone, Calendar, Eye } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser, type User } from "@/lib/auth"

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<User | null>(null)
  const [viewingStudent, setViewingStudent] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    document_number: "", 
    email: "",
    phone: "",
    academic_level: "",
    cohort: "",
    status: "active" as const,
    photo: ""
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null)

  const [newThisMonth, setNewThisMonth] = useState(0)
  const [retentionRate, setRetentionRate] = useState("0%")

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const newStudents = students.filter(student => {
      // @ts-ignore
      const createdAt = new Date(student.created_at);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    });
    setNewThisMonth(newStudents.length);

    const activeStudents = students.filter(student => student.status === "active").length;
    const rate = students.length > 0 ? (activeStudents / students.length) * 100 : 0;
    setRetentionRate(`${rate.toFixed(0)}%`);

  }, [students])

  const loadStudents = async () => {
    try {
      const users = await getAllUsers()
      setStudents(users.filter((user) => user.role === "student"))
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      })
    }
  }

  const handleCreateStudent = async () => {
    try {
      await createUser({
        ...formData,
        role: "student",
        password: "student123",
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

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDeleteId(studentId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!studentToDeleteId) return

    try {
      await deleteUser(studentToDeleteId)
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
    } finally {
      setIsDeleteDialogOpen(false)
      setStudentToDeleteId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      document_number: "", 
      email: "",
      phone: "",
      academic_level: "",
      cohort: "",
      status: "active",
      photo: ""
    })
  }

  const openEditDialog = (student: User) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      // @ts-ignore
      document_number: student.document_number || "", 
      email: student.email,
      // @ts-ignore
      phone: student.phone || "",
      // @ts-ignore
      academic_level: student.academic_level || "",
      // @ts-ignore
      cohort: student.cohort || "",
      // @ts-ignore
      status: student.status || "active",
      photo: ""
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (student: User) => {
    setViewingStudent(student)
    setIsViewDialogOpen(true)
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-ignore
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-ignore
      student.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) 
    const matchesLevel = selectedLevel === "all" || student.academic_level === selectedLevel
    return matchesSearch && matchesLevel
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      graduado: "outline",
      egresado: "destructive",
    } as const

    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      graduado: "Graduado",
      egresado: "Egresado",
    }

    return <Badge variant={variants[`${status}` as keyof typeof variants]}>{labels[`${status}` as keyof typeof labels]}</Badge>
  }

  const getLevelBadge = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-orange-100 text-orange-800",
      C1: "bg-red-100 text-red-800",
      C2: "bg-purple-100 text-purple-800",
      "7": "bg-gray-100 text-gray-800",
    }

    return <Badge className={colors[`${level}` as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{level}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Estudiantes</h1>
          <p className="text-gray-600">Administra los estudiantes del centro de idiomas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Estudiante
          </Button>
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
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    value={formData.document_number} 
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} 
                    placeholder="123456789"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic_level">Situación Académica</Label>
                  <Select
                    value={formData.academic_level}
                    onValueChange={(value) => setFormData({ ...formData, academic_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar situación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohort">Cohorte</Label>
                  <Select
                    value={formData.cohort}
                    onValueChange={(value) => setFormData({ ...formData, cohort: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cohorte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025-Q1">2025-Q1</SelectItem>
                      <SelectItem value="2025-Q2">2025-Q2</SelectItem>
                      <SelectItem value="2024-Q4">2024-Q4</SelectItem>
                      <SelectItem value="2024-Q3">2024-Q3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "graduado" | "egresado") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="graduado">Graduado</SelectItem>
                    <SelectItem value="egresado">Egresado</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Estudiantes registrados</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">En cursos actuales</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Inscripciones recientes</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Retención</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionRate}</div>
            <p className="text-xs text-muted-foreground">Estudiantes activos</p>
          </CardContent>
        </Card>
      </div>

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
                <SelectValue placeholder="Filtrar por situación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
                <SelectItem value="7">7</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estudiantes ({filteredStudents.length})</CardTitle>
          <CardDescription>Lista de todos los estudiantes registrados en el centro de idiomas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No se encontraron estudiantes.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Situación Académica</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cohorte</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <span className="font-medium">{student.name}</span>
                    </TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{student.document_number || "-"}</TableCell> 
                    <TableCell>{student.email}</TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{student.phone || "-"}</TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{student.academic_level ? getLevelBadge(student.academic_level) : "-"}</TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{getStatusBadge(student.status || "active")}</TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{student.cohort || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewDialog(student)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {viewingStudent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Datos del Estudiante</DialogTitle>
              <DialogDescription>Información detallada de {viewingStudent.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  {/* @ts-ignore */}
                  <AvatarImage src={"/diverse-user-avatars.png"} alt={viewingStudent.name} />
                  <AvatarFallback>
                    <Users className="h-8 w-8 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <p className="text-sm font-medium">{viewingStudent.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Documento</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">{viewingStudent.document_number || "-"}</p> 
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{viewingStudent.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">{viewingStudent.phone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Situación Académica</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">{viewingStudent.academic_level || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Cohorte</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">{viewingStudent.cohort || "-"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                {/* @ts-ignore */}
                <p>{getStatusBadge(viewingStudent.status || "active")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>


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
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-document">Documento</Label>
                <Input
                  id="edit-document"
                  value={formData.document_number} 
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} 
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-academic_level">Situación Académica</Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) => setFormData({ ...formData, academic_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar situación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cohort">Cohorte</Label>
                <Select
                  value={formData.cohort}
                  onValueChange={(value) => setFormData({ ...formData, cohort: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cohorte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-Q1">2025-Q1</SelectItem>
                    <SelectItem value="2025-Q2">2025-Q2</SelectItem>
                    <SelectItem value="2024-Q4">2024-Q4</SelectItem>
                    <SelectItem value="2024-Q3">2024-Q3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "graduado" | "egresado") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="graduado">Graduado</SelectItem>
                  <SelectItem value="egresado">Egresado</SelectItem>
                </SelectContent>
              </Select>
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


      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al estudiante de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}