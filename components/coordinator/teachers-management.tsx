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
  CardFooter,
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
  Trash2,
  Edit,
  Eye,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { supabase } from "@/lib/supabase";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUserImage } from "@/lib/images";

// --- Tipos de Datos ---
type EnglishLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7";
const ENGLISH_LEVELS: EnglishLevel[] = ["1", "2", "3", "4", "5", "6", "7"];

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  document_number: string | null;
  english_level: EnglishLevel | null; 
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  avatar: string | null;
  address: string | null;
}

interface Teacher extends Omit<User, "is_active" | "document_number" | "avatar" | "address" | "updated_at"> {
  status: "active" | "inactive";
  document: string | null;
  imageUrl?: string | null;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

// --- Función de Componente de Badge ---
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

// --- Componente Principal ---
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
    english_certificate: "1" as EnglishLevel, 
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(
    null
  );
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [filterDocument, setFilterDocument] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [teacherToPreview, setTeacherToPreview] = useState<Teacher | null>(
    null
  );
  const [selectedEnglishLevel, setSelectedEnglishLevel] = useState<EnglishLevel | "all">("all");


  // --- Lógica de Supabase (sin cambios significativos) ---
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
      const mappedTeachers = await Promise.all(
        data.map(async (dbUser: User) => {
          const imageUrl = await getUserImage(dbUser.id, "avatar");

          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone,
            role: dbUser.role,
            document: dbUser.document_number,
            english_level: (ENGLISH_LEVELS.includes(dbUser.english_level as EnglishLevel) ? dbUser.english_level : null) as EnglishLevel | null, 
            created_at: dbUser.created_at,
            status: dbUser.is_active ? "active" : "inactive",
            imageUrl: imageUrl,
          };
        })
      );
      setTeachers(
        mappedTeachers.map((teacher) => ({
          ...teacher,
          status: teacher.status as "active" | "inactive",
        }))
      );
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === "active").length;
    const inactive = teachers.filter((t) => t.status === "inactive").length;

    setStats({ total, active, inactive });
  };

  // --- Hooks de Efecto ---
  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [teachers]);

  // Lógica de filtrado y paginación
  const filteredTeachers = teachers.filter((teacher) => {
    const documentMatch = teacher.document
      ? teacher.document.toLowerCase().includes(filterDocument.toLowerCase())
      : false;
    
    const englishLevelMatch = selectedEnglishLevel === "all" || teacher.english_level === selectedEnglishLevel;
    
    return documentMatch && englishLevelMatch;
  });

  useEffect(() => {
    setTotalPages(Math.ceil(filteredTeachers.length / itemsPerPage));
    setCurrentPage(1);
  }, [filteredTeachers.length, itemsPerPage]);

  const indexOfLastTeacher = currentPage * itemsPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(
    indexOfFirstTeacher,
    indexOfLastTeacher
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };


  // --- Manejadores de Formularios y Diálogos ---
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
        english_certificate: teacher.english_level ?? "1", 
      });
      setIsDialogOpen(true);
    } 
  };
  
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const { document, status, english_certificate, ...dataToSave } = formData;
    const is_active = status === "active";
    const document_number = document;

    if (currentTeacher) {
      // Lógica de Edición
      const { error } = await supabase
        .from("users")
        .update({
          ...dataToSave,
          is_active,
          document_number,
          english_level: english_certificate,
          updated_at: new Date().toISOString(),
        })
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
      // Rama que ya no se usa, pero se deja por completitud
      const newTeacherData = {
        ...dataToSave,
        is_active,
        document_number,
        english_level: english_certificate,
        role: "teacher",
        created_at: new Date().toISOString(),
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

  const handleOpenPreviewDialog = (teacher: Teacher) => {
    setTeacherToPreview(teacher);
    setIsPreviewDialogOpen(true);
  };

  // --- Paginación y navegación (sin cambios) ---
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          onClick={() => paginate(1)}
          disabled={currentPage === 1}
          variant="outline"
          size="icon"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="icon"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((number) => (
          <Button
            key={number}
            onClick={() => paginate(number)}
            variant={number === currentPage ? "default" : "outline"}
            size="icon"
            className="hidden sm:flex"
          >
            {number}
          </Button>
        ))}
        
        <span className="text-sm text-gray-700 dark:text-gray-400 sm:hidden">
          {currentPage} / {totalPages}
        </span>

        <Button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="icon"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="icon"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // --- Vista de Listado de Profesores (SOLO CARDS) ---

  const TeacherListView = ({ teachers }: { teachers: Teacher[] }) => {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teachers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No se encontraron profesores que coincidan con la búsqueda.
          </div>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={teacher.imageUrl || ""}
                      alt={teacher.name}
                    />
                    <AvatarFallback>
                      {teacher.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {teacher.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      ID: {teacher.document || "N/A"}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(teacher.status)}
              </CardHeader>
              <CardContent className="p-4 pt-2 border-t border-b">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <a href={`mailto:${teacher.email}`} className="text-blue-600 hover:underline flex items-center gap-1 max-w-[60%] truncate justify-end">
                       <Mail className="h-3 w-3 sm:hidden"/> {teacher.email}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <a href={`tel:${teacher.phone}`} className="text-gray-900 flex items-center gap-1 justify-end">
                      <Phone className="h-3 w-3 sm:hidden"/> {teacher.phone || "N/A"}
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Certificado:</span>
                    <Badge variant="outline">{teacher.english_level || "N/A"}</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 p-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(teacher)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPreviewDialog(teacher)}
                        className="text-blue-600"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleDeleteConfirmation(teacher.id)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Profesores
          </h2>
          {/* MODIFICACIÓN DE LA DESCRIPCIÓN */}
          <p className="text-gray-600">
            Gestiona, edita y elimina los perfiles de los docentes. Utiliza los filtros para encontrar rápidamente a un profesor específico.
          </p>
        </div>
      </div>
      
      {/* Sección de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {/* Total de Profesores */}
        <Card className="hover:scale-[1.02] transition-transform duration-300">
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
        
        {/* Activos */}
        <Card className="hover:scale-[1.02] transition-transform duration-300">
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
        
        {/* Inactivos */}
        <Card className="hover:scale-[1.02] transition-transform duration-300">
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
      </div>
      
      {/* Sección de Listado de Profesores (en Cards) */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Profesores</CardTitle>
          <CardDescription>
            Tarjetas de información de todos los profesores registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <Input
              type="text"
              placeholder="Filtrar por documento..."
              value={filterDocument}
              onChange={(e) => setFilterDocument(e.target.value)}
              className="max-w-xs flex-grow"
            />
             <Select
                value={selectedEnglishLevel}
                onValueChange={(value: EnglishLevel | "all") =>
                  setSelectedEnglishLevel(value as EnglishLevel | "all")
                }
              >
                <SelectTrigger className="w-full sm:max-w-[200px]">
                  <SelectValue placeholder="Filtrar por certificado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ENGLISH_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p>Cargando profesores...</p>
            </div>
          ) : (
            <>
              <TeacherListView teachers={currentTeachers} />
              {/* Controles de Paginación */}
              <PaginationControls />
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentTeacher ? "Editar Profesor" : "Añadir Nuevo Profesor"}
            </DialogTitle>
            <DialogDescription>
              {currentTeacher
                ? "Modifica los datos del profesor."
                : "Completa los campos para añadir un nuevo profesor."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTeacher} className="grid gap-4 py-4">
            {/* ... Campos de Nombre, Documento, Email, Teléfono (sin cambios) ... */}
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

            {/* Campo Certificado de Inglés */}
            <div className="grid gap-2">
              <Label htmlFor="english_certificate">Certificado de Inglés</Label>
              <Select
                value={formData.english_certificate}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    english_certificate: value as EnglishLevel,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un certificado" />
                </SelectTrigger>
                <SelectContent>
                  {ENGLISH_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {currentTeacher ? "Guardar Cambios" : "Añadir Profesor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Previsualización */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles de {teacherToPreview?.name}</DialogTitle>
            <DialogDescription>
              Información detallada del profesor.
            </DialogDescription>
          </DialogHeader>
          {teacherToPreview && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={teacherToPreview.imageUrl || ""}
                    alt={teacherToPreview.name}
                  />
                  <AvatarFallback>
                    {teacherToPreview.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <Label className="font-medium text-muted-foreground">Nombre:</Label>
                <span className="font-semibold text-right">{teacherToPreview.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <Label className="font-medium text-muted-foreground">Documento:</Label>
                <span className="font-semibold text-right">{teacherToPreview.document || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <Label className="font-medium text-muted-foreground">Email:</Label>
                <span className="font-semibold text-right truncate max-w-[50%]">{teacherToPreview.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <Label className="font-medium text-muted-foreground">Teléfono:</Label>
                <span className="font-semibold text-right">{teacherToPreview.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <Label className="font-medium text-muted-foreground">Certificado:</Label>
                <Badge variant="outline">{teacherToPreview.english_level || "N/A"}</Badge>
              </div>
              <div className="flex justify-between">
                <Label className="font-medium text-muted-foreground">Estado:</Label>
                {getStatusBadge(teacherToPreview.status)}
              </div>

            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación (sin cambios) */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
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