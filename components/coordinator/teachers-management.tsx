"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Mail,
  Phone,
  BookOpen,
  UserCheck,
  UserX,
  UserPlus,
  Trash2,
  Edit,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Importa el cliente de Supabase
import { supabase } from "@/lib/supabase";

// Define una interfaz para el tipo de datos de un profesor
interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: "active" | "inactive";
  created_at: string;
}

// Interfaz para las estadísticas
interface TeacherStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

const getStatusBadge = (status: "active" | "inactive") => {
  const variants = {
    active: "default",
    inactive: "secondary",
  } as const;

  const labels = {
    active: "Activo",
    inactive: "Inactivo",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

export default function TeachersManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    status: "active" as "active" | "inactive",
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherStats>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });

  // --- Lógica de Supabase y gestión de datos ---
  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("teachers").select("*");
    if (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error al cargar",
        description: "No se pudieron cargar los profesores.",
        variant: "destructive",
      });
      setTeachers([]);
    } else {
      setTeachers(data as Teacher[]);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === "active").length;
    const inactive = teachers.filter((t) => t.status === "inactive").length;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const newThisMonth = teachers.filter((teacher) => {
      const createdAt = new Date(teacher.created_at);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    }).length;

    setStats({ total, active, inactive, newThisMonth });
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [teachers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        subject: teacher.subject,
        status: teacher.status,
      });
    } else {
      setCurrentTeacher(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTeacher) {
      const { error } = await supabase
        .from("teachers")
        .update(formData)
        .eq("id", currentTeacher.id);
      if (error) {
        console.error("Error updating teacher:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el profesor.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profesor actualizado",
          description: `El profesor ${formData.name} ha sido actualizado correctamente.`,
        });
        fetchTeachers();
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from("teachers").insert([formData]);
      if (error) {
        console.error("Error adding teacher:", error);
        toast({
          title: "Error",
          description: "No se pudo agregar el profesor.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profesor agregado",
          description: `El profesor ${formData.name} ha sido agregado correctamente.`,
        });
        fetchTeachers();
        setIsDialogOpen(false);
      }
    }
  };

  const handleDeleteConfirmation = (teacherId: string) => {
    setTeacherToDeleteId(teacherId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDeleteId) return;

    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", teacherToDeleteId);

    if (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el profesor.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profesor eliminado",
        description: "El profesor ha sido eliminado correctamente.",
      });
      fetchTeachers();
    }
    setIsDeleteDialogOpen(false);
    setTeacherToDeleteId(null);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Profesores
          </h2>
          <p className="text-gray-600">
            Administra los profesores del centro de idiomas.
          </p>
        </div>
      </div>

      {/* Sección de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Profesores
            </CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Profesores registrados
            </p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Profesores activos en el sistema
            </p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Profesores sin asignación
            </p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos este mes
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Profesores recién agregados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Profesores</CardTitle>
          <CardDescription>
            Una lista completa de todos los profesores registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p>Cargando profesores...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden sm:table-cell">Materia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay profesores registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 hidden lg:inline" />
                          <span>{teacher.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{teacher.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{teacher.subject}</TableCell>
                      <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenDialog(teacher)} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteConfirmation(teacher.id)} className="flex items-center gap-2 text-red-600">
                              <Trash2 className="h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Profesor</DialogTitle>
            <DialogDescription>
              Modifica los datos del profesor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTeacher} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Materia/Curso</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al profesor de tu base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}