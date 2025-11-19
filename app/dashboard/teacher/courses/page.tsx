"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Simulación de librerías y tipos (asumiendo que existen)
import {
  createExam,
  Exam,
  createQuestion,
  notifyStudentsOfNewExam,
} from "@/lib/exams";
import { getCourseAssignmentsByTeacher } from "@/lib/assignments";
import { getStudentsForCourse, Student } from "@/lib/students";
import {
  createNewLesson,
  getLessonsForCourse,
  updateLesson,
  deleteLesson,
  Lesson,
} from "@/lib/lessons";
import { useAuth } from "@/lib/auth-context";

// Componentes de UI
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

// Iconos
import {
  BookOpen,
  Users,
  CheckCircle,
  Loader2,
  PlusCircle,
  Upload,
  Trash2,
  Mail,
  FileDigit,
  GraduationCap,
  X,
  FileText,
  Music,
  Eye,
  EyeOff,
  Edit,
  BarChart,
  Clock,
  Gauge,
  ListPlus,
  ArrowRight,
} from "lucide-react";


// --- INTERFACES y CONSTANTES ---

interface Course {
  id: string;
  name: string;
  language: string;
  level: string;
  description: string;
  duration_weeks: number;
  hours_per_week: number;
  schedule: string;
  max_students: number;
  students: Student[];
}

interface ExamPart {
  instruction: string;
  questions: number; // Se mantiene internamente para lógica, no para formulario
  audio_file: File | null;
  audio_filename: string | null;
}

interface ExamSection {
  section_id: string;
  title: string; // Título simplificado (Listening, Reading, etc.)
  max_score: number; // Se mantiene internamente para lógica, no para formulario
  parts: ExamPart[];
}

interface StudentAttendanceState extends Student {
  attended: boolean;
  hours: number;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  status: "submitted" | "pending" | "graded";
  score: number | null;
}

