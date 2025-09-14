"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  getStudentsForTeacher,
  registerAttendance,
  registerGrade,
  deleteGrade,
  deleteAttendance,
  AttendanceStatus,
  getStudentGrades,
  getStudentAttendance,
  getLessonsForCourse,
  AttendanceRecord,
} from "@/lib/students";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

// Definición de interfaces para los datos que se manejan en este componente
interface Student {
  id: string;
  name: string;
  email: string;
  documentId: string;
  photoUrl: string;
  enrollmentId: string;
  courseId: string;
}

interface GradeRecord {
  id: string;
  lesson_id: string;
  score: number;
  created_at: string;
}

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<
    AttendanceRecord[]
  >([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Estados para los formularios dentro del modal
  const [attendanceStatus, setAttendanceStatus] = useState<
    AttendanceStatus | ""
  >("");
  const [gradeScore, setGradeScore] = useState("");
  const [lessons, setLessons] = useState<{ id: string; title: string }[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  // ESTADOS para los AlertDialog
  const [isConfirmingAttendanceDelete, setIsConfirmingAttendanceDelete] = useState(false);
  const [attendanceToDeleteId, setAttendanceToDeleteId] = useState<
    string | null
  >(null);

  const [isConfirmingGradeDelete, setIsConfirmingGradeDelete] = useState(false);
  const [gradeToDeleteId, setGradeToDeleteId] = useState<string | null>(null);

  // Este useEffect se encarga de cargar la lista de estudiantes
  useEffect(() => {
    const loadStudents = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const fetchedStudents = await getStudentsForTeacher(user.id);
        setStudents(fetchedStudents);
      } catch (error) {
        console.error("Error cargando estudiantes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [user?.id, toast]);

  // En la función handleSelectStudent
  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const grades = await getStudentGrades(student.enrollmentId);
      setStudentGrades(grades.filter((grade) => grade.id !== undefined) as GradeRecord[]);

      const attendance = await getStudentAttendance(student.enrollmentId);
      setStudentAttendance(attendance);

      const fetchedLessons = await getLessonsForCourse(student.courseId);
      setLessons(fetchedLessons);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del estudiante.",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setAttendanceStatus("");
    setGradeScore("");
    setStudentGrades([]);
    setStudentAttendance([]);
    setLessons([]);
    setSelectedLessonId("");
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.documentId.includes(searchTerm)
  );

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent?.enrollmentId || !attendanceStatus || !selectedLessonId) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una lección y un estado de asistencia.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerAttendance(
        selectedStudent.enrollmentId,
        selectedLessonId,
        attendanceStatus
      );

      if (result) {
        toast({
          title: "Éxito",
          description: "Asistencia registrada correctamente",
        });
        setAttendanceStatus("");
        setSelectedLessonId("");
        const updatedAttendance = await getStudentAttendance(selectedStudent.enrollmentId);
        setStudentAttendance(updatedAttendance);
      }
    } catch (error) {
      console.error("Error registrando asistencia:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia",
        variant: "destructive",
      });
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent?.enrollmentId || !gradeScore || !selectedLessonId) {
      toast({
        title: "Error",
        description: "Por favor, ingresa una calificación y selecciona una lección.",
        variant: "destructive",
      });
      return;
    }

    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Error de Validación",
        description: "La calificación debe ser un número entre 0 y 100.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerGrade(
        selectedStudent.enrollmentId,
        selectedLessonId,
        score
      );

      if (result) {
        toast({
          title: "Éxito",
          description: "Nota registrada correctamente",
        });
        setGradeScore("");
        setSelectedLessonId("");
        const updatedGrades = await getStudentGrades(selectedStudent.enrollmentId);
        setStudentGrades(updatedGrades.filter((grade) => grade.id !== undefined) as GradeRecord[]);
      }
    } catch (error) {
      console.error("Error registrando nota:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la nota",
        variant: "destructive",
      });
    }
  };

  // FUNCIONES PARA ELIMINAR CALIFICACIONES
  const handleOpenGradeDeleteConfirm = (gradeId: string) => {
    setGradeToDeleteId(gradeId);
    setIsConfirmingGradeDelete(true);
  };

  const confirmDeleteGrade = async () => {
    if (!gradeToDeleteId) return;

    try {
      const success = await deleteGrade(gradeToDeleteId);
      if (success) {
        toast({
          title: "Éxito",
          description: "Calificación eliminada correctamente",
        });
        if (selectedStudent?.enrollmentId) {
          const updatedGrades = await getStudentGrades(selectedStudent.enrollmentId);
          setStudentGrades(updatedGrades.filter((grade) => grade.id !== undefined) as GradeRecord[]);
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la calificación",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al eliminar la calificación:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al eliminar la calificación",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingGradeDelete(false);
      setGradeToDeleteId(null);
    }
  };


  // FUNCIONES PARA ELIMINAR ASISTENCIA
  const handleOpenAttendanceDeleteConfirm = (attendanceId: string) => {
    setAttendanceToDeleteId(attendanceId);
    setIsConfirmingAttendanceDelete(true);
  };

  const confirmDeleteAttendance = async () => {
    if (!attendanceToDeleteId) return;

    try {
      const success = await deleteAttendance(attendanceToDeleteId);
      if (success) {
        toast({
          title: "Éxito",
          description: "Registro de asistencia eliminado correctamente",
        });
        if (selectedStudent?.enrollmentId) {
          const updatedAttendance = await getStudentAttendance(selectedStudent.enrollmentId);
          setStudentAttendance(updatedAttendance);
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el registro de asistencia",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al eliminar la asistencia:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al eliminar la asistencia",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingAttendanceDelete(false);
      setAttendanceToDeleteId(null);
    }
  };

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estudiantes</h2>
          <p className="text-muted-foreground">
            Gestiona y revisa el progreso de tus estudiantes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Estudiantes de tus cursos</CardDescription>
            <div className="mt-2">
              <Input
                placeholder="Buscar por nombre, email o documento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Cargando estudiantes...
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "No se encontraron estudiantes con ese criterio"
                  : "No tienes estudiantes asignados"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photoUrl} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{student.name}</span>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.documentId}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectStudent(student)}
                        >
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Gestionar Estudiante: {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Realiza acciones como registrar asistencia, notas o ver su
              historial.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {modalLoading ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    Cargando datos del estudiante...
                  </p>
                </div>
              ) : (
                <>
                  {/* Card para el historial */}
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Historial de {selectedStudent.name}</CardTitle>
                      <CardDescription>
                        Consulta las calificaciones y asistencias del estudiante.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Historial de Calificaciones */}
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold">
                          Calificaciones
                        </h4>
                        {studentGrades.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay calificaciones registradas.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Lección</TableHead>
                                <TableHead>Calificación</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentGrades.map((grade) => (
                                <TableRow key={grade.id}>
                                  <TableCell>
                                    {lessons.find(
                                      (lesson) => lesson.id === grade.lesson_id
                                    )?.title || grade.lesson_id}
                                  </TableCell>
                                  <TableCell>{grade.score}</TableCell>
                                  <TableCell>
                                    {new Date(
                                      grade.created_at
                                    ).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleOpenGradeDeleteConfirm(grade.id)}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                      {/* Historial de Asistencia */}
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold">Asistencia</h4>
                        {studentAttendance.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay registros de asistencia.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Lección</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentAttendance.map((record: AttendanceRecord) => (
                                <TableRow key={record.id}>
                                  <TableCell>
                                    {lessons.find(
                                      (lesson) => lesson.id === record.lesson_id
                                    )?.title || record.lesson_id}
                                  </TableCell>
                                  <TableCell>{record.status}</TableCell>
                                  <TableCell>
                                    {new Date(
                                      record.created_at ?? new Date().toISOString()
                                    ).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleOpenAttendanceDeleteConfirm(record.id ?? "")}
                                      disabled={!record.id}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card para registrar asistencia */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Registrar Asistencia</CardTitle>
                      <CardDescription>
                        Registra la asistencia para una lección.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Lección</label>
                          <Select
                            value={selectedLessonId}
                            onValueChange={setSelectedLessonId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la lección" />
                            </SelectTrigger>
                            <SelectContent>
                              {lessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Estado</label>
                          <Select
                            value={attendanceStatus}
                            onValueChange={(value) =>
                              setAttendanceStatus(value as AttendanceStatus)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Presente">Presente</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                              <SelectItem value="Tarde">Tarde</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Registrar Asistencia
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Card para registrar nota */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Registrar Nota</CardTitle>
                      <CardDescription>
                        Asigna una calificación para una lección.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleGradeSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Calificación (0-100)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={gradeScore}
                            onChange={(e) => setGradeScore(e.target.value)}
                            placeholder="Ingresa la calificación"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Lección</label>
                          <Select
                            value={selectedLessonId}
                            onValueChange={setSelectedLessonId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la lección" />
                            </SelectTrigger>
                            <SelectContent>
                              {lessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Registrar Nota
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* COMPONENTE ALERT DIALOG DE CONFIRMACIÓN PARA ASISTENCIA */}
      <AlertDialog
        open={isConfirmingAttendanceDelete}
        onOpenChange={setIsConfirmingAttendanceDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el registro de asistencia de nuestra base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAttendance}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* COMPONENTE ALERT DIALOG DE CONFIRMACIÓN PARA CALIFICACIÓN */}
      <AlertDialog
        open={isConfirmingGradeDelete}
        onOpenChange={setIsConfirmingGradeDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el registro de calificación de nuestra base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGrade}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}