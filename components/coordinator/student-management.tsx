"use client"

import { useState, useEffect, useRef } from "react"
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
import { Plus, Edit, Trash2, Search, Users, GraduationCap, Mail, Phone, Calendar, Grid, List, Camera, Upload, Eye } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser, type User } from "@/lib/auth"

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<User | null>(null)
  const [viewingStudent, setViewingStudent] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    academic_level: "",
    cohort: "",
    status: "active" as const,
    photo: ""
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null)

  // Estados para las estadísticas dinámicas
  const [newThisMonth, setNewThisMonth] = useState(0)
  const [retentionRate, setRetentionRate] = useState("0%")

  // Nuevos estados y refs para la cámara
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  // Función para calcular las estadísticas
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Calcular nuevos este mes
    const newStudents = students.filter(student => {
      const createdAt = new Date(student.created_at);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    });
    setNewThisMonth(newStudents.length);

    // Calcular tasa de retención
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
      document: "",
      email: "",
      phone: "",
      academic_level: "",
      cohort: "",
      status: "active",
      photo: ""
    })
    setIsCameraOpen(false)
  }

  const openEditDialog = (student: User) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      document: student.document || "",
      email: student.email,
      phone: student.phone || "",
      academic_level: student.academic_level || "",
      cohort: student.cohort || "",
      status: student.status || "active",
      photo: student.photo || ""
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (student: User) => {
    setViewingStudent(student)
    setIsViewDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraOpen(true)
      }
    } catch (error) {
      console.error("Error accessing the camera:", error)
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Revisa los permisos.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setIsCameraOpen(false)
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const photoUrl = canvasRef.current.toDataURL("image/png")
        setFormData({ ...formData, photo: photoUrl })
        stopCamera()
      }
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.document?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Estudiantes</h1>
          <p className="text-gray-600">Administra los estudiantes del centro de idiomas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            {/* Filters <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Estudiante
            </Button>*/}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Estudiante</DialogTitle>
              <DialogDescription>Completa la información del nuevo estudiante</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.photo} alt="Foto del estudiante" />
                  <AvatarFallback>
                    <Camera className="h-8 w-8 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                {isCameraOpen ? (
                  <div className="flex flex-col items-center gap-2">
                    <video ref={videoRef} autoPlay className="rounded-md w-full max-w-xs" />
                    <Button onClick={takePhoto}>Capturar</Button>
                    <Button onClick={stopCamera} variant="outline">Cancelar</Button>
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button asChild>
                        <div>
                          <Upload className="mr-2 h-4 w-4" /> Subir Foto
                        </div>
                      </Button>
                    </Label>
                    <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Button onClick={startCamera} variant="outline">
                      <Camera className="mr-2 h-4 w-4" /> Tomar Foto
                    </Button>
                  </div>
                )}
              </div>
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
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
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
                      <SelectItem value="all">Todos los niveles</SelectItem>
                      <SelectItem value="A1">1</SelectItem>
                      <SelectItem value="A2">2</SelectItem>
                      <SelectItem value="B1">3</SelectItem>
                      <SelectItem value="B2">4</SelectItem>
                      <SelectItem value="C1">5</SelectItem>
                      <SelectItem value="C2">6</SelectItem>
                      <SelectItem value="C2">7</SelectItem>
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
        {/* Tarjeta de Total de Estudiantes - Con animación */}
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

        {/* Tarjeta de Estudiantes Activos - Con animación */}
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

        {/* Tarjeta de Nuevos Este Mes - Con animación */}
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

        {/* Tarjeta de Tasa de Retención - Con animación */}
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
                <SelectItem value="A1">1</SelectItem>
                <SelectItem value="A2">2</SelectItem>
                <SelectItem value="B1">3</SelectItem>
                <SelectItem value="B2">4</SelectItem>
                <SelectItem value="C1">5</SelectItem>
                <SelectItem value="C2">6</SelectItem>
                <SelectItem value="C2">7</SelectItem>
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
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.photo || "/diverse-user-avatars.png"} alt={student.name} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{student.name}</h3>
                        {student.document && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <span>Documento: {student.document}</span>
                          </div>
                        )}
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
                          {student.cohort && <Badge variant="outline">Cohorte: {student.cohort}</Badge>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => openViewDialog(student)}>
                            <Eye className="h-3 w-3" />
                          </Button>
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
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photo || "/diverse-user-avatars.png"} alt={student.name} />
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
                    <TableCell>{student.document || "-"}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone || "-"}</TableCell>
                    <TableCell>{student.academic_level ? getLevelBadge(student.academic_level) : "-"}</TableCell>
                    <TableCell>{getStatusBadge(student.status || "active")}</TableCell>
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

      {/* View Dialog (New) */}
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
                  <AvatarImage src={viewingStudent.photo || "/diverse-user-avatars.png"} alt={viewingStudent.name} />
                  <AvatarFallback>
                    <Camera className="h-8 w-8 text-gray-400" />
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
                  <p className="text-sm font-medium">{viewingStudent.document || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{viewingStudent.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <p className="text-sm font-medium">{viewingStudent.phone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Situación Académica</Label>
                  <p className="text-sm font-medium">{viewingStudent.academic_level || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label>Cohorte</Label>
                  <p className="text-sm font-medium">{viewingStudent.cohort || "-"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <p>{getStatusBadge(viewingStudent.status || "active")}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>


      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
            <DialogDescription>Modifica la información del estudiante</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.photo} alt="Foto del estudiante" />
                <AvatarFallback>
                  <Camera className="h-8 w-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              {isCameraOpen ? (
                <div className="flex flex-col items-center gap-2">
                  <video ref={videoRef} autoPlay className="rounded-md w-full max-w-xs" />
                  <Button onClick={takePhoto}>Capturar</Button>
                  <Button onClick={stopCamera} variant="outline">Cancelar</Button>
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Label htmlFor="edit-file-upload" className="cursor-pointer">
                    <Button asChild>
                      <div>
                        <Upload className="mr-2 h-4 w-4" /> Subir Foto
                      </div>
                    </Button>
                  </Label>
                  <Input id="edit-file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Button onClick={startCamera} variant="outline">
                    <Camera className="mr-2 h-4 w-4" /> Tomar Foto
                  </Button>
                </div>
              )}
            </div>
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
                <Label htmlFor="edit-document">Documento</Label>
                <Input
                  id="edit-document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-academic-level">Situación Académica</Label>
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
              <div className="space-y-2">
                <Label htmlFor="edit-cohort">Cohorte</Label>
                <Select
                  value={formData.cohort}
                  onValueChange={(value) => setFormData({ ...formData, cohort: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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

      {/* Alerta de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la información del estudiante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}