// **PLANTILLA FINAL** con títulos y estructura fija
const EXAM_SECTIONS_TEMPLATE: ExamSection[] = [
  {
    section_id: "S1",
    title: "Listening",
    max_score: 2.0, // Puntuación fija
    parts: [
      {
        instruction:
          "Escucha el audio y responde a las preguntas de opción múltiple (Parte 1).",
        questions: 5, // Preguntas fijas
        audio_file: null,
        audio_filename: null,
      },
      {
        instruction:
          "Escucha el audio y completa los espacios en blanco (Parte 2).",
        questions: 5, // Preguntas fijas
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S2",
    title: "Reading",
    max_score: 1.5, // Puntuación fija
    parts: [
      {
        instruction:
          "Lee el texto principal y elige la mejor opción para cada pregunta.",
        questions: 7, // Preguntas fijas
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S3",
    title: "Use of Language",
    max_score: 1.5, // Puntuación fija
    parts: [
      {
        instruction:
          "Completa las oraciones con la palabra o forma gramatical correcta.",
        questions: 10, // Preguntas fijas
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S4",
    title: "Writing",
    max_score: 0.0, // Calificación manual, puntuación fija
    parts: [
      {
        instruction:
          "Escribe un ensayo de 150-200 palabras sobre el tema dado.",
        questions: 0, // Pregunta de ensayo, fijo en 0 para ítems automáticos
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
];


const calculateTotals = (sections: ExamSection[]) => {
  let totalQuestions = 0;
  let maxScoreBase = 0;
  sections.forEach((section) => {
    section.parts.forEach((part) => {
      totalQuestions += part.questions;
    });
    // Se usa la puntuación fija de la plantilla para el total
    maxScoreBase += section.max_score; 
  });
  return { totalQuestions, maxScoreBase: parseFloat(maxScoreBase.toFixed(2)) };
};


// --- COMPONENTES ---

// Componentes de Lección (CreateLessonDialog, EditLessonDialog, ViewLessonsDialog)
const CreateLessonDialog = ({
    courseId,
    courseName,
  }: {
    courseId: string;
    courseName: string;
  }) => {
      const { toast } = useToast();
      const [isOpen, setIsOpen] = useState(false);
      const [creating, setCreating] = useState(false);
      const [newLesson, setNewLesson] = useState({
        title: "",
        description: "",
        pdfFile: null as File | null,
        audioFile: null as File | null,
      });
    
      const handleInputChange = (field: string, value: string) => {
        setNewLesson((prev) => ({
          ...prev,
          [field]: value,
        }));
      };
    
      const handleFileUpload = (
        field: "pdfFile" | "audioFile",
        file: File | null
      ) => {
        setNewLesson((prev) => ({
          ...prev,
          [field]: file,
        }));
      };
    
      const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
    
        try {
          if (!newLesson.title.trim()) {
            toast({
              title: "Error",
              description: "El título es obligatorio",
              variant: "destructive",
            });
            return;
          }
    
          const createdLesson = await createNewLesson(
            courseId,
            newLesson.title,
            newLesson.description,
            newLesson.pdfFile,
            newLesson.audioFile
          );
    
          if (createdLesson) {
            toast({
              title: "Éxito",
              description: "Lección creada correctamente",
            });
            setNewLesson({
              title: "",
              description: "",
              pdfFile: null,
              audioFile: null,
            });
            setIsOpen(false);
          } else {
            throw new Error("No se pudo crear la lección");
          }
        } catch (error) {
          console.error("Error creando lección:", error);
          toast({
            title: "Error",
            description: "No se pudo crear la lección",
            variant: "destructive",
          });
        } finally {
          setCreating(false);
        }
      };
    
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Lección
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Crear Nueva Lección
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                  Curso: {courseName}
              </DialogDescription>
            </DialogHeader>
    
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Lección</Label>
                <Input
                  id="title"
                  value={newLesson.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ej: Introducción al Presente Simple"
                  required
                />
              </div>
    
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newLesson.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe el contenido de esta lección..."
                  rows={3}
                />
              </div>
    
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Material PDF (Opcional)
                </Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    handleFileUpload(
                      "pdfFile",
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="file:text-blue-600 file:font-semibold"
                />
                {newLesson.pdfFile && (
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border">
                    <span className="text-sm text-gray-700 truncate">
                      {newLesson.pdfFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileUpload("pdfFile", null)}
                      className="h-6 w-6 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
    
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-500" />
                  Audio de la Lección (Opcional)
                </Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    handleFileUpload(
                      "audioFile",
                      e.target.files ? e.target.files[0] : null
                    )
                  }
                  className="file:text-purple-600 file:font-semibold"
                />
                {newLesson.audioFile && (
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border">
                    <span className="text-sm text-gray-700 truncate">
                      {newLesson.audioFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFileUpload("audioFile", null)}
                      className="h-6 w-6 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
    
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Crear Lección
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };

const EditLessonDialog = ({
  lesson,
  isOpen,
  onClose,
  onSave,
}: {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLesson: Lesson) => void;
}) => {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      if (lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || "");
      }
    }, [lesson]);
  
    const handleSave = async () => {
      if (!lesson || !title.trim()) return;
  
      setLoading(true);
      try {
        const updatedLesson = await updateLesson(lesson.id, {
          title: title.trim(),
          description: description.trim() || null,
        });
  
        if (updatedLesson) {
          toast({
            title: "Éxito",
            description: "Lección actualizada correctamente",
          });
          onSave(updatedLesson);
          onClose();
        } else {
          toast({
            title: "Error",
            description: "No se pudo actualizar la lección",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error actualizando lección:", error);
        toast({
          title: "Error",
          description: "Error al actualizar la lección",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Lección</DialogTitle>
            <DialogDescription>
              Modifica el título y descripción de la lección
            </DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la lección"
              />
            </div>
  
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la lección (opcional)"
                rows={4}
              />
            </div>
          </div>
  
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading} className="transition-colors">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

const ViewLessonsDialog = ({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const lessonsData = await getLessonsForCourse(courseId);
      setLessons(lessonsData);
    } catch (error) {
      console.error("Error cargando lecciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las lecciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    if (isOpen) {
      loadLessons();
    }
  }, [isOpen, loadLessons]);

  const handleTogglePublishStatus = async (
    lessonId: string,
    currentStatus: boolean
  ) => {
    // 1. Actualizar estado local inmediatamente para efecto visual
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, is_published: !currentStatus }
          : lesson
      )
    );

    // 2. Aquí iría la llamada a la API (simulada)

    toast({
      title: "Éxito (Simulado)",
      description: `Lección ${
        !currentStatus ? "publicada" : "ocultada"
      } correctamente.`,
    });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedLesson = (updatedLesson: Lesson) => {
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson
      )
    );
  };

  const executeDeleteLesson = async (lessonId: string, lessonTitle: string) => {
    try {
      const success = await deleteLesson(lessonId);

      if (success) {
        setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
        toast({
          title: "Éxito",
          description: `Lección "${lessonTitle}" eliminada correctamente.`,
        });
      } else {
        throw new Error("No se pudo eliminar la lección");
      }
    } catch (error) {
      console.error("Error eliminando lección:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la lección",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
            <BookOpen className="mr-2 h-4 w-4" /> Ver Lecciones
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Contenido del Curso
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {courseName} - {lessons.length} lección
              {lessons.length !== 1 ? "es" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay lecciones creadas para este curso.
              </p>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="p-4 transition-all duration-150 hover:shadow-lg hover:border-blue-300">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-lg">
                          {lesson.title}
                        </h4>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {lesson.pdf_url && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              PDF
                            </span>
                          )}
                          {lesson.audio_url && (
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3" />
                              Audio
                            </span>
                          )}
                          <span>Orden: {lesson.order_index}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            lesson.is_published ? "default" : "secondary"
                          }
                          className={`flex items-center gap-1 ${
                            lesson.is_published
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {lesson.is_published ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {lesson.is_published ? "Publicada" : "Oculta"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleTogglePublishStatus(
                                lesson.id,
                                lesson.is_published
                              )
                            }
                            className={`h-8 w-8 transition-colors ${
                              lesson.is_published
                                ? "text-gray-500 border-gray-200 hover:bg-gray-50"
                                : "text-blue-500 border-blue-200 hover:bg-blue-50"
                            }`}
                          >
                            {lesson.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditLesson(lesson)}
                            className="h-8 w-8 text-gray-500 border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Estás absolutamente seguro?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción **no se puede deshacer**. Esto
                                  eliminará permanentemente la lección{" "}
                                  <span className="font-bold text-red-600">
                                    "{lesson.title}"
                                  </span>{" "}
                                  y todos los datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    executeDeleteLesson(
                                      lesson.id,
                                      lesson.title
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                  Sí, Eliminar Lección
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EditLessonDialog
        lesson={editingLesson}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingLesson(null);
        }}
        onSave={handleSaveEditedLesson}
      />
    </>
  );
};


// Diálogo de Creación de Examen (Con la estructura simplificada)
const CreateExamWithStructureDialog = ({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) => {
    const { toast } = useToast();
    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState(60);
    const [instructions, setInstructions] = useState("");
    const maxAttempts = 1;

    // Se usa la plantilla como el estado base y se hacen los cambios *solo* en instrucciones y archivos.
    const [examStructureState, setExamStructureState] = useState<ExamSection[]>(
      EXAM_SECTIONS_TEMPLATE
    );
    // Totales calculados a partir de la estructura fija (solo para visualización en el resumen)
    const { totalQuestions, maxScoreBase } = calculateTotals(examStructureState); 
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
  
    // Funciones de manejo
    const handleAudioUpload = (
      sectionIndex: number,
      partIndex: number,
      file: File | null
    ) => {
      setExamStructureState((prevStructure) => {
        const newStructure = [...prevStructure];
        newStructure[sectionIndex].parts[partIndex].audio_file = file;
        newStructure[sectionIndex].parts[partIndex].audio_filename = file
          ? file.name
          : null;
        return newStructure;
      });
    };
  
    const handleInstructionChange = (
      sectionIndex: number,
      partIndex: number,
      instruction: string
    ) => {
      setExamStructureState((prevStructure) => {
        const newStructure = [...prevStructure];
        newStructure[sectionIndex].parts[partIndex].instruction = instruction;
        return newStructure;
      });
    };
    
    // Función para añadir una nueva parte 
    const addPartToSection = (sectionIndex: number) => {
      setExamStructureState((prevStructure) => {
        const newStructure = [...prevStructure];
        const sectionTitle = newStructure[sectionIndex].title;
        
        // Obtener el número de preguntas y el puntaje de la primera parte existente como referencia
        const basePart = newStructure[sectionIndex].parts[0]; 

        const newPart: ExamPart = {
          instruction: `Instrucción para ${sectionTitle} (Parte ${
            newStructure[sectionIndex].parts.length + 1
          })`,
          questions: basePart.questions, 
          audio_file: null,
          audio_filename: null,
        };
        newStructure[sectionIndex].parts.push(newPart);
        return newStructure;
      });
    };
  
    const removePartFromSection = (sectionIndex: number, partIndex: number) => {
      setExamStructureState((prevStructure) => {
        const newStructure = [...prevStructure];
        if (newStructure[sectionIndex].parts.length > 1) {
            newStructure[sectionIndex].parts.splice(partIndex, 1);
        } else {
            toast({
                title: "Advertencia",
                description: "Cada sección debe tener al menos una parte.",
                variant: "destructive",
            });
        }
        return newStructure;
      });
    };

    
    useEffect(() => {
      if (!isOpen) {
        // Resetear al cerrar
        setTitle("");
        setDuration(60);
        setInstructions("");
        // Restaurar la estructura inicial al cerrar
        setExamStructureState(EXAM_SECTIONS_TEMPLATE); 
      }
    }, [isOpen]);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      if (!title || duration <= 0) {
        toast({
          title: "Campos Incompletos",
          description: "El título y la duración son obligatorios.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
  
      const examData: Partial<Exam> = {
        course_id: courseId,
        title,
        description: instructions,
        duration_minutes: duration,
        total_questions: totalQuestions,
        exam_type: "structured",
        due_date: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ).toISOString(), 
        max_attempts: maxAttempts,
        is_active: true,
        structure: examStructureState, 
      };
  
      try {
        const newExam = await createExam(examData); 
  
        if (newExam) {
          // Creación de las preguntas base
          for (const section of examStructureState) {
            let totalQuestionsInSection = section.parts.reduce((sum, part) => sum + part.questions, 0);
            
            const pointsPerQuestion = totalQuestionsInSection > 0 
                ? section.max_score / totalQuestionsInSection
                : 0;

            let questionCounter = 0;

            for (const [partIndex, part] of section.parts.entries()) {
              for (let i = 0; i < part.questions; i++) {
                questionCounter++;
                const questionData = {
                  exam_id: newExam.id,
                  section_id: section.section_id,
                  part_index: partIndex,
                  question_text: `[${section.title} - Parte ${
                    partIndex + 1
                  }] Pregunta ${questionCounter}`,
                  question_type: section.title === "Writing" ? "essay" : "multiple_choice",
                  options: ["Opción A", "Opción B", "Opción C"],
                  correct_answer: "Opción A",
                  points: pointsPerQuestion, 
                  order_number: questionCounter,
                  audio_url: part.audio_filename ? `/audio/${part.audio_filename}` : null, 
                };
                await createQuestion(questionData as any);
              }
            }
            // Para la sección de Writing (pregunta única de ensayo)
            if (section.title === "Writing" && section.parts.length > 0) {
                 const part = section.parts[0]; 
                 const questionData = {
                    exam_id: newExam.id,
                    section_id: section.section_id,
                    part_index: 0,
                    question_text: part.instruction, 
                    question_type: "essay" as const, 
                    options: [],
                    correct_answer: null,
                    points: section.max_score, 
                    order_number: 1,
                    audio_url: null,
                };
                await createQuestion({
                  ...questionData,
                  correct_answer: questionData.correct_answer ?? "",
                });
            }
          }
  
          toast({
            title: "Éxito",
            description: `El examen "${newExam.title}" ha sido creado y notificado a los estudiantes.`,
          });
  
          // Notificación simulada
          await notifyStudentsOfNewExam(newExam.id, newExam.course_id);
        } else {
          toast({
            title: "Error",
            description: "Hubo un error al crear el examen. Inténtalo de nuevo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error creating exam:", error);
        toast({
          title: "Error",
          description: `Hubo un error inesperado al crear el examen.`,
          variant: "destructive",
        });
      }
  
      setLoading(false);
      setIsOpen(false);
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Examen
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto p-8 shadow-2xl"
          aria-describedby="create-exam-description"
        >
          <DialogHeader>
            <DialogTitle className="text-3xl font-extrabold text-gray-800">
              Diseño Estructural de Examen
            </DialogTitle>
            <p
              id="create-exam-description"
              className="text-base text-muted-foreground"
            >
              Curso: {courseName}. Defina las instrucciones y cargue archivos para las partes.
            </p>
          </DialogHeader>
  
          <div className="grid lg:grid-cols-12 gap-8 py-4">
            <Card className="lg:col-span-3 p-6 shadow-xl border-t-4 border-gray-200 h-fit sticky top-0">
              <h4 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">
                Parámetros Generales
              </h4>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold">
                    Título del Examen
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Evaluación Final B2 - Junio 2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-semibold">
                    Duración (minutos)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions" className="font-semibold">
                    Instrucciones Generales
                  </Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4}
                    placeholder="Instrucciones generales o notas para el estudiante."
                  />
                </div>
  
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h5 className="text-lg font-bold text-gray-700">
                    Resumen Estructural (Fijo)
                  </h5>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <Label className="flex items-center text-sm font-semibold text-gray-800">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      Duración Estimada
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-gray-700 text-md py-1"
                    >
                      {duration} minutos
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <Label className="flex items-center text-sm font-semibold text-gray-800">
                      <Gauge className="w-4 h-4 mr-2 text-red-500" />
                      Calificación Máxima
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-gray-700 text-md py-1 font-bold"
                    >
                      {maxScoreBase.toFixed(1)} puntos
                    </Badge>
                  </div>
                  <p className="text-sm font-medium pt-3 border-t">
                    Total de preguntas (objetivas): {totalQuestions}
                  </p>
                </div>
  
                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    Crear Examen Base
                  </Button>
                </DialogFooter>
              </form>
            </Card>
  
            <div className="lg:col-span-9 space-y-6">
              <h4 className="text-xl font-bold border-b pb-2 text-gray-800">
                Configuración por Secciones
              </h4>
  
              <div className="grid grid-cols-2 gap-6">
                {examStructureState.map((sectionData, sectionIndex) => (
                  <Card
                    key={sectionData.section_id}
                    className={`flex flex-col shadow-lg border-l-4 ${
                      sectionData.title === "Writing"
                        ? "border-amber-500" 
                        : "border-blue-500"
                    } p-0 transition-all duration-300 hover:shadow-xl hover:scale-[1.005]`}
                  >
                    <CardHeader
                      className={`pb-2 ${
                        sectionData.title === "Writing"
                          ? "bg-amber-50"
                          : "bg-blue-50"
                      } rounded-t-lg`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge
                            className={`font-semibold text-sm ${
                              sectionData.title === "Writing"
                                ? "bg-amber-600 hover:bg-amber-700 transition-colors"
                                : "bg-blue-600 hover:bg-blue-700 transition-colors"
                            }`}
                          >
                            {sectionData.section_id}
                          </Badge>
                          <h3 className="text-2xl font-extrabold mt-1 text-gray-800">
                            {sectionData.title}
                          </h3>
                        </div>
                      </div>
                    </CardHeader>
  
                    <CardContent className="space-y-4 p-4 flex-grow">
                      {sectionData.parts.map((part, partIndex) => (
                        <div
                          key={partIndex}
                          className="bg-white p-4 rounded-lg border shadow-sm space-y-3 transition-shadow duration-200 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-700 flex items-center">
                                <ListPlus className="w-4 h-4 mr-2 text-gray-500" />
                                Parte {partIndex + 1}
                            </p>
  
                            {/* Solo permitir eliminar si hay más de una parte */}
                            {sectionData.parts.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removePartFromSection(sectionIndex, partIndex)
                                }
                                className="h-6 w-6 text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
  
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-gray-600">
                              Instrucción Específica
                            </Label>
                            <Textarea
                              value={part.instruction}
                              onChange={(e) =>
                                handleInstructionChange(
                                  sectionIndex,
                                  partIndex,
                                  e.target.value
                                )
                              }
                              rows={2}
                              placeholder="Describe la tarea que debe realizar el estudiante."
                              className="text-sm"
                            />
                          </div>
  
                          {/* VISUALIZACIÓN DE ÍTEMS Y PUNTUACIÓN (Solo informativo) */}
                          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t mt-3">
                              {sectionData.title !== "Writing" && (
                                  <span className="font-semibold text-gray-600">
                                      Ítems: {part.questions}
                                  </span>
                              )}
                              <span className="font-semibold text-gray-600">
                                  Puntuación de la Sección: {sectionData.max_score.toFixed(1)}
                              </span>
                          </div>
  
                          {sectionData.title === "Listening" && (
                            <div className="space-y-1 pt-2 border-t border-dashed">
                              <Label className="text-xs flex items-center font-semibold text-blue-600">
                                <Upload className="w-3 h-3 mr-1" /> Archivo de
                                Audio
                              </Label>
  
                              {part.audio_filename ? (
                                <div className="flex items-center justify-between bg-green-50 p-2 rounded-md border border-green-300 transition-colors">
                                  <span className="text-sm text-green-800 truncate">
                                    {part.audio_filename}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleAudioUpload(
                                        sectionIndex,
                                        partIndex,
                                        null
                                      )
                                    }
                                    className="h-6 w-6 text-red-500 hover:bg-red-100 transition-colors"
                                    title="Eliminar audio"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) =>
                                    handleAudioUpload(
                                      sectionIndex,
                                      partIndex,
                                      e.target.files ? e.target.files[0] : null
                                    )
                                  }
                                  className="h-9 text-sm file:text-blue-600 file:font-semibold"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
  
                      <Button
                        variant="outline"
                        onClick={() => addPartToSection(sectionIndex)}
                        className="w-full mt-4 border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors"
                        disabled={
                          sectionData.title === "Writing" // No se permite añadir partes a Writing
                        }
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Parte a {sectionData.title}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

// Componente de Calificación de Examen
const ExamGradingDialog = ({
  courseId,
  courseName,
  students,
}: {
  courseId: string;
  courseName: string;
  students: Student[];
}) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedExamTitle] = useState("Examen Final Estándar"); 
    
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  
    useEffect(() => {
      if (isOpen) {
        // Simulación de carga de entregas
        const initialSubmissions = students.map(s => ({
          studentId: s.id,
          studentName: s.name,
          studentPhoto: s.photoUrl,
          status: "submitted" as "submitted",
          score: null as number | null
        }));
        setSubmissions(initialSubmissions);
      }
    }, [isOpen, students]);
  
  
    const handleScoreChange = (studentId: string, val: string) => {
      const score = parseFloat(val);
      const maxScore = 5.0; // Basado en el total del examen
      
      if (isNaN(score)) {
        setSubmissions(prev => prev.map(sub => 
          sub.studentId === studentId ? { ...sub, score: null, status: "submitted" } : sub
        ));
        return;
      }
      
      if (score < 0 || score > maxScore) {
        toast({
          title: "Error de Nota",
          description: `La calificación debe estar entre 0.0 y ${maxScore.toFixed(1)}`,
          variant: "destructive",
        });
        return;
      } 
  
      setSubmissions(prev => prev.map(sub => 
        sub.studentId === studentId ? { ...sub, score: score, status: "graded" } : sub
      ));
    };
  
    const saveGrades = () => {
      toast({
        title: "Calificaciones Guardadas",
        description: "Se han actualizado las notas correctamente (simulado).",
      });
      setIsOpen(false);
    };
  
    const isPassing = (score: number) => score > 2.95;
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
          >
            <BarChart className="mr-2 h-4 w-4" /> Calificar Exámenes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingreso de Calificaciones</DialogTitle>
            <DialogDescription>
              {selectedExamTitle} del Curso: {courseName}
            </DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 font-medium text-sm border-b">
                <div className="col-span-6">Estudiante</div>
                <div className="col-span-2 text-center">Estado</div>
                <div className="col-span-2 text-center">Nota (0-5)</div>
                <div className="col-span-2 text-center">Resultado</div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {submissions.map((sub) => (
                  <div key={sub.studentId} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="col-span-6 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.studentPhoto} />
                        <AvatarFallback>{sub.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{sub.studentName}</span>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      {sub.score !== null ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 transition-colors">Calificado</Badge>
                      ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 transition-colors">Entregado</Badge>
                      )}
                    </div>
  
                    <div className="col-span-2 flex justify-center">
                      <Input 
                        type="number" 
                        min="0" 
                        max="5" 
                        step="0.1"
                        value={sub.score ?? ""}
                        onChange={(e) => handleScoreChange(sub.studentId, e.target.value)}
                        className="w-16 text-center h-8 transition-shadow hover:shadow-md"
                        placeholder="-"
                      />
                    </div>
  
                    <div className="col-span-2 text-center">
                        {sub.score !== null && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${isPassing(sub.score) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {isPassing(sub.score) ? "APROBADO" : "REPROBADO"}
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            <DialogFooter>
              <Button onClick={saveGrades} className="bg-blue-600 hover:bg-blue-700 transition-colors">
                <CheckCircle className="mr-2 h-4 w-4" /> Guardar Calificaciones
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

// Componentes de Estudiantes (StudentProfileDialog, StudentListDialog)
const StudentProfileDialog = ({
  student,
  isOpen,
  setIsOpen,
}: {
  student: Student;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
    const academicLevel = (student as any).academicLevel || "N/A";

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] p-6">
          <DialogHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-gray-200 shadow-lg">
              <AvatarImage src={student.photoUrl} alt={student.name} />
              <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-800">
                {student.name ? student.name[0] : "?"}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-2xl font-extrabold text-gray-800">
              {student.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
                Información detallada de contacto y nivel académico.
            </DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-lg font-bold text-gray-700">
              Información del Estudiante
            </h4>
  
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Nivel Académico
                </p>
                <p className="text-sm font-medium">{academicLevel}</p>
              </div>
            </div>
  
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-gray-500">Email</p>
                <p className="text-sm font-medium">{student.email}</p>
              </div>
            </div>
  
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <FileDigit className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Documento/ID
                </p>
                <p className="text-sm font-medium">
                  {student.documentId || "No especificado"}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

const StudentListDialog = ({
  courseId,
  courseName,
}: {
  courseId: string;
  courseName: string;
}) => {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
  
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
  
    const loadStudents = useCallback(async (id: string) => {
      setLoading(true);
      try {
        const courseStudents = await getStudentsForCourse(id);
        setStudents(courseStudents);
      } catch (error) {
        console.error("Error cargando estudiantes:", error);
        toast({
          title: "Error de Carga",
          description:
            "No se pudo obtener la lista de estudiantes para este curso.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, [toast]);
  
    const handleViewProfile = (student: Student) => {
      setSelectedStudent(student);
      setIsProfileOpen(true);
    };
  
    useEffect(() => {
      if (isListOpen && courseId) {
        loadStudents(courseId);
      } else {
        setStudents([]);
      }
    }, [isListOpen, courseId, loadStudents]);
  
    return (
      <>
        <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
              <Users className="mr-2 h-4 w-4" /> Listado de Estudiantes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] transition-all duration-300 ease-in-out">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Estudiantes Inscritos
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Curso: {courseName}. Total: {students.length} estudiantes
              </DialogDescription>
            </DialogHeader>
  
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Cargando estudiantes...
                  </span>
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay estudiantes inscritos en este curso.
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={student.photoUrl}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {student.name ? student.name[0] : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">
                            {student.name}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProfile(student)}
                        className="transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
  
        {selectedStudent && (
          <StudentProfileDialog
            student={selectedStudent}
            isOpen={isProfileOpen}
            setIsOpen={setIsProfileOpen}
          />
        )}
      </>
    );
  };

// Componente de Asistencia
const AttendanceDialog = ({
  courseName,
  students,
  courseId,
}: {
  courseName: string;
  students: Student[];
  courseId: string;
}) => {
    const { toast } = useToast();
    const today = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  
    const [attendanceState, setAttendanceState] = useState<
      StudentAttendanceState[]
    >(
      students.map((student) => ({
        ...student,
        attended: true,
        hours: 1,
      }))
    );
  
    const [showReport, setShowReport] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
  
    useEffect(() => {
        if(isOpen) {
            setAttendanceState(
                students.map((student) => ({
                    ...student,
                    attended: true,
                    hours: 1,
                }))
            );
            setShowReport(false);
        }
    }, [students, isOpen]);
  
    const handleHoursChange = (studentId: string, hours: number) => {
      setAttendanceState((prevState) =>
        prevState.map((student) => {
          if (student.id === studentId) {
            return {
              ...student,
              hours: hours > 0 ? hours : 0,
              attended: hours > 0,
            };
          }
          return student;
        })
      );
    };
  
    const handleAttendanceToggle = (studentId: string, attended: boolean) => {
      setAttendanceState((prevState) =>
        prevState.map((student) => {
          if (student.id === studentId) {
            const newHours = attended
              ? student.hours > 0
                ? student.hours
                : 1
              : 0;
            return { ...student, attended, hours: newHours };
          }
          return student;
        })
      );
    };
  
    const handleSaveAttendance = () => {
      toast({
        title: "Asistencia Guardada (Simulada)",
        description: `Se registró la asistencia para ${
          attendanceState.filter((s) => s.attended).length
        } estudiantes el ${today}.`,
      });
      setIsOpen(false);
    };
  
    const handleViewAttendanceReport = () => {
      setShowReport(true);
    };
  
    const handleSendToCoordinator = () => {
      toast({
        title: "Reporte Enviado (Simulado)",
        description: `El reporte de asistencia ha sido enviado al coordinador para el curso ${courseName}.`,
      });
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
            <CheckCircle className="mr-2 h-4 w-4" /> Tomar Asistencia
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] transition-all duration-300 ease-in-out p-6">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Registro de Asistencia: {courseName}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    Fecha:{" "}
                    <span className="font-semibold text-blue-600">{today}</span>
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAttendanceReport}
                className="flex items-center gap-2 transition-colors hover:bg-gray-100"
              >
                <Eye className="h-4 w-4" />
                Ver Resumen
              </Button>
            </div>
          </DialogHeader>
  
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay estudiantes para registrar asistencia.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-3 font-bold text-sm text-gray-600 border-b pb-2">
                  <span className="col-span-2">Estudiante</span>
                  <span className="text-center">Estado</span>
                  <span className="text-center">Horas Asistidas</span>
                  <span>Acción</span>
                </div>
  
                {attendanceState.map((student) => (
                  <div
                    key={student.id}
                    className={`grid grid-cols-5 gap-3 items-center p-2 rounded-md transition-colors duration-150 ${
                      student.attended
                        ? "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        : "bg-red-50 border border-red-200 hover:bg-red-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 col-span-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.photoUrl} alt={student.name} />
                        <AvatarFallback>
                          {student.name ? student.name[0] : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{student.name}</span>
                    </div>
  
                    <div className="text-center">
                      <Badge
                        className={`font-semibold transition-colors ${
                          student.attended
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {student.attended ? "ASISTIÓ" : "AUSENTE"}
                      </Badge>
                    </div>
  
                    <div className="text-center">
                      <Input
                        type="number"
                        value={student.hours}
                        onChange={(e) =>
                          handleHoursChange(
                            student.id,
                            parseFloat(e.target.value)
                          )
                        }
                        min={0}
                        step={0.5}
                        className={`w-20 mx-auto text-center h-8 text-sm transition-all ${
                          !student.attended
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white border-blue-400 font-medium"
                        }`}
                        readOnly={!student.attended}
                      />
                    </div>
  
                    <div className="space-y-1">
                      <Button
                        variant={student.attended ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleAttendanceToggle(student.id, true)}
                        disabled={student.attended && student.hours > 0} 
                        className="w-full h-8 bg-green-500 hover:bg-green-600 transition-colors"
                      >
                        Presente
                      </Button>
                      <Button
                        variant={!student.attended ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAttendanceToggle(student.id, false)}
                        disabled={!student.attended && student.hours === 0}
                        className="w-full h-8 border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Ausente
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          {showReport && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 transition-opacity duration-300">
              <h4 className="text-lg font-bold text-blue-800 mb-3">
                Resumen de Asistencia
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border transition-shadow duration-150 hover:shadow-sm">
                  <p className="font-semibold text-gray-600">
                    Total Estudiantes:
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {students.length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border transition-shadow duration-150 hover:shadow-sm">
                  <p className="font-semibold text-gray-600">Presentes:</p>
                  <p className="text-xl font-bold text-green-600">
                    {attendanceState.filter((s) => s.attended).length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border transition-shadow duration-150 hover:shadow-sm">
                  <p className="font-semibold text-gray-600">Ausentes:</p>
                  <p className="text-xl font-bold text-red-600">
                    {attendanceState.filter((s) => !s.attended).length}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border transition-shadow duration-150 hover:shadow-sm">
                  <p className="font-semibold text-gray-600">% Asistencia:</p>
                  <p className="text-xl font-bold text-purple-600">
                    {students.length > 0
                      ? Math.round(
                          (attendanceState.filter((s) => s.attended).length /
                            students.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
  
              <div className="mt-4 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSendToCoordinator}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Enviar a Coordinador
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReport(false)}
                  className="transition-colors hover:bg-gray-100"
                >
                  Cerrar Resumen
                </Button>
              </div>
            </div>
          )}
  
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 transition-colors" onClick={handleSaveAttendance}>
            <ArrowRight className="mr-2 h-4 w-4" /> Guardar Registro
          </Button>
        </DialogContent>
      </Dialog>
    );
  };


// --- Main Teacher Page ---
export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const courseAssignments = await getCourseAssignmentsByTeacher(user.id);

        const coursesWithStudents = await Promise.all(
          courseAssignments.map(async (course: any) => {
            const students = await getStudentsForCourse(course.id);
            return {
              ...course,
              students,
            };
          })
        );
        setCourses(coursesWithStudents);
      } catch (error) {
        console.error("Error cargando cursos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cursos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [user?.id, toast]);

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
          <p className="text-muted-foreground">
            Listado de cursos que estás enseñando. Utiliza los botones para
            gestionar cada curso.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cargando cursos...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No tienes cursos asignados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="flex flex-col transition-shadow duration-300 hover:shadow-xl hover:border-blue-400"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{course.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="transition-colors hover:bg-gray-200">{course.language}</Badge>
                    <Badge variant="outline" className="transition-colors hover:bg-gray-50">{course.level}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <div className="border-b pb-4">
                    {course.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Descripción
                        </h4>
                        <p className="text-sm text-muted-foreground italic line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    )}
                    {course.schedule && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Horario</h4>
                        <p className="text-sm text-muted-foreground font-semibold">
                          {course.schedule}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-4">
                    {/* GRUPO 1: Contenido y Creación (Horizontal y juntos) */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                      <CreateLessonDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                      <CreateExamWithStructureDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                    </div>

                    {/* GRUPO 2: Consulta y Calificación (Horizontal y juntos) */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                      <ViewLessonsDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                      <ExamGradingDialog 
                        courseId={course.id} 
                        courseName={course.name}
                        students={course.students}
                      />
                    </div>

                    {/* GRUPO 3: Gestión Administrativa (Horizontal y juntos) */}
                    <div className="grid grid-cols-2 gap-3">
                      <AttendanceDialog
                        courseName={course.name}
                        students={course.students}
                        courseId={course.id}
                      />
                      <StudentListDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}