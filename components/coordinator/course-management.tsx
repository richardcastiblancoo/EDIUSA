"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Users,
  Clock,
  Calendar,
  X,
  Loader2,
  Eye as EyeIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Course,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourses,
} from "@/lib/courses";
import {
  getStudentsForCourse,
  searchStudents,
  addStudentsToCourse,
  removeStudentsFromCourse,
} from "@/lib/students";
import { getTeachers } from "@/lib/teachers";
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
export default function CourseManagement() {
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
  const [studentsByCourse, setStudentsByCourse] = useState<{
    [key: string]: Student[];
  }>({});
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
    max_students: 20,
    teacher_id: "",
    schedule: "",
    start_date: "",
    end_date: "",
    days: [],
    start_time: "",
    end_time: "",
    assignedStudents: [],
  });
  const debouncedSearchTerm = useDebounce(studentSearchTerm, 500);
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
        acc[curr.courseId] = curr.students.map((student) => ({
          ...student,
          course_id: curr.courseId,
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
      setSearchResults(
        results.map((value) => ({
          id: value.id,
          name: value.name,
          documentId: value.documentId ?? "",
          photoUrl: value.photoUrl,
          course_id: (value as any).course_id || null,
        }))
      );
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
          course.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.level?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterLanguage !== "all") {
      filtered = filtered.filter(
        (course) => course.language === filterLanguage
      );
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
      teacher_id: "",
      schedule: "",
      start_date: "",
      end_date: "",
      days: [],
      start_time: "",
      end_time: "",
      assignedStudents: [],
    });
    setStudentSearchTerm("");
    setSearchResults([]);
  };
  const handleCreate = async () => {
    if (
      !formData.name ||
      !formData.language ||
      !formData.level ||
      !formData.teacher_id
    ) {
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
        language: formData.language,
        level: formData.level,
        code: formData.name.substring(0, 10).toUpperCase().replace(/\s/g, ""),
        max_students: formData.max_students,
        teacher_id: formData.teacher_id,
        schedule: `${formData.days.join(", ")} | ${formData.start_time} - ${
          formData.end_time
        }`,
        start_date: formData.start_date,
        end_date: formData.end_date,
        room: "TBD",
        description: formData.description,
        duration_weeks: formData.duration_weeks,
      });
      if (newCourse && formData.assignedStudents.length > 0) {
        await addStudentsToCourse(
          newCourse.id,
          formData.assignedStudents.map((s) => s.id)
        );
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
        description: `No se pudo crear el curso: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    const [daysPart, timePart] = (course.schedule || "")
      .split("|")
      .map((s) => s.trim());
    const parsedDays = daysPart ? daysPart.split(", ").filter(Boolean) : [];
    const [startTime, endTime] = timePart
      ? timePart.split(" - ").map((s) => s.trim())
      : ["", ""];
    setFormData({
      name: course.name,
      description: course.description || "",
      language: course.language,
      level: course.level,
      duration_weeks: course.duration_weeks || 12,
      max_students: course.max_students || 20,
      teacher_id: course.teacher_id || "",
      schedule: course.schedule || "",
      start_date: course.start_date || "",
      end_date: course.end_date || "",
      days: parsedDays,
      start_time: startTime,
      end_time: endTime,
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
    if (
      !editingCourse ||
      !formData.name ||
      !formData.language ||
      !formData.level
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { assignedStudents } = formData;

      // Diferencias: estudiantes actuales vs. los asignados en el editor
      const currentStudentIds = (studentsByCourse[editingCourse.id] || []).map(
        (s) => s.id
      );
      const newAssignedIds = assignedStudents.map((s) => s.id);

      const toRemove = currentStudentIds.filter(
        (id) => !newAssignedIds.includes(id)
      );

      // Primero eliminar los que fueron removidos en el editor
      if (toRemove.length > 0) {
        await removeStudentsFromCourse(editingCourse.id, toRemove);
      }

      // Luego agregar los nuevos que no estaban previamente
      if (newAssignedIds.length > 0) {
        await addStudentsToCourse(editingCourse.id, newAssignedIds);
      }

      const updatePayload = {
        name: formData.name,
        language: formData.language,
        level: formData.level,
        code: formData.name.substring(0, 10).toUpperCase().replace(/\s/g, ""),
        max_students: formData.max_students,
        teacher_id: formData.teacher_id,
        schedule: `${formData.days.join(", ")} | ${formData.start_time} - ${
          formData.end_time
        }`,
        start_date: formData.start_date,
        end_date: formData.end_date,
        room: editingCourse?.room || "TBD",
        enrolled_count: assignedStudents.length,
      };

      await updateCourse(editingCourse.id, updatePayload);
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
    setFormData((prev) => ({
      ...prev,
      assignedStudents: [...prev.assignedStudents, student],
    }));
    setStudentSearchTerm("");
  };
  const handleRemoveStudentFromForm = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedStudents: prev.assignedStudents.filter((s) => s.id !== studentId),
    }));
  };
  const getLevelColor = (level: string) => {
    const colors = {
      "1": "bg-green-100 text-green-800",
      "2": "bg-green-200 text-green-900",
      "3": "bg-yellow-100 text-yellow-800",
      "4": "bg-yellow-200 text-yellow-900",
      "5": "bg-orange-100 text-orange-800",
      "6": "bg-red-100 text-red-800",
      "7": "bg-red-200 text-red-900",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };
  const getLanguageFlag = (language: string) => {
    const flags = {
      Inglés: "🇺🇸",
      Francés: "🇫🇷",
    };
    return flags[language as keyof typeof flags] || "🌐";
  };
  const isStudentAssigned = (student: Student) => {
    return formData.assignedStudents.some((s) => s.id === student.id);
  };
  const getTeacherName = (teacherId: string | null) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "No asignado";
  };
  return (
    <div className="space-y-6 p-6">
      {/* Header y botón de crear */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Cursos
          </h1>
          <p className="text-gray-600">
            Administra los cursos del centro de idiomas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Curso</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo curso
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Curso *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Inglés Básico A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData({ ...formData, language: value })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                    <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Selecciona nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label id="teacher-label">Profesor *</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacher_id: value })
                  }
                >
                  <SelectTrigger id="teacher" aria-labelledby="teacher-label">
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
                <Label>Días</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Lunes",
                    "Martes",
                    "Miércoles",
                    "Jueves",
                    "Viernes",
                    "Sábado",
                  ].map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        formData.days.includes(day) ? "default" : "outline"
                      }
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          days: prev.days.includes(day)
                            ? prev.days.filter((d) => d !== day)
                            : [...prev.days, day],
                        }))
                      }
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="schedule">Horario</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time" className="text-xs">
                      Hora inicio
                    </Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      placeholder="Hora inicio"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time" className="text-xs">
                      Hora fin
                    </Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      placeholder="Hora fin"
                    />
                  </div>
                </div>
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
                        .filter((student) => !isStudentAssigned(student))
                        .map((student) => (
                          <li
                            key={student.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            onClick={() => handleAddStudentToForm(student)}
                          >
                            <img
                              src={
                                student.photoUrl ||
                                "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"
                              }
                              alt={`Foto de ${student.name}`}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-gray-500">
                                Doc: {student.documentId}
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                  {debouncedSearchTerm &&
                    searchResults.length === 0 &&
                    !isStudentSearchLoading && (
                      <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                        <li className="p-2 text-center text-gray-500">
                          No se encontraron resultados
                        </li>
                      </ul>
                    )}
                </div>
                <div className="space-y-2 mt-4">
                  <p className="font-medium text-sm">
                    Estudiantes asignados ({formData.assignedStudents.length}):
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {formData.assignedStudents.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={student.photoUrl}
                            alt={`Foto de ${student.name}`}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{student.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            handleRemoveStudentFromForm(student.id)
                          }
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
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
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
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="7">7</SelectItem>
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
                  <span className="text-2xl">
                    {getLanguageFlag(course.language)}
                  </span>
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.language}</CardDescription>
                  </div>
                </div>
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {course.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Profesor:</span>{" "}
                  {getTeacherName(course.teacher_id)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">

                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {studentsByCourse[course.id]?.length || 0}
                  </div>
                </div>
                {course.schedule && (
                  <div className="text-sm">
                    <span className="font-medium">Horario:</span>{" "}
                    {course.schedule}
                  </div>
                )}
                {/* Sección de Estudiantes */}
                <div className="space-y-2 pt-4 border-t mt-4">
                  <h4 className="font-semibold text-gray-800">
                    Estudiantes inscritos:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {studentsByCourse[course.id]?.length > 0 ? (
                      studentsByCourse[course.id]?.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center gap-2"
                        >
                          <img
                            src={
                              student.photoUrl ||
                              "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"
                            }
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(course)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(course)}
                    >
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
                            Esta acción no se puede deshacer. Se eliminará
                            permanentemente el curso "{course.name}".
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron cursos
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterLanguage !== "all" || filterLevel !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primer curso"}
            </p>
          </CardContent>
        </Card>
      )}
      {/* Edit Dialog - REORGANIZADO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Modifica la información del curso
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre del Curso *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-language">Idioma *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger id="edit-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inglés">🇺🇸 Inglés</SelectItem>
                      <SelectItem value="Francés">🇫🇷 Francés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Nivel *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger id="edit-level">
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-teacher">Profesor *</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teacher_id: value })
                    }
                  >
                    <SelectTrigger id="edit-teacher">
                      <SelectValue placeholder="Selecciona un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex items-center gap-2">
                            {teacher.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fechas del Curso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Fechas del Curso</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start_date">Fecha de Inicio *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end_date">Fecha de Fin *</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Horario */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Horario</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Días de Clase</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Lunes",
                      "Martes",
                      "Miércoles",
                      "Jueves",
                      "Viernes",
                      "Sábado",
                    ].map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={
                          formData.days.includes(day) ? "default" : "outline"
                        }
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            days: prev.days.includes(day)
                              ? prev.days.filter((d) => d !== day)
                              : [...prev.days, day],
                          }))
                        }
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start_time">Hora de Inicio</Label>
                    <Input
                      id="edit-start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end_time">Hora de Fin</Label>
                    <Input
                      id="edit-end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Estudiantes Asignados */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Estudiantes Asignados</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Estudiantes</Label>
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
                          .filter((student) => !isStudentAssigned(student))
                          .map((student) => (
                            <li
                              key={student.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                              onClick={() => handleAddStudentToForm(student)}
                            >
                              <img
                                src={
                                  student.photoUrl ||
                                  "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"
                                }
                                alt={`Foto de ${student.name}`}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-xs text-gray-500">
                                  Doc: {student.documentId}
                                </div>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                    {debouncedSearchTerm &&
                      searchResults.length === 0 &&
                      !isStudentSearchLoading && (
                        <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
                          <li className="p-2 text-center text-gray-500">
                            No se encontraron resultados
                          </li>
                        </ul>
                      )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">
                    Estudiantes asignados ({formData.assignedStudents.length}):
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {formData.assignedStudents.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={student.photoUrl}
                            alt={`Foto de ${student.name}`}
                            className="w-6 h-6 rounded-full"
                          />
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
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
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
        <DialogContent className="max-w-xl overflow-y-auto max-h-[85vh]">
          {previewingCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">
                    {getLanguageFlag(previewingCourse.language)}
                  </span>
                  {previewingCourse.name}
                </DialogTitle>
                <DialogDescription>
                  Vista previa del curso: {previewingCourse.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className={getLevelColor(previewingCourse.level)}>
                    {previewingCourse.level}
                  </Badge>
                </div>
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
                    <p className="font-medium">Número de estudiantes:</p>
                    <p>{studentsByCourse[previewingCourse.id]?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Días:</p>
                    <p>
                      {(previewingCourse.schedule || "")
                        .split("|")[0]
                        ?.trim() || "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 border-t pt-4">
                  <h4 className="font-semibold text-gray-800">
                    Estudiantes inscritos: (
                    {studentsByCourse[previewingCourse.id]?.length || 0})
                  </h4>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3">
                            Estudiante
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Documento
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsByCourse[previewingCourse.id]?.length > 0 ? (
                          studentsByCourse[previewingCourse.id]?.map(
                            (student) => (
                              <tr
                                key={student.id}
                                className="bg-white border-b hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 flex items-center gap-2">
                                  <img
                                    src={
                                      student.photoUrl ||
                                      "https://api.dicebear.com/7.x/notionists/svg?seed=placeholder"
                                    }
                                    alt={`Foto de ${student.name}`}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  {student.name}
                                </td>
                                <td className="px-6 py-4">
                                  {student.documentId}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    Activo
                                  </span>
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center">
                              No hay estudiantes inscritos.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}