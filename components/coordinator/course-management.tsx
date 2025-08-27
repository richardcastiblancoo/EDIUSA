"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, BookOpen, Users, Clock, Calendar, X, Loader2, Eye as EyeIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Importaciones de tipos y funciones de Supabase (ajustadas)
import { Course, createCourse, updateCourse, deleteCourse, getCourses } from "@/lib/courses";
import { getStudentsForCourse, searchStudents, addStudentsToCourse } from "@/lib/students";
import { getTeachers } from "@/lib/teachers"; // <--- Nueva importación para cargar profesores

// Definiciones de tipos para los datos
type Student = {
  id: string;
  name: string;
  course_id: string | null;
  documentId: string;
  photoUrl: string;
};

type Teacher = {
  id: string;
  name: string;
};

// Custom hook para implementar el debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Componente principal de gestión de cursos
export default function CourseManagement() {
  // --- Estado del componente ---
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentsByCourse, setStudentsByCourse] = useState<{ [key: string]: Student[] }>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isStudentSearchLoading, setIsStudentSearchLoading] = useState(false);

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewingCourse, setPreviewingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language: "",
    level: "",
    duration_weeks: 12,
    hours_per_week: 4,
    max_students: 20,
    teacher_id: "",
    schedule: "",
    start_date: "",
    end_date: "",
    assignedStudents: [] as Student[],
  });

  const debouncedSearchTerm = useDebounce(studentSearchTerm, 500);

  // --- Efectos de carga y filtrado ---
  useEffect(() => {
    loadCourses();
    loadTeachers();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterLanguage, filterLevel]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearchStudents(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  // --- Funciones de manejo de datos ---
  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);

      const studentsData = await Promise.all(
        coursesData.map(async (course) => {
          const students = await getStudentsForCourse(course.id);
          return { courseId: course.id, students };
        })
      );

      const newStudentsByCourse = studentsData.reduce((acc, curr) => {
        acc[curr.courseId] = curr.students.map(student => ({
          ...student,
          course_id: curr.courseId
        }));
        return acc;
      }, {} as { [key: string]: Student[] });
      setStudentsByCourse(newStudentsByCourse);

    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos.",
        variant: "destructive",
      });
    }
  };

  const loadTeachers = async () => {
    try {
      const teachersData = await getTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los profesores.",
        variant: "destructive",
      });
    }
  };

  const handleSearchStudents = async (query: string) => {
    setIsStudentSearchLoading(true);
    try {
      const results = await searchStudents(query);
      setSearchResults(results.map((value) => ({
        id: value.id,
        name: value.name,
        documentId: value.documentId,
        photoUrl: value.photoUrl,
        course_id: (value as any).course_id || null
      })));
    } catch (error) {
      console.error("Error searching students:", error);
      setSearchResults([]);
    } finally {
      setIsStudentSearchLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false),
      );
    }

    if (filterLanguage !== "all") {
      filtered = filtered.filter((course) => course.language === filterLanguage);
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter((course) => course.level === filterLevel);
    }

    setFilteredCourses(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      language: "",
      level: "",
      duration_weeks: 12,
      hours_per_week: 4,
      max_students: 20,
      teacher_id: "",
      schedule: "",
      start_date: "",
      end_date: "",
      assignedStudents: [],
    });
    setStudentSearchTerm("");
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.language || !formData.level || !formData.teacher_id) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Las fechas de inicio y fin son obligatorias.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newCourse = await createCourse({
        name: formData.name,
        description: formData.description,
        language: formData.language,
        level: formData.level,
        code: formData.name.substring(0, 10).toUpperCase().replace(/\s/g, ''),
        max_students: formData.max_students,
        // enrolled_count will be calculated automatically in the backend
        duration_weeks: formData.duration_weeks,
        hours_per_week: formData.hours_per_week,
        teacher_id: formData.teacher_id,
        schedule: formData.schedule,
        start_date: formData.start_date,
        end_date: formData.end_date,
        room: "TBD",
      });

      if (newCourse && formData.assignedStudents.length > 0) {
        await addStudentsToCourse(newCourse.id, formData.assignedStudents.map(s => s.id));
      }

      await loadCourses();
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Éxito",
        description: "Curso creado exitosamente.",
      });
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: `No se pudo crear el curso: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || "",
      language: course.language,
      level: course.level,
      duration_weeks: course.duration_weeks || 12,
      hours_per_week: course.hours_per_week || 4,
      max_students: course.max_students || 20,
      teacher_id: course.teacher_id || "",
      schedule: course.schedule || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
      assignedStudents: studentsByCourse[course.id] || [],
    });
    setIsEditDialogOpen(true);
    setStudentSearchTerm("");
    setSearchResults([]);
  };

  const handlePreview = (course: Course) => {
    setPreviewingCourse(course);
    setIsPreviewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCourse || !formData.name || !formData.language || !formData.level) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Separar los datos del curso de los estudiantes asignados
      const { assignedStudents, ...courseData } = formData;

      // Actualizar el curso
      await updateCourse(editingCourse.id, {
        ...courseData,
        enrolled_count: assignedStudents.length,
      });

      // Actualizar las inscripciones en la base de datos
      await addStudentsToCourse(editingCourse.id, assignedStudents.map(s => s.id));

      await loadCourses();
      setIsEditDialogOpen(false);
      setEditingCourse(null);
      resetForm();
      toast({
        title: "Éxito",
        description: "Curso actualizado exitosamente.",
      });
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el curso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    setIsLoading(true);
    try {
      await deleteCourse(courseId);
      await loadCourses();
      toast({
        title: "Éxito",
        description: "Curso eliminado exitosamente.",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el curso.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudentToForm = (student: Student) => {
    setFormData(prev => ({
      ...prev,
      assignedStudents: [...prev.assignedStudents, student]
    }));
    setStudentSearchTerm("");
  };

  const handleRemoveStudentFromForm = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedStudents: prev.assignedStudents.filter(s => s.id !== studentId)
    }));
  };

  // --- Funciones de utilidad para la UI ---
  const getLevelColor = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-green-200 text-green-900",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-yellow-200 text-yellow-900",
      C1: "bg-orange-100 text-orange-800",
      C2: "bg-red-100 text-red-800",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getLanguageFlag = (language: string) => {
    const flags = {
      Inglés: "🇺🇸",
      Francés: "🇫🇷",
      Alemán: "🇩🇪",
      Italiano: "🇮🇹",
      Portugués: "🇧🇷",
      Mandarín: "🇨🇳",
    };
    return flags[language as keyof typeof flags] || "🌐";
  };

  const isStudentAssigned = (student: Student) => {
    return formData.assignedStudents.some(s => s.id === student.id);
  };

  const getTeacherName = (teacherId: string | null) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'No asignado';
  };

  // --- Renderizado del componente ---
  return (
    <div className="space-y-6 p-6">
      {/* Header y botón de crear */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600">Administra los cursos del centro de idiomas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>Completa la información del nuevo curso</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Curso *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Inglés Básico A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                    <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                    <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                    <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                    <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel *</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Principiante</SelectItem>
                    <SelectItem value="A2">A2 - Elemental</SelectItem>
                    <SelectItem value="B1">B1 - Intermedio</SelectItem>
                    <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                    <SelectItem value="C1">C1 - Avanzado</SelectItem>
                    <SelectItem value="C2">C2 - Dominio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Profesor *</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">Máximo Estudiantes</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_weeks">Duración (semanas)</Label>
                <Input
                  id="duration_weeks"
                  type="number"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_per_week">Horas por semana</Label>
                <Input
                  id="hours_per_week"
                  type="number"
                  value={formData.hours_per_week}
                  onChange={(e) => setFormData({ ...formData, hours_per_week: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="schedule">Horario</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Ej: Lunes y miércoles 10:00 - 12:00"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el contenido y objetivos del curso"
                />
              </div>

              {/* Sección para agregar estudiantes */}
              <div className="col-span-2 space-y-2">
                <Label>Asignar Estudiantes</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar por nombre o documento..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                  />
                  {isStudentSearchLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {debouncedSearchTerm && searchResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {searchResults
                        .filter(student => !isStudentAssigned(student))
                        .map((student) => (
                          <li
                            key={student.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            onClick={() => handleAddStudentToForm(student)}
                          >
                            <img
                              src={student.photoUrl || "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"}
                              alt={`Foto de ${student.name}`}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-gray-500">Doc: {student.documentId}</div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                  {debouncedSearchTerm && searchResults.length === 0 && !isStudentSearchLoading && (
                    <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                      <li className="p-2 text-center text-gray-500">No se encontraron resultados</li>
                    </ul>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  <p className="font-medium text-sm">Estudiantes asignados ({formData.assignedStudents.length}):</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {formData.assignedStudents.map(student => (
                      <li key={student.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <img src={student.photoUrl} alt={`Foto de ${student.name}`} className="w-6 h-6 rounded-full" />
                          <span className="text-sm">{student.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveStudentFromForm(student.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Curso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los idiomas</SelectItem>
                <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="A1">A1 - Principiante</SelectItem>
                <SelectItem value="A2">A2 - Elemental</SelectItem>
                <SelectItem value="B1">B1 - Intermedio</SelectItem>
                <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                <SelectItem value="C1">C1 - Avanzado</SelectItem>
                <SelectItem value="C2">C2 - Dominio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageFlag(course.language)}</span>
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.language}</CardDescription>
                  </div>
                </div>
                <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {course.description && <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>}

                {/* --- CAMBIO AQUÍ: Profesor Asignado --- */}
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Profesor:</span> {getTeacherName(course.teacher_id)}
                </div>
                {/* --- FIN DEL CAMBIO --- */}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration_weeks}w
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {studentsByCourse[course.id]?.length || 0} / {course.max_students}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {course.hours_per_week}h/sem
                  </div>
                </div>

                {course.schedule && (
                  <div className="text-sm">
                    <span className="font-medium">Horario:</span> {course.schedule}
                  </div>
                )}

                {/* Sección de Estudiantes */}
                <div className="space-y-2 pt-4 border-t mt-4">
                  <h4 className="font-semibold text-gray-800">Estudiantes inscritos:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {studentsByCourse[course.id]?.length > 0 ? (
                      studentsByCourse[course.id]?.map((student) => (
                        <li key={student.id} className="flex items-center gap-2">
                          <img
                            src={student.photoUrl || "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"}
                            alt={`Foto de ${student.name}`}
                            className="w-6 h-6 rounded-full"
                          />
                          {student.name}
                        </li>
                      ))
                    ) : (
                      <li>No hay estudiantes inscritos aún.</li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex gap-2">
                    {/* Botón de previsualización */}
                    <Button variant="outline" size="sm" onClick={() => handlePreview(course)}>
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el curso "{course.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(course.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
            <p className="text-gray-500">
              {searchTerm || filterLanguage !== "all" || filterLevel !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primer curso"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>Modifica la información del curso</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Curso *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-language">Idioma *</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                  <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                  <SelectItem value="Alemán">🇩🇪 Alemán</SelectItem>
                  <SelectItem value="Italiano">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="Portugués">🇧🇷 Portugués</SelectItem>
                  <SelectItem value="Mandarín">🇨🇳 Mandarín</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-level">Nivel *</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1">A1 - Principiante</SelectItem>
                  <SelectItem value="A2">A2 - Elemental</SelectItem>
                  <SelectItem value="B1">B1 - Intermedio</SelectItem>
                  <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                  <SelectItem value="C1">C1 - Avanzado</SelectItem>
                  <SelectItem value="C2">C2 - Dominio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-teacher">Profesor *</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un profesor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex items-center gap-2">
                        <img
                          src={"https://api.dicebear.com/7.x/notionists/svg?seed=" + teacher.id}
                          alt={`Foto de ${teacher.name}`}
                          className="w-6 h-6 rounded-full"
                        />
                        {teacher.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max_students">Máximo Estudiantes</Label>
              <Input
                id="edit-max_students"
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration_weeks">Duración (semanas)</Label>
              <Input
                id="edit-duration_weeks"
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hours_per_week">Horas por semana</Label>
              <Input
                id="edit-hours_per_week"
                type="number"
                value={formData.hours_per_week}
                onChange={(e) => setFormData({ ...formData, hours_per_week: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-start_date">Cohorte - Fecha de Inicio *</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end_date">Cohorte - Fecha de Fin *</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-schedule">Horario (texto)</Label>
              <Input
                id="edit-schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Sección para agregar estudiantes en el editor */}
            <div className="col-span-2 space-y-2">
              <Label>Asignar Estudiantes</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre o documento..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                />
                {isStudentSearchLoading && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {debouncedSearchTerm && searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {searchResults
                      .filter(student => !isStudentAssigned(student))
                      .map((student) => (
                        <li
                          key={student.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                          onClick={() => handleAddStudentToForm(student)}
                        >
                          <img
                            src={student.photoUrl || "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"}
                            alt={`Foto de ${student.name}`}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-gray-500">Doc: {student.documentId}</div>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
                {debouncedSearchTerm && searchResults.length === 0 && !isStudentSearchLoading && (
                  <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                    <li className="p-2 text-center text-gray-500">No se encontraron resultados</li>
                  </ul>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <p className="font-medium text-sm">Estudiantes asignados ({formData.assignedStudents.length}):</p>
                <ul className="grid grid-cols-2 gap-2">
                  {formData.assignedStudents.map(student => (
                    <li key={student.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                      <div className="flex items-center gap-2">
                        <img src={student.photoUrl} alt={`Foto de ${student.name}`} className="w-6 h-6 rounded-full" />
                        <span className="text-sm">{student.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveStudentFromForm(student.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Actualizar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-xl">
          {previewingCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">{getLanguageFlag(previewingCourse.language)}</span>
                  {previewingCourse.name}
                </DialogTitle>
                <DialogDescription>Detalles del curso</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className={getLevelColor(previewingCourse.level)}>{previewingCourse.level}</Badge>
                </div>
                {previewingCourse.description && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Descripción</h4>
                    <p className="text-sm text-gray-600">{previewingCourse.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="space-y-1">
                    <p className="font-medium">Idioma:</p>
                    <p>{previewingCourse.language}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Nivel:</p>
                    <p>{previewingCourse.level}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Profesor:</p>
                    <p>{getTeacherName(previewingCourse.teacher_id)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Máx. Estudiantes:</p>
                    <p>{previewingCourse.max_students}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Duración:</p>
                    <p>{previewingCourse.duration_weeks} semanas</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Horas/semana:</p>
                    <p>{previewingCourse.hours_per_week}h</p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-semibold text-gray-800">Estudiantes inscritos: ({studentsByCourse[previewingCourse.id]?.length || 0})</h4>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Estudiante</th>
                          <th scope="col" className="px-6 py-3">Documento</th>
                          <th scope="col" className="px-6 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsByCourse[previewingCourse.id]?.length > 0 ? (
                          studentsByCourse[previewingCourse.id]?.map((student) => (
                            <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 flex items-center gap-2">
                                <img
                                  src={student.photoUrl || "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"}
                                  alt={`Foto de ${student.name}`}
                                  className="w-6 h-6 rounded-full"
                                />
                                {student.name}
                              </td>
                              <td className="px-6 py-4">{student.documentId}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Activo
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center">No hay estudiantes inscritos.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}