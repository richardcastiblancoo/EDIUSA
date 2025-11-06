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
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // Asegúrate de tener este componente
// Asegúrate de que estas rutas son correctas
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserImage, uploadImage } from "@/lib/images";

// --- Tipos e Interfaces ---
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

// --- Constantes ---
const PAGE_SIZE = 10;
const MOBILE_BREAKPOINT = 768;

// --- Hooks Auxiliares (useWindowSize) ---
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
      handleResize();
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return windowSize;
};

// --- Componente CSVUploadDialog (Carga Masiva - Texto cambiado a "Archivo Excel") ---
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
      // Permite .csv, .xls, .xlsx para dar sensación de "Excel"
      if (
        !selectedFile.name.endsWith(".csv") &&
        !selectedFile.name.endsWith(".xls") &&
        !selectedFile.name.endsWith(".xlsx")
      ) {
        setError("El archivo debe ser un archivo CSV o Excel.");
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
      setError("Por favor, selecciona un archivo.");
      return;
    }
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split("\n").filter((line) => line.trim() !== "");
      const cleanField = (s: string) => s.replace(/\u0000/g, "").trim().replace(/"/g, "");

      const usersData = lines
        .slice(1) // Omitir la primera línea (cabecera)
        .map((line) => {
          const [name, email, password, role, phone, document_number] = line
            .split(",")
            .map(cleanField);
          return {
            name,
            email,
            password,
            role: (["coordinator", "teacher", "student", "assistant"].includes(role as UserRole) ? role : "student") as UserRole,
            phone: phone || undefined,
            document_number: document_number || undefined,
          };
        })
        .filter(
          (user) => user.name && user.email && user.password && user.role
        );

      if (usersData.length === 0) {
        setLoading(false);
        setError("No se encontraron datos de usuarios válidos en el archivo.");
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      for (const userData of usersData) {
        try {
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
        onSuccess(`Carga masiva exitosa. ${successCount} usuarios creados.`);
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
            Sube un archivo **CSV/Excel** para crear múltiples usuarios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo Excel</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Formato ideal: CSV. Columnas esperadas:
              <code className="block mt-1 p-1 bg-gray-100 rounded text-gray-700">
                name,email,password,role,phone,document_number
              </code>
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

// --- Componente UserTable (Vista de Escritorio) ---
const UserTable = ({
  users,
  getRoleAvatar,
  getRoleBadge,
  handleEdit,
  handleDelete,
  handleView,
  selectedUsers,
  handleSelectAll,
  handleSelectUser,
}: any) => {
    const isAllSelected = users.length > 0 && users.every((user: UserWithStatus) => selectedUsers.includes(user.id));
    
    return (
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              {/* Checkbox para seleccionar todos */}
              <TableHead className="w-[50px] pr-0">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked, users)}
                  aria-label="Seleccionar todos"
                  className="rounded-sm"
                />
              </TableHead>
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
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No hay usuarios que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: UserWithStatus) => (
                <TableRow key={user.id}>
                  {/* Checkbox individual */}
                  <TableCell className="pr-0 py-2">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                      aria-label={`Seleccionar ${user.name}`}
                      className="rounded-sm"
                    />
                  </TableCell>
                  {/* Celda de Nombre más compacta */}
                  <TableCell className="font-medium flex items-center gap-2 py-2">
                    <Avatar className="h-7 w-7"> {/* Avatar más pequeño */}
                      {user.image_url ? (
                        <AvatarImage src={user.image_url} alt={user.name} />
                      ) : (
                        <AvatarFallback>{getRoleAvatar(user.role)}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{user.email}</TableCell>
                  <TableCell className="py-2 text-sm">{user.phone || "N/A"}</TableCell>
                  <TableCell className="py-2 text-sm">{user.document_number || "N/A"}</TableCell>
                  <TableCell className="py-2">{getRoleBadge(user.role)}</TableCell>
                  {/* Botones de acción más pequeños */}
                  <TableCell className="py-2">
                    <div className="flex gap-1"> {/* Gap reducido */}
                      <Button
                        variant="outline"
                        size="icon" // Usar size icon para botones de 1x1
                        className="h-7 w-7" // Tamaño físico reducido
                        onClick={() => handleView(user)}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(user)}
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

// --- Componente UserCardList (Vista Móvil) ---
const UserCardList = ({
    users,
    getRoleAvatar,
    getRoleBadge,
    handleEdit,
    handleDelete,
    handleView,
    selectedUsers,
    handleSelectUser,
}: any) => {
    if (users.length === 0) {
        return (
          <p className="text-center text-muted-foreground p-4">
            No hay usuarios que coincidan con la búsqueda.
          </p>
        );
      }

      return (
        <div className="grid gap-2 md:hidden"> {/* Gap reducido */}
          {users.map((user: UserWithStatus) => (
            <Card key={user.id} className="shadow-sm">
              {/* Encabezado más compacto */}
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                <div className="flex items-center space-x-2"> {/* Espacio reducido */}
                  <Avatar className="h-8 w-8"> {/* Avatar más pequeño */}
                    {user.image_url ? (
                      <AvatarImage src={user.image_url} alt={user.name} />
                    ) : (
                      <AvatarFallback>{getRoleAvatar(user.role)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{user.name}</CardTitle> {/* Título más pequeño */}
                    <CardDescription className="text-xs">
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                     <Checkbox // Checkbox móvil a la derecha
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked)}
                        aria-label={`Seleccionar ${user.name}`}
                        className="rounded-sm"
                     />
                </div>
              </CardHeader>
              {/* Contenido más compacto */}
              <CardContent className="space-y-1 p-3 pt-0"> {/* Padding y espacio reducido */}
                <p className="text-xs"> {/* Texto más pequeño */}
                  <span className="font-semibold">Teléfono:</span>{" "}
                  {user.phone || "N/A"}
                </p>
                <p className="text-xs"> {/* Texto más pequeño */}
                  <span className="font-semibold">Documento:</span>{" "}
                  {user.document_number || "N/A"}
                </p>
                <div className="flex justify-end gap-1 pt-1"> {/* Botones y gap reducido */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleView(user)}
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(user)}
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


// ------------------------------------------------------------------------

// --- Componente Principal: UserManagement ---

export default function UserManagement() {
  const { isMobile } = useWindowSize();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
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
  
  // --- Nuevo estado para la eliminación masiva ---
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // --- Lógica de Carga y Refresco ---

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    setSelectedUsers([]); // Limpiar selección al recargar
    try {
      const userData = await getAllUsers();
      const usersWithImages = await Promise.all(
        userData.map(async (user) => {
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
      setMessage({
        type: "error",
        text: "Error al cargar la lista de usuarios.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Lógica de Selección Masiva ---

  const handleSelectUser = (userId: string, isChecked: boolean) => {
    setSelectedUsers((prevSelected) => {
      if (isChecked) {
        return [...prevSelected, userId];
      } else {
        return prevSelected.filter((id) => id !== userId);
      }
    });
  };

  const handleSelectAll = (isChecked: boolean | "indeterminate", currentUsers: UserWithStatus[]) => {
    if (isChecked === true) {
      // Selecciona todos los usuarios que están actualmente visibles
      const allIds = currentUsers.map(user => user.id);
      setSelectedUsers(allIds);
    } else {
      // Deselecciona todos los usuarios actualmente visibles
      const currentIds = currentUsers.map(user => user.id);
      setSelectedUsers(prevSelected => prevSelected.filter(id => !currentIds.includes(id)));
    }
  };


  const handleDeleteSelected = async () => {
    setShowBulkDeleteConfirm(false); // Cierra la confirmación de inmediato
    if (selectedUsers.length === 0) return;

    setCreating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        const success = await deleteUser(userId);
        if (success !== undefined && success !== null) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        errorCount++;
      }
    }

    setCreating(false);
    setSelectedUsers([]);

    if (errorCount === 0) {
      setMessage({
        type: "success",
        text: `${successCount} usuarios eliminados exitosamente.`,
      });
    } else {
      setMessage({
        type: "error",
        text: `Eliminación finalizada: ${successCount} eliminados, ${errorCount} errores.`,
      });
    }
    loadUsers(); // Recargar la lista de usuarios
  };


  // --- Manejo de Formularios y Estados (Resto de funciones) ---

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

  const handleCsvSuccess = (text: string) => {
    setMessage({ type: "success", text });
    loadUsers();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); // Activa la precarga
    let success = false;
    let newOrUpdatedUser: UserWithStatus | null | undefined = null;

    try {
      const sanitize = (s: string) => s.replace(/\u0000/g, "").trim();
      const dataToSend = {
        ...formData,
        name: sanitize(formData.name),
        email: sanitize(formData.email),
        password: formData.password ? sanitize(formData.password) : "",
        role: sanitize(formData.role),
        phone: formData.phone ? sanitize(formData.phone) : "",
        document_number: formData.document_number ? sanitize(formData.document_number) : "",
      };

      if (editingUser) {
        // --- Lógica para Edición ---
        if (!dataToSend.password) {
          (dataToSend as Partial<typeof dataToSend>).password = undefined;
        }

        newOrUpdatedUser = (await updateUser(editingUser.id, dataToSend)) ?? null;
        newOrUpdatedUser = newOrUpdatedUser || null;
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;
      } else {
        // --- Lógica para Creación ---
        newOrUpdatedUser = await createUser(formData);
        success = newOrUpdatedUser !== null && newOrUpdatedUser !== undefined;

        // Si la creación fue exitosa y hay una imagen temporal, se sube
        if (success && tempImageFile && newOrUpdatedUser?.id) {
          await uploadImage(tempImageFile, newOrUpdatedUser.id, "avatar");
        }
      }

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
      let errorMessage = "Error inesperado en la operación.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage({
        type: "error",
        text: `Error: ${errorMessage}. La operación falló.`,
      });
    } finally {
      // Desactiva la precarga SIEMPRE
      setCreating(false);
    }
  };

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

  const handleEdit = useCallback((user: UserWithStatus) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Contraseña vacía por defecto en edición
      role: user.role as UserRole,
      phone: user.phone || "",
      document_number: user.document_number || "",
    });
    setTempImageFile(null);
    setTempImagePreview(null);
    setDialogOpen(true); // Abrir el diálogo
  }, []);

  const handleDelete = useCallback((user: UserWithStatus) => {
    setUserToDelete(user);
  }, []);

  const handleView = useCallback(async (user: UserWithStatus) => {
    setViewingUser(user);
    try {
      const imageUrl = await getUserImage(user.id, "avatar");
      setViewingUserImage(imageUrl);
    } catch (error) {
      console.error("Error al cargar la imagen del usuario:", error);
      setViewingUserImage(null);
    }
  }, []);

  // --- Funciones de Presentación ---
  const getRoleBadge = useCallback((role: string) => {
    const variants = {
      coordinator: "default",
      teacher: "secondary",
      student: "outline",
      assistant: "default",
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
      assistant: "bg-orange-600",
    };
    const avatarIconMap = {
      coordinator: <Users className="h-5 w-5 text-white" />,
      teacher: <BookOpen className="h-5 w-5 text-white" />,
      student: <GraduationCap className="h-5 w-5 text-white" />,
      assistant: <Users className="h-5 w-5 text-white" />,
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
  // ---------------------------------

  // --- Lógica de Búsqueda y Paginación ---

  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        (user.document_number &&
          user.document_number.includes(lowerCaseQuery)) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
    );
  }, [users, searchQuery]);

  useEffect(() => {
    const total = Math.ceil(filteredUsers.length / PAGE_SIZE);
    if (currentPage > 1 && total < currentPage) {
      setCurrentPage(1);
    }
  }, [filteredUsers, currentPage]);

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

  // --- Renderizado Principal ---

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

  const currentTabUsers = usersByRole[
    (document.querySelector('.tabs-list button[aria-selected="true"]') as HTMLButtonElement)?.value as keyof typeof usersByRole || 'all'
  ] || usersByRole.all;
  
  const currentPaginatedUsers = paginatedUsers(
    (document.querySelector('.tabs-list button[aria-selected="true"]') as HTMLButtonElement)?.value as keyof typeof usersByRole || 'all'
  );


  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      {/* Sección Superior: Título, Búsqueda y Botones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold md:text-2xl">Gestión de Usuarios</h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            Administra coordinadores, profesores y estudiantes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-2 space-y-2 sm:space-y-0 w-full md:w-auto">
          {/* 🔎 Input de Búsqueda COMPACTO con Lupa */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuario con nombre, email o cédula" // Texto actualizado
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 h-9 text-sm" // Altura reducida
            />
          </div>
          <div className="flex w-full sm:w-auto space-x-2">
            {/* 🗑️ Botón de Eliminación Masiva (condicional) */}
            {selectedUsers.length > 0 && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={creating}
                    className="w-1/2 sm:w-auto text-xs sm:text-sm"
                >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Eliminar ({selectedUsers.length})
                </Button>
            )}

            {/* 💾 Botón de Carga Masiva COMPACTO con Texto "Archivo Excel" */}
            <Button
              variant="outline"
              onClick={() => setCsvDialogOpen(true)}
              title="Carga masiva por CSV/Excel"
              size="sm" // Tamaño pequeño
              className="w-1/2 sm:w-auto text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Archivo Excel</span>
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
                <Button size="sm" className="w-1/2 sm:w-auto text-xs sm:text-sm"> {/* Tamaño pequeño */}
                  <Plus className="mr-1 h-4 w-4" />
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
                  {/* Campo de Imagen de Perfil */}
                  <div className="mb-4">
                    {editingUser ? (
                      // Sección de información estática del avatar para edición.
                      <div className="flex items-center gap-4 p-2 border rounded-md">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={editingUser.image_url} alt={editingUser.name} />
                          <AvatarFallback>{getRoleAvatar(editingUser.role)}</AvatarFallback>
                        </Avatar>
                        <div>
                           <h3 className="text-base font-medium">Foto de Perfil</h3>
                           <p className="text-xs text-muted-foreground">La foto de perfil solo se puede actualizar desde la vista de perfil del usuario. Aquí solo editas sus datos.</p>
                        </div>
                      </div>
                    ) : (
                      // Lógica de carga temporal para nuevo usuario
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-medium">
                            Foto de perfil
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Sube una foto para el usuario (opcional)
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
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
                              size="sm"
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Seleccionar Imagen
                            </Button>

                            {tempImagePreview && (
                              <Button
                                type="button"
                                onClick={handleRemoveTempImage}
                                variant="outline"
                                size="sm"
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campos de Formulario */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label id="role-label">Rol</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: UserRole) =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger id="role" aria-labelledby="role-label" className="h-9 text-sm">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Estudiante</SelectItem>
                          <SelectItem value="teacher">Profesor</SelectItem>
                          <SelectItem value="coordinator">
                            Coordinador
                          </SelectItem>
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
                      className="h-9 text-sm"
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
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        required={!editingUser}
                        placeholder={
                          editingUser
                            ? "Dejar vacío para no cambiar"
                            : "********"
                        }
                        className="h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9 p-0"
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+57 300 123 4567"
                        className="h-9 text-sm"
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
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating} size="sm">
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

      {/* Diálogo de Carga Masiva */}
      <CSVUploadDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onSuccess={handleCsvSuccess}
      />

      {/* Mensajes de Alerta */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className="my-3 text-sm"
        >
          {message.type === "error" && <AlertCircle className="h-4 w-4" />}
          {message.type === "error" && <AlertTitle>Error</AlertTitle>}
          <AlertDescription>{message.text}</AlertDescription>
          {message.type === "success" && <AlertTitle>Éxito</AlertTitle>}
        </Alert>
      )}

      {/* Tarjetas de Resumen RESPONSIVAS por Rol */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
          {/* CardHeader: Compacto en móvil (p-3), Grande en escritorio (md:p-6 pb-2) */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">
              Total Coordinadores
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 md:h-5 md:w-5" />
          </CardHeader>
          {/* CardContent: Compacto en móvil (p-3 pt-0), Grande en escritorio (md:p-6 md:pt-0) */}
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {/* Tamaño de fuente: xl en móvil, 2xl en escritorio */}
            <div className="text-xl font-bold md:text-2xl">
              {usersByRole.coordinators.length}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profesores
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-600 md:h-5 md:w-5" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">
              {usersByRole.teachers.length}
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estudiantes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600 md:h-5 md:w-5" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl font-bold md:text-2xl">
              {usersByRole.students.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas de Usuarios por Rol */}
      <Tabs defaultValue="all" className="space-y-3">
        {/* Pestañas más compactas */}
        <TabsList className="w-full sm:w-auto flex-wrap h-auto text-sm tabs-list">
          <TabsTrigger value="all" className="py-1 px-3">Todos ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="coordinators" className="py-1 px-3">
            Coordinadores ({usersByRole.coordinators.length})
          </TabsTrigger>
          <TabsTrigger value="teachers" className="py-1 px-3">
            Profesores ({usersByRole.teachers.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="py-1 px-3">
            Estudiantes ({usersByRole.students.length})
          </TabsTrigger>
        </TabsList>
        {roleKeys.map((role) => (
          <TabsContent key={role} value={role} className="space-y-3">
            <Card>
              {/* Checkbox "Seleccionar todos" visible solo en escritorio para evitar redundancia con el checkbox de la tabla */}
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">
                      {role === "all"
                        ? "Todos los Usuarios"
                        : role.charAt(0).toUpperCase() + role.slice(1)}
                    </CardTitle>
                    <CardDescription className="text-sm">
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
                </div>
                {/* Checkbox "Seleccionar todos" para móvil/listado */}
                <div className="flex items-center space-x-2 md:hidden">
                    <Checkbox
                        checked={currentPaginatedUsers.length > 0 && currentPaginatedUsers.every(user => selectedUsers.includes(user.id))}
                        onCheckedChange={(checked) => handleSelectAll(checked, currentPaginatedUsers)}
                        aria-label="Seleccionar todos"
                        className="rounded-sm"
                    />
                    <Label className="text-sm">Seleccionar Todos</Label>
                </div>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                {isMobile ? (
                  <UserCardList
                    users={paginatedUsers(role)}
                    getRoleAvatar={getRoleAvatar}
                    getRoleBadge={getRoleBadge}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleView={handleView}
                    selectedUsers={selectedUsers}
                    handleSelectUser={handleSelectUser}
                  />
                ) : (
                  <UserTable
                    users={paginatedUsers(role)}
                    getRoleAvatar={getRoleAvatar}
                    getRoleBadge={getRoleBadge}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleView={handleView}
                    selectedUsers={selectedUsers}
                    handleSelectUser={handleSelectUser}
                    handleSelectAll={handleSelectAll}
                  />
                )}
              </CardContent>
            </Card>
            {/* Paginación */}
            {totalPages(role) > 1 && (
              <div className="flex justify-end items-center space-x-2 text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                {/* Renderizar botones de página */}
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

      {/* Diálogo de Visualización */}
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
              <div className="grid gap-2 text-sm">
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

      {/* Diálogo de Eliminación Individual */}
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
      
      {/* Diálogo de Eliminación Masiva */}
      <AlertDialog
        open={showBulkDeleteConfirm}
        onOpenChange={(open) => !open && setShowBulkDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación Masiva</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar permanentemente a **{selectedUsers.length}** usuarios seleccionados. Esta acción no se puede deshacer. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} disabled={creating} className="bg-red-600 hover:bg-red-700">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, Eliminar ({selectedUsers.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}