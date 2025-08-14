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
} from "lucide-react";
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/auth";
import type { User } from "@/lib/supabase"; // Asegúrate de que esta interfaz incluye document_number

// Define el tipo para los roles
type UserRole = "coordinator" | "teacher" | "student";

// Extiende la interfaz User si es necesario para incluir document_number
// Por ejemplo:
// interface UserWithDoc extends User {
//   document_number?: string;
// }

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // No se precargará el password para edición
    role: "student" as UserRole,
    phone: "",
    document_number: "",
  });

  // Usa useCallback para memorizar la función de carga
  const loadUsers = useCallback(async () => {
    setLoading(true);
    const userData = await getAllUsers();
    setUsers(userData);
    setLoading(false);
    setMessage(null); // Resetea el mensaje de alerta
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      let success = false;
      let newOrUpdatedUser;

      if (editingUser) {
        // Al actualizar, enviamos solo los campos que no están vacíos
        const dataToSend = { ...formData };
        if (!dataToSend.password) {
          delete dataToSend.password;
        }

        newOrUpdatedUser = await updateUser(editingUser.id, dataToSend);
        success = !!newOrUpdatedUser;
      } else {
        // Al crear, la contraseña es obligatoria
        newOrUpdatedUser = await createUser(formData);
        success = !!newOrUpdatedUser;
      }

      if (success) {
        setMessage({
          type: "success",
          text: `Usuario ${
            editingUser ? "actualizado" : "creado"
          } exitosamente`,
        });
        setDialogOpen(false); // Cierra el diálogo en caso de éxito
        resetForm(); // Resetea el formulario al cerrar
        loadUsers(); // Recarga los usuarios
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
      setMessage({ type: "error", text: "Error inesperado" });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // No precargues la contraseña por seguridad
      role: user.role as UserRole,
      phone: user.phone || "",
      document_number: (user as any).document_number || "", // Considera actualizar la interfaz User
    });
    setDialogOpen(true);
  };

  const handleDelete = async (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setCreating(true); // Usa el mismo estado de loading para la acción
      try {
        const success = await deleteUser(userToDelete.id);
        if (success) {
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
        setUserToDelete(null); // Limpia el usuario a eliminar
      }
    }
  };

  // Memoiza las listas de usuarios por rol para mejorar el rendimiento
  const usersByRole = useMemo(() => {
    return {
      coordinators: users.filter((user) => user.role === "coordinator"),
      teachers: users.filter((user) => user.role === "teacher"),
      students: users.filter((user) => user.role === "student"),
      all: users,
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
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
      <Badge variant={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const UserTable = ({ users: filteredUsers }: { users: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground"
            >
              No hay usuarios en esta categoría.
            </TableCell>
          </TableRow>
        ) : (
          filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || "N/A"}</TableCell>
              <TableCell>{(user as any).document_number || "N/A"}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
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

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetForm(); // Resetea el formulario cuando se cierra el diálogo
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
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
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser} // Contraseña requerida solo al crear
                  placeholder={
                    editingUser ? "Dejar vacío para no cambiar" : "********"
                  }
                />
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

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" && <AlertCircle className="h-4 w-4" />}
          {message.type === "error" && <AlertTitle>Error</AlertTitle>}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
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

        <Card>
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

        <Card>
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
          <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
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

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Usuarios</CardTitle>
              <CardDescription>
                Lista completa de usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={usersByRole.all} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators">
          <Card>
            <CardHeader>
              <CardTitle>Coordinadores</CardTitle>
              <CardDescription>Usuarios con rol de coordinador</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={usersByRole.coordinators} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Profesores</CardTitle>
              <CardDescription>Usuarios con rol de profesor</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={usersByRole.teachers} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes</CardTitle>
              <CardDescription>Usuarios con rol de estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={usersByRole.students} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AlertDialog para confirmación de eliminación */}
      <AlertDialog
        open={!!userToDelete} // Usa el estado del usuario a eliminar
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