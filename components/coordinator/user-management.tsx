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
  DialogFooter,
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
  FileText,
} from "lucide-react";
// Supongo que estas funciones existen en tus librerías:
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserImage, uploadImage } from "@/lib/images";
// Supongo que este componente está disponible:
import ImageUpload from "@/components/shared/image-upload";

// --- Tipos y Constantes ---

type UserRole = "coordinator" | "teacher" | "student" | "assistant";
interface UserWithStatus {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  document_number?: string;
  image_url?: string;
}

const PAGE_SIZE = 10;
const MOBILE_BREAKPOINT = 768; // md en Tailwind

// --- Hooks Personalizados ---

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    isMobile: boolean;
  }>({
    width: undefined,
    isMobile: false,
  });

  useEffect(() => {
    function handleResize() {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setWindowSize({
        width: window.innerWidth,
        isMobile: isMobile,
      });
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize(); // Call on mount
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return windowSize;
};

// --- Componentes Reutilizables de Vista (Adaptados) ---

const UserTable = ({
  users,
  getRoleAvatar,
  getRoleBadge,
  handleEdit,
  handleDelete,
  handleView,
}: {
  users: UserWithStatus[];
  getRoleAvatar: (role: string) => React.ReactNode;
  getRoleBadge: (role: string) => React.ReactNode;
  handleEdit: (user: UserWithStatus) => void;
  handleDelete: (user: UserWithStatus) => void;
  handleView: (user: UserWithStatus) => void;
}) => {
  return (
    <Table className="hidden md:table">
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
                <Avatar className="h-8 w-8">
                  {user.image_url ? (
                    <AvatarImage src={user.image_url} alt={user.name} />
                  ) : (
                    <AvatarFallback>{getRoleAvatar(user.role)}</AvatarFallback>
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

const UserCardList = ({
  users,
  getRoleAvatar,
  getRoleBadge,
  handleEdit,
  handleDelete,
  handleView,
}: {
  users: UserWithStatus[];
  getRoleAvatar: (role: string) => React.ReactNode;
  getRoleBadge: (role: string) => React.ReactNode;
  handleEdit: (user: UserWithStatus) => void;
  handleDelete: (user: UserWithStatus) => void;
  handleView: (user: UserWithStatus) => void;
}) => {
  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground p-4">
        No hay usuarios que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:hidden">
      {users.map((user) => (
        <Card key={user.id} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                {user.image_url ? (
                  <AvatarImage src={user.image_url} alt={user.name} />
                ) : (
                  <AvatarFallback>{getRoleAvatar(user.role)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-base">{user.name}</CardTitle>
                <CardDescription className="text-xs">
                  {user.email}
                </CardDescription>
              </div>
            </div>
            {getRoleBadge(user.role)}
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            <p className="text-sm">
              <span className="font-semibold">Teléfono:</span>{" "}
              {user.phone || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Documento:</span>{" "}
              {user.document_number || "N/A"}
            </p>
            <div className="flex justify-end gap-2 pt-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// --- Componente de Carga Masiva (Nuevo) ---

const CSVUploadDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv") {
        setError("El archivo debe ser un archivo CSV (.csv).");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor, selecciona un archivo CSV.");
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split("\n").filter((line) => line.trim() !== "");

      // Omitir la cabecera, si existe (asumiendo formato: name,email,password,role,phone,document_number)
      const usersData = lines
        .slice(1) // Omitir la primera línea si asumimos cabecera
        .map((line) => {
          const [name, email, password, role, phone, document_number] =
            line.split(",").map((s) => s.trim().replace(/"/g, ""));
          return {
            name,
            email,
            password,
            role: role as UserRole,
            phone: phone || undefined,
            document_number: document_number || undefined,
          };
        })
        .filter((user) => user.name && user.email && user.password && user.role); // Simple validación mínima

      if (usersData.length === 0) {
        setLoading(false);
        setError("No se encontraron datos de usuarios válidos en el archivo.");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Aquí se simularía la llamada a la API por cada usuario
      for (const userData of usersData) {
        try {
          // Nota: La creación masiva real debería tener un endpoint optimizado
          // En este ejemplo, llamamos a createUser por cada uno (puede ser lento/caro en la vida real)
          const result = await createUser(userData);
          if (result) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error("Error al crear usuario masivo:", err);
          errorCount++;
        }
      }

      setLoading(false);
      if (errorCount === 0) {
        onSuccess(
          `Creación masiva exitosa. ${successCount} usuarios creados.`
        );
      } else {
        onSuccess(
          `Carga finalizada: ${successCount} usuarios creados, ${errorCount} errores.`
        );
      }
      onOpenChange(false);
    };

    reader.onerror = () => {
      setLoading(false);
      setError("Error al leer el archivo.");
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Usuarios</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV para crear múltiples usuarios a la vez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Formato esperado (sin cabecera si omitida, o con la cabecera exacta si se incluye):
              <code className="block mt-1 p-1 bg-gray-100 rounded text-gray-700">
                name,email,password,role,phone,document_number
              </code>
              Roles válidos: "coordinator", "teacher", "student", "assistant".
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir y Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --- Componente Principal ---

export default function UserManagement() {
  const { isMobile } = useWindowSize(); // Usar el hook para responsividad
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false); // Nuevo estado para CSV
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
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    // Reiniciar paginación al recargar usuarios
    setCurrentPage(1);
    try {
      const userData = await getAllUsers();
      const usersWithImages = await Promise.all(
        userData.map(async (user) => {
          // Cargar imagen solo si el usuario tiene un ID (para evitar errores en la carga)
          const imageUrl = user.id
            ? await getUserImage(user.id, "avatar")
            : undefined;
          return {
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            role: user.role || "student",
            phone: user.phone,
            document_number: user.document_number,
            image_url: imageUrl,
          };
        })
      );
      setUsers(
        usersWithImages.map((user) => ({
          ...user,
          image_url: user.image_url || undefined,
        }))
      );
      setMessage(null);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setMessage({ type: "error", text: "Error al cargar la lista de usuarios." });
    } finally {
      setLoading(false);
    }
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
    setCreating(true);
    try {
      let success = false;
      let newOrUpdatedUser;

      // 1. Preparar datos de envío
      const dataToSend = { ...formData };
      if (editingUser) {
        // En edición, si la contraseña está vacía, no la enviamos para no cambiarla
        if (!dataToSend.password) {
          (dataToSend as Partial<typeof dataToSend>).password = undefined;
        }
        // Llamada a actualización
        newOrUpdatedUser = await updateUser(editingUser.id, dataToSend);
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;
      } else {
        // En creación, la contraseña es obligatoria (validado en el formulario)
        newOrUpdatedUser = await createUser(formData);
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;

        // 2. Subir imagen si es un usuario nuevo y hay una imagen temporal
        if (success && tempImageFile && newOrUpdatedUser?.id) {
          try {
            await uploadImage(tempImageFile, newOrUpdatedUser.id, "avatar");
          } catch (imageError) {
            console.error(
              "Error al subir la imagen del nuevo usuario:",
              imageError
            );
            // Mostrar un error de imagen, pero la creación de usuario es exitosa
          }
        }
      }

      // 3. Manejo de resultado
      if (success) {
        setMessage({
          type: "success",
          text: `Usuario ${
            editingUser ? "actualizado" : "creado"
          } exitosamente`,
        });
        setDialogOpen(false);
        resetForm();
        loadUsers();
      } else {
        setMessage({
          type: "error",
          text: `Error al ${
            editingUser ? "actualizar" : "crear"
          } usuario. Verifique los datos.`,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      const errorMessage =
        (error as Error).message || "Error inesperado en la operación.";
      setMessage({
        type: "error",
        text: `Error: ${errorMessage}`,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleNewUserImageSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Por favor selecciona un archivo de imagen válido.",
      });
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      // 1MB
      setMessage({
        type: "error",
        text: "El archivo es muy grande. Máximo 1MB permitido.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setTempImageFile(file);
    setMessage(null);
  };

  const handleRemoveTempImage = () => {
    setTempImageFile(null);
    setTempImagePreview(null);
  };

  const handleEdit = useCallback((user: UserWithStatus) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Siempre vacío al editar
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
    // Cargar la imagen del usuario para el modal de vista
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
  
  const handleCsvSuccess = (text: string) => {
    setMessage({ type: "success", text });
    loadUsers();
  };

  const getRoleBadge = useCallback((role: string) => {
    const variants = {
      coordinator: "default",
      teacher: "secondary",
      student: "outline",
      assistant: "default", // Agregado variante para asistente
    } as const;
    const labels = {
      coordinator: "Coordinador",
      teacher: "Profesor",
      student: "Estudiante",
      assistant: "Asistente",
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
      assistant: "bg-orange-600", // Agregado color para asistente
    };
    const avatarIconMap = {
      coordinator: <Users className="h-5 w-5 text-white" />,
      teacher: <BookOpen className="h-5 w-5 text-white" />,
      student: <GraduationCap className="h-5 w-5 text-white" />,
      assistant: <Users className="h-5 w-5 text-white" />, // Ícono de Users o uno específico
    };
    return (
      <span
        className={`flex items-center justify-center rounded-full ${
          avatarMap[(role as keyof typeof avatarMap) || "student"]
        } h-full w-full`}
      >
        {avatarIconMap[(role as keyof typeof avatarIconMap) || "student"]}
      </span>
    );
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        (user.document_number && user.document_number.includes(lowerCaseQuery)) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
    );
    if (
      currentPage > 1 &&
      Math.ceil(filtered.length / PAGE_SIZE) < currentPage
    ) {
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

  const roleKeys: (keyof typeof usersByRole)[] = [
    "all",
    "coordinators",
    "teachers",
    "students",
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* CABECERA (Totalmente Responsiva) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra coordinadores, profesores y estudiantes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-2 space-y-2 sm:space-y-0 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Buscar por nombre, email o documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64" // Ocupa todo el ancho en móvil, 64 en sm+
          />
          <div className="flex w-full sm:w-auto space-x-2">
             {/* Botón de Carga Masiva */}
            <Button
              variant="outline"
              onClick={() => setCsvDialogOpen(true)}
              title="Carga masiva por CSV"
              className="w-1/2 sm:w-auto" // Ocupa mitad de ancho en móvil
            >
              <FileText className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">CSV</span>
            </Button>
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
                <Button className="w-1/2 sm:w-auto"> {/* Ocupa mitad de ancho en móvil */}
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Agregar Usuario</span>
                  <span className="inline sm:hidden">Agregar</span>
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
                          loadUsers(); // Recargar usuarios para actualizar la tabla
                        }}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Foto de perfil</h3>
                          <p className="text-sm text-muted-foreground">
                            Sube una foto para el usuario (opcional)
                          </p>
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
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handleNewUserImageSelect(e.target.files[0])
                              }
                            />
                            <Button
                              type="button"
                              onClick={() =>
                                document.getElementById("newUserImage")?.click()
                              }
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          <SelectItem value="assistant">Asistente</SelectItem>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      {/* Diálogo de Carga Masiva CSV */}
      <CSVUploadDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onSuccess={handleCsvSuccess}
      />
      {/* Alerta de Mensajes */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="my-4"
        >
          {message.type === "error" && <AlertCircle className="h-4 w-4" />}
          {message.type === "error" && <AlertTitle>Error</AlertTitle>}
          <AlertDescription>{message.text}</AlertDescription>
          {message.type === "success" && (
            <AlertTitle>Éxito</AlertTitle>
          )}
        </Alert>
      )}
      {/* TARJETAS DE ESTADÍSTICAS (Adaptación a Móvil: 1 columna, luego 2, luego 3) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
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
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
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
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
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
      {/* Tabs de Usuarios */}
      <Tabs defaultValue="all" className="space-y-4">
        {/* Los contadores están en el texto de los TabsTrigger */}
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
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
        {roleKeys.map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {role === "all"
                    ? "Todos los Usuarios"
                    : role.charAt(0).toUpperCase() + role.slice(1)}
                </CardTitle>
                <CardDescription>
                  {role === "all"
                    ? "Lista completa de usuarios del sistema"
                    : `Usuarios con rol de ${
                        role === "coordinators"
                          ? "coordinador"
                          : role === "teachers"
                          ? "profesor"
                          : "estudiante"
                      }`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Renderizado condicional basado en el tamaño de la ventana */}
                {isMobile ? (
                  <UserCardList
                    users={paginatedUsers(role)}
                    getRoleAvatar={getRoleAvatar}
                    getRoleBadge={getRoleBadge}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleView={handleView}
                  />
                ) : (
                  <UserTable
                    users={paginatedUsers(role)}
                    getRoleAvatar={getRoleAvatar}
                    getRoleBadge={getRoleBadge}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleView={handleView}
                  />
                )}
              </CardContent>
            </Card>
            {/* Paginación */}
            {totalPages(role) > 1 && (
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
                {Array.from({ length: totalPages(role) }, (_, i) => i + 1).map(
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
                  disabled={currentPage === totalPages(role)}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
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
                    <AvatarImage
                      src={viewingUserImage}
                      alt={viewingUser.name}
                    />
                  ) : (
                    <AvatarFallback>
                      {getRoleAvatar(viewingUser.role)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="text-lg font-bold">{viewingUser.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {viewingUser.email}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <div>
                  <span className="font-medium">Rol:</span>{" "}
                  {getRoleBadge(viewingUser.role)}
                </div>
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
    </div>
  );
}