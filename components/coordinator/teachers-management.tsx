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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  document_number: string | null;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  avatar: string | null;
  address: string | null;
}

interface Teacher extends Omit<User, 'is_active' | 'document_number'> {
  status: "active" | "inactive";
  document: string | null;
}

interface UserStats {
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
    document: "",
    status: "active" as "active" | "inactive",
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
  });
  const [filterName, setFilterName] = useState("");
  const [filterDocument, setFilterDocument] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "teacher");

    if (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error al cargar",
        description: "No se pudieron cargar los profesores.",
        variant: "destructive",
      });
      setTeachers([]);
    } else {
      const mappedTeachers = data.map((dbUser: User) => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        document: dbUser.document_number,
        created_at: dbUser.created_at,
        status: dbUser.is_active ? "active" : "inactive",
      }));
      setTeachers(mappedTeachers);
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

  useEffect(() => {
    const filtered = teachers.filter((teacher) =>
      teacher.name.toLowerCase().includes(filterName.toLowerCase()) &&
      (teacher.document ? teacher.document.toLowerCase().includes(filterDocument.toLowerCase()) : true)
    );
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [teachers, filterName, filterDocument, itemsPerPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setFormData({
        name: teacher.name ?? "",
        email: teacher.email ?? "",
        phone: teacher.phone ?? "",
        document: teacher.document ?? "",
        status: teacher.status,
      });
    } else {
      setCurrentTeacher(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        document: "",
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const { document, status, ...dataToSave } = formData;
    const is_active = status === "active";
    const document_number = document;

    if (currentTeacher) {
      const { error } = await supabase
        .from("users")
        .update({ ...dataToSave, is_active, document_number })
        .eq("id", currentTeacher.id);
      if (error) {
        console.error("Error updating user:", error);
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
      const newTeacherData = { 
        ...dataToSave, 
        is_active, 
        document_number, 
        role: "teacher", 
      };
      const { error } = await supabase.from("users").insert([newTeacherData]);
      if (error) {
        console.error("Error adding user:", error);
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
      .from("users")
      .delete()
      .eq("id", teacherToDeleteId);

    if (error) {
      console.error("Error deleting user:", error);
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

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(filterName.toLowerCase()) &&
    (teacher.document ? teacher.document.toLowerCase().includes(filterDocument.toLowerCase()) : true)
  );

  const indexOfLastTeacher = currentPage * itemsPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstTeacher, indexOfLastTeacher);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Añadir Profesor
        </Button>
      </div>

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
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="max-w-xs"
            />
            <Input
              type="text"
              placeholder="Filtrar por documento..."
              value={filterDocument}
              onChange={(e) => setFilterDocument(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p>Cargando profesores...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Documento</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No se encontraron profesores que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{teacher.document}</TableCell>
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
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
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
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición/Creación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentTeacher ? "Editar Profesor" : "Añadir Nuevo Profesor"}
            </DialogTitle>
            <DialogDescription>
              {currentTeacher ? "Modifica los datos del profesor." : "Completa los campos para añadir un nuevo profesor."}
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
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                name="document"
                value={formData.document}
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
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {currentTeacher ? "Guardar Cambios" : "Añadir Profesor"}
              </Button>
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