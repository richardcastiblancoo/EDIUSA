"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  BookOpen,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserImage, uploadImage } from "@/lib/images";
import ImageUpload from "@/components/shared/image-upload"

// Define el tipo para los roles
type UserRole = "coordinator" | "teacher" | "student";

// Extiende la interfaz User para incluir un campo de última actividad
interface UserWithStatus {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  document_number?: string;
  image_url?: string; // Añadir campo para la URL de la imagen
}

const PAGE_SIZE = 10;

// Componente de tabla de usuarios, optimizado para ser un componente separado
const UserTable = ({ users, getRoleAvatar, getRoleBadge, handleEdit, handleDelete, handleView }: {
  users: UserWithStatus[],
  getRoleAvatar: (role: string) => React.ReactNode,
  getRoleBadge: (role: string) => React.ReactNode,
  handleEdit: (user: UserWithStatus) => void,
  handleDelete: (user: UserWithStatus) => void,
  handleView: (user: UserWithStatus) => void,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground"
            >
              No hay usuarios que coincidan con la búsqueda.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium flex items-center gap-2">
                {/* Mostrar Avatar con imagen si existe, o el avatar por defecto */}
                <Avatar className="h-8 w-8">
                  {user.image_url ? (
                    <AvatarImage src={user.image_url} alt={user.name} />
                  ) : (
                    <AvatarFallback>
                      {getRoleAvatar(user.role)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {user.name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || "N/A"}</TableCell>
              <TableCell>{user.document_number || "N/A"}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(user)}
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};


export default function UserManagement() {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);
  const [viewingUser, setViewingUser] = useState<UserWithStatus | null>(null);
  const [viewingUserImage, setViewingUserImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithStatus | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as UserRole,
    phone: "",
    document_number: "",
  });
  
  // Agregar un estado para la imagen temporal durante la creación
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const userData = await getAllUsers();

    // Crear un array de promesas para cargar las imágenes de todos los usuarios
    const usersWithImages = await Promise.all(
      userData.map(async (user) => {
        const imageUrl = await getUserImage(user.id, "avatar");
        return {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'student',
          phone: user.phone,
          document_number: user.document_number,
          image_url: imageUrl
        };
      })
    );
    
    setUsers(usersWithImages.map(user => ({
      ...user,
      image_url: user.image_url || undefined
    })));
    setLoading(false);
    setMessage(null);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "student",
      phone: "",
      document_number: "",
    });
    setEditingUser(null);
    setShowPassword(false);
    setTempImageFile(null);
    setTempImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Se elimina la validación de longitud mínima de contraseña
    setCreating(true);
    try {
      let success = false;
      let newOrUpdatedUser;
      if (editingUser) {
        const dataToSend = { ...formData };
        if (!dataToSend.password) {
          dataToSend.password = undefined;
        }
        newOrUpdatedUser = await updateUser(editingUser.id, dataToSend);
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;
      } else {
        newOrUpdatedUser = await createUser(formData);
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;
        
        // Si se creó el usuario exitosamente y hay una imagen temporal, subirla
        if (success && tempImageFile && newOrUpdatedUser?.id) {
          try {
            await uploadImage(tempImageFile, newOrUpdatedUser.id, "avatar");
          } catch (imageError) {
            console.error("Error al subir la imagen del nuevo usuario:", imageError);
            // No marcamos como error la operación completa, ya que el usuario se creó correctamente
          }
        }
      }
      if (success) {
        setMessage({
          type: "success",
          text: `Usuario ${editingUser ? "actualizado" : "creado"} exitosamente`,
        });
        setDialogOpen(false);
        resetForm();
        loadUsers();
      } else {
        setMessage({
          type: "error",
          text: `Error al ${editingUser ? "actualizar" : "crear"} usuario. Verifique los datos.`,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      // Mejorar el manejo de errores para mostrar mensajes específicos
      if ((error as Error).message?.includes("security purposes")) {
        setMessage({
          type: "error",
          text: "Has excedido el límite de solicitudes. Por favor, espera un minuto antes de intentarlo nuevamente."
        });
      } else {
        setMessage({
          type: "error",
          text: `Error: ${(error as Error).message || "Error inesperado"}`
        });
      }
    } finally {
      setCreating(false);
    }
  };
  
  // Función para manejar la selección de imagen para nuevos usuarios
  const handleNewUserImageSelect = (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Por favor selecciona un archivo de imagen válido." });
      return;
    }
    
    if (file.size > 1 * 1024 * 1024) { // 1MB
      setMessage({ type: "error", text: "El archivo es muy grande. Máximo 1MB permitido." });
      return;
    }
    
    // Crear URL de previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setTempImageFile(file);
    setMessage(null);
  };
  
  // Función para eliminar la imagen temporal
  const handleRemoveTempImage = () => {
    setTempImageFile(null);
    setTempImagePreview(null);
  };

  const handleEdit = useCallback((user: UserWithStatus) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role as UserRole,
      phone: user.phone || "",
      document_number: user.document_number || "",
    });
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((user: UserWithStatus) => {
    setUserToDelete(user);
  }, []);

  const handleView = useCallback(async (user: UserWithStatus) => {
    setViewingUser(user);
    // Cargar la imagen del usuario cuando se abre la vista detallada
    try {
      const imageUrl = await getUserImage(user.id, "avatar");
      setViewingUserImage(imageUrl);
    } catch (error) {
      console.error("Error al cargar la imagen del usuario:", error);
      setViewingUserImage(null);
    }
  }, []);

  const confirmDelete = async () => {
    if (userToDelete) {
      setCreating(true);
      try {
        const success = await deleteUser(userToDelete.id);
        if (success !== undefined && success !== null) {
          setMessage({
            type: "success",
            text: "Usuario eliminado exitosamente",
          });
          loadUsers();
        } else {
          setMessage({ type: "error", text: "Error al eliminar usuario" });
        }
      } catch (error) {
        setMessage({ type: "error", text: "Error inesperado al eliminar" });
      } finally {
        setCreating(false);
        setUserToDelete(null);
      }
    }
  };

  const getRoleBadge = useCallback((role: string) => {
    const variants = {
      coordinator: "default",
      teacher: "secondary",
      student: "outline",
    } as const;

    const labels = {
      coordinator: "Coordinador",
      teacher: "Profesor",
      student: "Estudiante",
    };

    return (
      <Badge variant={variants[(role as keyof typeof variants) || "student"]}>
        {labels[(role as keyof typeof labels) || "student"]}
      </Badge>
    );
  }, []);

  const getRoleAvatar = useCallback((role: string) => {
    const avatarMap = {
      coordinator: "bg-blue-600",
      teacher: "bg-green-600",
      student: "bg-purple-600",
    };
    const avatarIconMap = {
      coordinator: <Users className="h-5 w-5 text-white" />,
      teacher: <BookOpen className="h-5 w-5 text-white" />,
      student: <GraduationCap className="h-5 w-5 text-white" />,
    };

    return (
      <Avatar className={`h-8 w-8 ${avatarMap[(role as keyof typeof avatarMap) || "student"]}`}>
        <AvatarFallback className="flex items-center justify-center">
          {avatarIconMap[(role as keyof typeof avatarIconMap) || "student"]}
        </AvatarFallback>
      </Avatar>
    );
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(lowerCaseQuery) ||
      (user.document_number && user.document_number.includes(lowerCaseQuery))
    );
    if (currentPage > 1 && Math.ceil(filtered.length / PAGE_SIZE) < currentPage) {
      setCurrentPage(1);
    }
    return filtered;
  }, [users, searchQuery]);

  const usersByRole = useMemo(() => {
    return {
      coordinators: filteredUsers.filter((user) => user.role === "coordinator"),
      teachers: filteredUsers.filter((user) => user.role === "teacher"),
      students: filteredUsers.filter((user) => user.role === "student"),
      all: filteredUsers,
    };
  }, [filteredUsers]);

  const totalPages = (role: keyof typeof usersByRole) => {
    return Math.ceil(usersByRole[role].length / PAGE_SIZE);
  };

  const paginatedUsers = (role: keyof typeof usersByRole) => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return usersByRole[role].slice(start, end);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra coordinadores, profesores y estudiantes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Modifica los datos del usuario"
                    : "Completa los datos para crear un nuevo usuario"}
                </DialogDescription>
              </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Componente de carga de imagen para usuarios nuevos y existentes */}
                  <div className="mb-4">
                    {editingUser ? (
                      <ImageUpload
                        userId={editingUser.id}
                        imageType="avatar"
                        title="Foto de perfil"
                        description="Sube una foto para el usuario"
                        onImageUpdate={(url) => {
                          setViewingUserImage(url);
                        }}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Foto de perfil</h3>
                          <p className="text-sm text-muted-foreground">Sube una foto para el usuario</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            {tempImagePreview ? (
                              <AvatarImage src={tempImagePreview} />
                            ) : (
                              <AvatarFallback>
                                {formData.name ? formData.name.charAt(0) : "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input 
                              type="file" 
                              id="newUserImage" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => e.target.files?.[0] && handleNewUserImageSelect(e.target.files[0])}
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById("newUserImage")?.click()} 
                              variant="outline"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar Imagen
                            </Button>
                            
                            {tempImagePreview && (
                              <Button 
                                type="button" 
                                onClick={handleRemoveTempImage} 
                                variant="outline" 
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <p>Formatos soportados: JPG, PNG, GIF</p>
                          <p>Tamaño máximo: 1MB</p>
                          <p>Recomendado: 400x400px</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Estudiante</SelectItem>
                        <SelectItem value="teacher">Profesor</SelectItem>
                        <SelectItem value="coordinator">Coordinador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required={!editingUser}
                      placeholder={
                        editingUser ? "Dejar vacío para no cambiar" : "********"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="document">Documento</Label>
                    <Input
                      id="document"
                      value={formData.document_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          document_number: e.target.value,
                        })
                      }
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingUser ? "Actualizar" : "Crear Usuario"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {
        message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {message.type === "error" && <AlertCircle className="h-4 w-4" />}
            {message.type === "error" && <AlertTitle>Error</AlertTitle>}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )
      }

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Coordinadores
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersByRole.coordinators.length}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profesores
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersByRole.teachers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estudiantes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersByRole.students.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Tables */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="coordinators">
            Coordinadores ({usersByRole.coordinators.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Profesores ({usersByRole.teachers.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Estudiantes ({usersByRole.students.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Usuarios</CardTitle>
              <CardDescription>
                Lista completa de usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={paginatedUsers("all")}
                getRoleAvatar={getRoleAvatar}
                getRoleBadge={getRoleBadge}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleView={handleView}
              />
            </CardContent>
          </Card>
          {totalPages("all") > 1 && (
            <div className="flex justify-end items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {Array.from({ length: totalPages("all") }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages("all")}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coordinators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordinadores</CardTitle>
              <CardDescription>Usuarios con rol de coordinador</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={paginatedUsers("coordinators")}
                getRoleAvatar={getRoleAvatar}
                getRoleBadge={getRoleBadge}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleView={handleView}
              />
            </CardContent>
          </Card>
          {totalPages("coordinators") > 1 && (
            <div className="flex justify-end items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {Array.from({ length: totalPages("coordinators") }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages("coordinators")}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profesores</CardTitle>
              <CardDescription>Usuarios con rol de profesor</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={paginatedUsers("teachers")}
                getRoleAvatar={getRoleAvatar}
                getRoleBadge={getRoleBadge}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleView={handleView}
              />
            </CardContent>
          </Card>
          {totalPages("teachers") > 1 && (
            <div className="flex justify-end items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {Array.from({ length: totalPages("teachers") }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages("teachers")}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes</CardTitle>
              <CardDescription>Usuarios con rol de estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={paginatedUsers("students")}
                getRoleAvatar={getRoleAvatar}
                getRoleBadge={getRoleBadge}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleView={handleView}
              />
            </CardContent>
          </Card>
          {totalPages("students") > 1 && (
            <div className="flex justify-end items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {Array.from({ length: totalPages("students") }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages("students")}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para ver detalles del usuario */}
      <Dialog
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {/* Mostrar la imagen del usuario si existe */}
                <Avatar className="h-16 w-16">
                  {viewingUserImage ? (
                    <AvatarImage src={viewingUserImage} alt={viewingUser.name} />
                  ) : (
                    <AvatarFallback>
                      {getRoleAvatar(viewingUser.role)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">
                    {viewingUser.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewingUser.email}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <p>
                  <span className="font-medium">Rol:</span>{" "}
                  {getRoleBadge(viewingUser.role)}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {viewingUser.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Documento:</span>{" "}
                  {viewingUser.document_number || "N/A"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmación de eliminación */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al usuario <span className="font-bold">{userToDelete?.name}</span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}