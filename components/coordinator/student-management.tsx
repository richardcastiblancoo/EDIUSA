"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Eye,
  Image,
  Tag,
  Hash,
  CreditCard,
} from "lucide-react"; // Importamos CreditCard para la cédula
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "@/lib/auth";
const ACADEMIC_LEVELS = ["1", "2", "3", "4", "5", "6", "7"];
export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    document_number: "",
    email: "",
    phone: "",
    academic_level: "",
    status: "active" as const,
    photo: "",
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(
    null
  );
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [retentionRate, setRetentionRate] = useState("0%");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const newStudents = students.filter((student) => {
      const createdAt = new Date(student.created_at);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    });
    setNewThisMonth(newStudents.length);
    const activeStudents = students.filter(
      (student) => student.status === "active"
    ).length;
    const rate =
      students.length > 0 ? (activeStudents / students.length) * 100 : 0;
    setRetentionRate(`${rate.toFixed(0)}%`);
  }, [students]);

  const loadStudents = async () => {
    try {
      const users = await getAllUsers();
      setStudents(users.filter((user) => user.role === "student"));
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateStudent = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Nombre y Email son obligatorios.",
        variant: "destructive",
      });
      return;
    }

    try {
      let photoUrl = "";
      if (photoFile) {
        photoUrl = await uploadImage(photoFile);
      }
      await createUser({
        ...formData,
        photo: photoUrl,
        role: "student",
        password: "student123",
      });
      toast({
        title: "Éxito",
        description: "Estudiante creado exitosamente",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el estudiante",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent) return;
    try {
      let photoUrl = formData.photo;
      if (photoFile) {
        photoUrl = await uploadImage(photoFile);
      }
      await updateUser(editingStudent.id, {
        ...formData,
        photo: photoUrl,
      });
      toast({
        title: "Éxito",
        description: "Estudiante actualizado exitosamente",
      });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estudiante",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDeleteId(studentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDeleteId) return;
    try {
      await deleteUser(studentToDeleteId);
      toast({
        title: "Éxito",
        description: "Estudiante eliminado exitosamente",
      });
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      document_number: "",
      email: "",
      phone: "",
      academic_level: "",
      status: "active",
      photo: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const openEditDialog = (student: User) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      document_number: student.document_number || "",
      email: student.email || "",
      phone: student.phone || "",
      academic_level: student.academic_level || "",
      // @ts-ignore
      status: student.status || "active",
      photo: (student as any).photo || "",
    });
    setPhotoPreview((student as any).photo || null);
    setPhotoFile(null);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (student: User) => {
    setViewingStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-ignore
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-ignore
      student.document_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel =
      selectedLevel === "all" || student.academic_level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      graduado: "outline",
      egresado: "destructive",
    } as const;

    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      graduado: "Graduado",
      egresado: "Egresado",
    };

    // @ts-ignore
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getLevelBadge = (level: string) => {
    const colors: { [key: string]: string } = {
      "1": "bg-gray-100 text-gray-800",
      "2": "bg-green-100 text-green-800",
      "3": "bg-blue-100 text-blue-800",
      "4": "bg-yellow-100 text-yellow-800",
      "5": "bg-orange-100 text-orange-800",
      "6": "bg-red-100 text-red-800",
      "7": "bg-purple-100 text-purple-800",
    };

    return (
      <Badge
        className={`text-xs ${colors[level] || "bg-gray-100 text-gray-800"}`}
      >
        {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Gestión de Estudiantes
          </h1>
          <p className="text-sm text-gray-600">
            Administra los estudiantes del centro de idiomas
          </p>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Estudiantes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold sm:text-2xl">
              {students.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Estudiantes registrados
            </p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Estudiantes Activos
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold sm:text-2xl">
              {students.filter((s) => s.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">En cursos actuales</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Nuevos Este Mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold sm:text-2xl">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Inscripciones recientes
            </p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Tasa de Retención
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold sm:text-2xl">{retentionRate}</div>
            <p className="text-xs text-muted-foreground">Estudiantes activos</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, documento o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {ACADEMIC_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Estudiantes ({filteredStudents.length})
          </CardTitle>
          <CardDescription>
            Lista de todos los estudiantes registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No se encontraron estudiantes.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          {/* @ts-ignore */}
                          <AvatarImage
                            src={
                              (student as any).photo || "/placeholder-user.jpg"
                            }
                            alt={student.name}
                          />
                          <AvatarFallback>
                            <Users className="h-5 w-5 text-gray-400" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold truncate">
                          {student.name}
                        </span>
                      </div>
                      {/* @ts-ignore */}
                      {student.academic_level &&
                        getLevelBadge(student.academic_level)}
                    </div>

                    {/* Fila 2: Email y Documento (detalles) */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 text-blue-500" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end truncate">
                        {/* CORRECCIÓN AQUÍ: Usamos CreditCard para la cédula/documento */}
                        <CreditCard className="h-3 w-3 text-gray-500" />
                        {/* @ts-ignore */}
                        <span className="truncate">
                          {student.document_number || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      {/* @ts-ignore */}
                      {getStatusBadge(student.status || "active")}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openViewDialog(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Estudiante</DialogTitle>
            <DialogDescription>
              Completa la información para crear un nuevo estudiante.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28">
                <AvatarImage
                  src={photoPreview || "/placeholder-user.jpg"}
                  alt="Foto de Perfil"
                />
                <AvatarFallback>
                  <Image className="h-10 w-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="photo"
                className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
              >
                {photoPreview ? "Cambiar foto" : "Subir foto"}
              </Label>
              <Input
                id="photo"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">Documento/Cédula</Label>
                <Input
                  id="document"
                  value={formData.document_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      document_number: e.target.value,
                    })
                  }
                  placeholder="123456789"
                />
              </div>{" "}
              {/* Label corregido */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academic_level">Último nivel aprobado</Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, academic_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "active" | "inactive" | "graduado" | "egresado"
                  ) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as "active",
                    }))
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateStudent}>Crear Estudiante</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {viewingStudent && (
          <DialogContent className="w-[95vw] max-w-[425px] md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Datos del Estudiante</DialogTitle>
              <DialogDescription>
                Información detallada de {viewingStudent.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-28 w-28">
                  {/* @ts-ignore */}
                  <AvatarImage
                    src={
                      (viewingStudent as any).photo || "/placeholder-user.jpg"
                    }
                    alt={viewingStudent.name}
                  />
                  <AvatarFallback>
                    <Users className="h-10 w-10 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Nombre Completo</Label>
                  <p className="text-sm font-medium">{viewingStudent.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Documento/Cédula</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">
                    {viewingStudent.document_number || "-"}
                  </p>
                </div>{" "}
                {/* Label corregido */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <p className="text-sm font-medium break-words">
                    {viewingStudent.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Teléfono</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">
                    {viewingStudent.phone || "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Último nivel aprobado</Label>
                  {/* @ts-ignore */}
                  <p className="text-sm font-medium">
                    {viewingStudent.academic_level || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Estado</Label>
                  <div>
                    {/* @ts-ignore */}
                    {getStatusBadge(viewingStudent.status || "active")}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Estudiante</DialogTitle>
            <DialogDescription>
              Modifica la información del estudiante
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28">
                <AvatarImage
                  src={photoPreview || "/placeholder-user.jpg"}
                  alt="Foto de Perfil"
                />
                <AvatarFallback>
                  <Image className="h-10 w-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="edit-photo"
                className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
              >
                {photoPreview ? "Cambiar foto" : "Subir foto"}
              </Label>
              <Input
                id="edit-photo"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-document">Documento/Cédula</Label>
                <Input
                  id="edit-document"
                  value={formData.document_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      document_number: e.target.value,
                    })
                  }
                  placeholder="123456789"
                />
              </div>{" "}
              {/* Label corregido */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-academic_level">
                  Último nivel aprobado
                </Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, academic_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "active" | "inactive" | "graduado" | "egresado"
                  ) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as "active",
                    }))
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditStudent}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al estudiante de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
