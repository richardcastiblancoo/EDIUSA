"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Simulación de librerías y tipos
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  Settings,
  FileQuestion,
  Type,
  ListChecks,
  PenTool,
  Calendar,
  UserCheck,
  Shield,
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

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ExamPart {
  instruction: string;
  questions: number;
  audio_file: File | null;
  audio_filename: string | null;
  questionType: "multiple_choice" | "fill_blank" | "essay" | "true_false";
  options?: QuestionOption[];
}

interface ExamSection {
  section_id: string;
  title: string;
  max_score: number;
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

// **PLANTILLA MEJORADA** con todas las secciones
const EXAM_SECTIONS_TEMPLATE: ExamSection[] = [
  {
    section_id: "S1",
    title: "Listening",
    max_score: 5,
    parts: [
      {
        instruction: "Escucha el audio y selecciona la respuesta correcta.",
        questions: 5,
        audio_file: null,
        audio_filename: null,
        questionType: "multiple_choice",
        options: [
          { id: "1", text: "Opción A", isCorrect: true },
          { id: "2", text: "Opción B", isCorrect: false },
          { id: "3", text: "Opción C", isCorrect: false },
          { id: "4", text: "Opción D", isCorrect: false },
        ],
      },
    ],
  },
  {
    section_id: "S2",
    title: "Reading",
    max_score: 5,
    parts: [
      {
        instruction: "Lee el texto y responde las preguntas de opción múltiple.",
        questions: 5,
        audio_file: null,
        audio_filename: null,
        questionType: "multiple_choice",
        options: [
          { id: "1", text: "Opción A", isCorrect: true },
          { id: "2", text: "Opción B", isCorrect: false },
          { id: "3", text: "Opción C", isCorrect: false },
        ],
      },
    ],
  },
  {
    section_id: "S3",
    title: "Use of Language",
    max_score: 5,
    parts: [
      {
        instruction: "Completa los espacios en blanco con la palabra correcta.",
        questions: 10,
        audio_file: null,
        audio_filename: null,
        questionType: "fill_blank",
        options: [],
      },
      {
        instruction: "Selecciona la opción que mejor complete la oración.",
        questions: 10,
        audio_file: null,
        audio_filename: null,
        questionType: "multiple_choice",
        options: [
          { id: "1", text: "Opción A", isCorrect: true },
          { id: "2", text: "Opción B", isCorrect: false },
          { id: "3", text: "Opción C", isCorrect: false },
          { id: "4", text: "Opción D", isCorrect: false },
        ],
      },
    ],
  },
  {
    section_id: "S4",
    title: "Writing",
    max_score: 5,
    parts: [
      {
        instruction: "Escribe un ensayo de 250-300 palabras sobre el siguiente tema:",
        questions: 1,
        audio_file: null,
        audio_filename: null,
        questionType: "essay",
        options: [],
      },
      {
        instruction: "Redacta un email formal respondiendo a la siguiente situación:",
        questions: 1,
        audio_file: null,
        audio_filename: null,
        questionType: "essay",
        options: [],
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
    maxScoreBase += section.max_score;
  });
  return { totalQuestions, maxScoreBase };
};

// --- COMPONENTES MEJORADOS ---

// Componente para gestionar opciones de preguntas
const QuestionOptionsManager = ({
  options,
  onChange,
  questionType,
}: {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
  questionType: string;
}) => {
  const addOption = () => {
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: "",
      isCorrect: false,
    };
    onChange([...options, newOption]);
  };

  const updateOption = (id: string, field: string, value: any) => {
    const updatedOptions = options.map((opt) =>
      opt.id === id ? { ...opt, [field]: value } : opt
    );
    onChange(updatedOptions);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      onChange(options.filter((opt) => opt.id !== id));
    }
  };

  const handleCorrectAnswerChange = (id: string) => {
    if (questionType === "multiple_choice") {
      const updatedOptions = options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      }));
      onChange(updatedOptions);
    } else {
      const updatedOptions = options.map((opt) =>
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
      );
      onChange(updatedOptions);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-gray-700">
          Opciones de Respuesta
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="h-8 border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
        >
          <PlusCircle className="h-3 w-3 mr-1" />
          Agregar Opción
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300"
          >
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={() => handleCorrectAnswerChange(option.id)}
              className="data-[state=checked]:bg-gray-900 border-gray-400"
            />
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, "text", e.target.value)}
              placeholder={`Opción ${index + 1}`}
              className="flex-1 border-gray-300 focus:border-gray-500"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeOption(option.id)}
              className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white"
              disabled={options.length <= 2}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600">
        {questionType === "multiple_choice"
          ? "Selecciona una única respuesta correcta"
          : "Puede haber múltiples respuestas correctas"}
      </p>
    </div>
  );
};

// Diálogo de Creación de Examen MEJORADO
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
  const [examDate, setExamDate] = useState("");
  const maxAttempts = 1;
  const [activeTab, setActiveTab] = useState("structure");

  const [examStructureState, setExamStructureState] = useState<ExamSection[]>(
    EXAM_SECTIONS_TEMPLATE
  );
  const { totalQuestions, maxScoreBase } = calculateTotals(examStructureState);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleQuestionTypeChange = (
    sectionIndex: number,
    partIndex: number,
    questionType: ExamPart["questionType"]
  ) => {
    setExamStructureState((prevStructure) => {
      const newStructure = [...prevStructure];
      const part = newStructure[sectionIndex].parts[partIndex];

      let newOptions: QuestionOption[] = [];
      if (questionType === "multiple_choice") {
        newOptions = [
          { id: "1", text: "Opción A", isCorrect: true },
          { id: "2", text: "Opción B", isCorrect: false },
          { id: "3", text: "Opción C", isCorrect: false },
          { id: "4", text: "Opción D", isCorrect: false },
        ];
      } else if (questionType === "true_false") {
        newOptions = [
          { id: "1", text: "Verdadero", isCorrect: true },
          { id: "2", text: "Falso", isCorrect: false },
        ];
      } else if (questionType === "essay") {
        newOptions = [];
      } else if (questionType === "fill_blank") {
        newOptions = [];
      }

      newStructure[sectionIndex].parts[partIndex] = {
        ...part,
        questionType,
        options: newOptions,
      };
      return newStructure;
    });
  };

  const handleOptionsChange = (
    sectionIndex: number,
    partIndex: number,
    options: QuestionOption[]
  ) => {
    setExamStructureState((prevStructure) => {
      const newStructure = [...prevStructure];
      newStructure[sectionIndex].parts[partIndex].options = options;
      return newStructure;
    });
  };

  const addPartToSection = (sectionIndex: number) => {
    setExamStructureState((prevStructure) => {
      const newStructure = [...prevStructure];
      const sectionTitle = newStructure[sectionIndex].title;
      const basePart = newStructure[sectionIndex].parts[0];

      const newPart: ExamPart = {
        instruction: `Instrucción para ${sectionTitle} (Parte ${
          newStructure[sectionIndex].parts.length + 1
        })`,
        questions: basePart.questions,
        audio_file: null,
        audio_filename: null,
        questionType: "multiple_choice",
        options: [
          { id: "1", text: "Opción A", isCorrect: true },
          { id: "2", text: "Opción B", isCorrect: false },
          { id: "3", text: "Opción C", isCorrect: false },
        ],
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
      setTitle("");
      setDuration(60);
      setInstructions("");
      setExamDate("");
      setExamStructureState(EXAM_SECTIONS_TEMPLATE);
      setActiveTab("structure");
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

    // Validar que todas las preguntas de opción múltiple tengan al menos una respuesta correcta
    for (const section of examStructureState) {
      for (const part of section.parts) {
        if (
          (part.questionType === "multiple_choice" ||
            part.questionType === "true_false") &&
          part.options
        ) {
          const hasCorrectAnswer = part.options.some((opt) => opt.isCorrect);
          if (!hasCorrectAnswer) {
            toast({
              title: "Error de Configuración",
              description: `Todas las preguntas de opción múltiple deben tener al menos una respuesta correcta. Revisa la sección ${section.title}.`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
      }
    }

    const examData: Partial<Exam> = {
      course_id: courseId,
      title,
      description: instructions,
      duration_minutes: duration,
      total_questions: totalQuestions,
      exam_type: "structured",
      due_date: examDate 
        ? new Date(examDate).toISOString() 
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      max_attempts: maxAttempts,
      is_active: true,
      structure: examStructureState,
    };

    try {
      const newExam = await createExam(examData);

      if (newExam) {
        // Creación de las preguntas con opciones
        for (const section of examStructureState) {
          let totalQuestionsInSection = section.parts.reduce(
            (sum, part) => sum + part.questions,
            0
          );

          const pointsPerQuestion =
            totalQuestionsInSection > 0
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
                question_type: part.questionType,
                options: part.options
                  ? part.options.map((opt) => opt.text)
                  : [],
                correct_answers: part.options
                  ? part.options
                      .filter((opt) => opt.isCorrect)
                      .map((opt) => opt.text)
                  : [],
                points: pointsPerQuestion,
                order_number: questionCounter,
                audio_url: part.audio_filename
                  ? `/audio/${part.audio_filename}`
                  : null,
              };
              await createQuestion(questionData as any);
            }
          }
        }

        toast({
          title: "Éxito",
          description: `El examen "${newExam.title}" ha sido creado exitosamente.`,
        });

        await notifyStudentsOfNewExam(newExam.id, newExam.course_id);
      } else {
        throw new Error("No se pudo crear el examen");
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

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return <ListChecks className="h-4 w-4" />;
      case "fill_blank":
        return <Type className="h-4 w-4" />;
      case "essay":
        return <PenTool className="h-4 w-4" />;
      case "true_false":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileQuestion className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "text-gray-700 bg-gray-100 border-gray-300";
      case "fill_blank":
        return "text-gray-700 bg-gray-100 border-gray-300";
      case "essay":
        return "text-gray-700 bg-gray-100 border-gray-300";
      case "true_false":
        return "text-gray-700 bg-gray-100 border-gray-300";
      default:
        return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Examen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold text-gray-900">
            Diseño Estructural de Examen
          </DialogTitle>
          <p className="text-base text-gray-600">
            Curso: {courseName}. Defina las instrucciones y cargue archivos para
            las partes.
          </p>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="structure"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Estructura del Examen
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <Eye className="h-4 w-4" />
              Vista Previa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Panel de Configuración General */}
              <Card className="lg:col-span-4 p-6 shadow-xl border border-gray-200 h-fit sticky top-0">
                <h4 className="text-xl font-bold mb-4 border-b pb-2 text-gray-900">
                  Configuración General
                </h4>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="font-semibold flex items-center gap-2 text-gray-700"
                    >
                      <FileText className="h-4 w-4" />
                      Título del Examen
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Evaluación Final B2 - Junio 2025"
                      required
                      className="border-gray-300 focus:border-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="duration"
                      className="font-semibold flex items-center gap-2 text-gray-700"
                    >
                      <Clock className="h-4 w-4" />
                      Duración (minutos)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      min={1}
                      required
                      className="border-gray-300 focus:border-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="examDate"
                      className="font-semibold flex items-center gap-2 text-gray-700"
                    >
                      <Calendar className="h-4 w-4" />
                      Fecha de Publicación del Examen
                    </Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="border-gray-300 focus:border-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="instructions"
                      className="font-semibold flex items-center gap-2 text-gray-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      Instrucciones Generales
                    </Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={4}
                      placeholder="Instrucciones generales o notas para el estudiante..."
                      className="border-gray-300 focus:border-gray-500"
                    />
                  </div>

                  {/* Resumen del Examen */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h5 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Resumen del Examen
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">
                          Duración
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {duration} min
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">
                          Puntuación Máx
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          20 puntos
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">
                          Total Preguntas
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalQuestions}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">
                          Secciones
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {examStructureState.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-lg h-12 bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-all duration-300 shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    Crear Examen Base
                  </Button>
                </form>
              </Card>

              {/* Panel de Configuración de Secciones */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-gray-900">
                    Configuración de Secciones
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-sm text-gray-700 border-gray-300"
                  >
                    {examStructureState.length} secciones configuradas
                  </Badge>
                </div>

                <div className="grid gap-6">
                  {examStructureState.map((sectionData, sectionIndex) => (
                    <Card
                      key={sectionData.section_id}
                      className="shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl"
                    >
                      <CardHeader className="bg-gray-50 rounded-t-lg pb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gray-900 text-white font-semibold text-sm">
                              {sectionData.section_id}
                            </Badge>
                            <div>
                              <h3 className="text-2xl font-extrabold text-gray-900">
                                {sectionData.title}
                              </h3>
                              <p className="text-sm text-gray-600 font-semibold">
                                Puntuación: {sectionData.max_score} puntos
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-4">
                        {sectionData.parts.map((part, partIndex) => (
                          <div
                            key={partIndex}
                            className="bg-white p-4 rounded-lg border-2 border-gray-100 hover:border-gray-300 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <Badge
                                  className={`${getQuestionTypeColor(
                                    part.questionType
                                  )} font-semibold`}
                                >
                                  {getQuestionTypeIcon(part.questionType)}
                                  {part.questionType === "multiple_choice" &&
                                    " Opción Múltiple"}
                                  {part.questionType === "fill_blank" &&
                                    " Completar"}
                                  {part.questionType === "essay" && " Ensayo"}
                                  {part.questionType === "true_false" &&
                                    " Verdadero/Falso"}
                                </Badge>
                                <span className="text-sm font-semibold text-gray-600">
                                  Parte {partIndex + 1} • {part.questions}{" "}
                                  preguntas
                                </span>
                              </div>

                              {sectionData.parts.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    removePartFromSection(
                                      sectionIndex,
                                      partIndex
                                    )
                                  }
                                  className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors bg-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="space-y-4">
                              {/* Selector de Tipo de Pregunta */}
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
                                  Tipo de Pregunta
                                </Label>
                                <Select
                                  value={part.questionType}
                                  onValueChange={(
                                    value: ExamPart["questionType"]
                                  ) =>
                                    handleQuestionTypeChange(
                                      sectionIndex,
                                      partIndex,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full border-gray-300 bg-white">
                                    <SelectValue placeholder="Selecciona el tipo de pregunta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">
                                      <div className="flex items-center gap-2">
                                        <ListChecks className="h-4 w-4" />
                                        Opción Múltiple
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="true_false">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Verdadero/Falso
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="fill_blank">
                                      <div className="flex items-center gap-2">
                                        <Type className="h-4 w-4" />
                                        Completar Espacios
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="essay">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="h-4 w-4" />
                                        Ensayo
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Instrucción Específica */}
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">
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
                                  placeholder="Describe la tarea que debe realizar el estudiante..."
                                  className="resize-none border-gray-300 focus:border-gray-500"
                                />
                              </div>

                              {/* Gestor de Opciones (solo para multiple_choice y true_false) */}
                              {(part.questionType === "multiple_choice" ||
                                part.questionType === "true_false") && (
                                <QuestionOptionsManager
                                  options={part.options || []}
                                  onChange={(options) =>
                                    handleOptionsChange(
                                      sectionIndex,
                                      partIndex,
                                      options
                                    )
                                  }
                                  questionType={part.questionType}
                                />
                              )}

                              {/* Para ensayo y completar, mostrar mensaje informativo */}
                              {(part.questionType === "essay" ||
                                part.questionType === "fill_blank") && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    {part.questionType === "essay"
                                      ? "Esta sección evaluará un ensayo escrito por el estudiante."
                                      : "Los estudiantes completarán los espacios en blanco en el texto."}
                                  </p>
                                </div>
                              )}

                              {/* Configuración de Audio para Listening */}
                              {sectionData.title === "Listening" && (
                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                  <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                                    <Upload className="h-4 w-4" />
                                    Archivo de Audio
                                  </Label>
                                  {part.audio_filename ? (
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-300">
                                      <div className="flex items-center gap-2">
                                        <Music className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-800">
                                          {part.audio_filename}
                                        </span>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                          handleAudioUpload(
                                            sectionIndex,
                                            partIndex,
                                            null
                                          )
                                        }
                                        className="h-8 w-8 text-gray-600 hover:bg-gray-100 hover:text-gray-800 bg-white"
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
                                          e.target.files
                                            ? e.target.files[0]
                                            : null
                                        )
                                      }
                                      className="file:text-gray-700 file:font-semibold border-gray-300"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          onClick={() => addPartToSection(sectionIndex)}
                          className="w-full border-dashed border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors bg-white"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Añadir Parte a {sectionData.title}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card className="p-6 border border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Vista Previa del Examen
                </CardTitle>
                <p className="text-gray-600">
                  Esta es una vista previa de cómo verán los estudiantes el
                  examen.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">
                    {title || "Título del Examen"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {instructions || "Instrucciones generales..."}
                  </p>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">Duración</p>
                      <p className="text-lg font-bold text-gray-900">
                        {duration} min
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        Puntuación Máxima
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        20 puntos
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        Total Preguntas
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {totalQuestions}
                      </p>
                    </div>
                  </div>
                </div>

                {examStructureState.map((section, sectionIndex) => (
                  <div
                    key={section.section_id}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-gray-900 text-white">
                        Sección {sectionIndex + 1}
                      </Badge>
                      <h4 className="text-xl font-bold text-gray-900">
                        {section.title}
                      </h4>
                      <span className="text-sm text-gray-600 ml-auto">
                        {section.max_score} puntos
                      </span>
                    </div>

                    {section.parts.map((part, partIndex) => (
                      <div key={partIndex} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className={getQuestionTypeColor(part.questionType)}
                          >
                            {getQuestionTypeIcon(part.questionType)}
                            Parte {partIndex + 1}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {part.questions}{" "}
                            {part.questions === 1 ? "pregunta" : "preguntas"}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-3">{part.instruction}</p>

                        {(part.questionType === "multiple_choice" ||
                          part.questionType === "true_false") &&
                          part.options && (
                            <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="text-sm font-semibold mb-2 text-gray-700">
                                Opciones de ejemplo:
                              </p>
                              {part.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border ${
                                      option.isCorrect
                                        ? "bg-gray-900 border-gray-900"
                                        : "bg-white border-gray-400"
                                    }`}
                                  />
                                  <span
                                    className={
                                      option.isCorrect
                                        ? "font-semibold text-gray-900"
                                        : "text-gray-700"
                                    }
                                  >
                                    {option.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Componente de Calificación de Examen MEJORADO
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
      const initialSubmissions = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        studentPhoto: s.photoUrl,
        status: "submitted" as "submitted",
        score: null as number | null,
      }));
      setSubmissions(initialSubmissions);
    }
  }, [isOpen, students]);

  const handleScoreChange = (studentId: string, val: string) => {
    const score = parseFloat(val);
    const maxScore = 20;

    if (isNaN(score)) {
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.studentId === studentId
            ? { ...sub, score: null, status: "submitted" }
            : sub
        )
      );
      return;
    }

    if (score < 0 || score > maxScore) {
      toast({
        title: "Error de Nota",
        description: `La calificación debe estar entre 0 y ${maxScore}`,
        variant: "destructive",
      });
      return;
    }

    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.studentId === studentId
          ? { ...sub, score: score, status: "graded" }
          : sub
      )
    );
  };

  const saveGrades = () => {
    const gradedCount = submissions.filter((s) => s.score !== null).length;

    toast({
      title: "Calificaciones Guardadas",
      description: `Se han calificado ${gradedCount} de ${students.length} estudiantes.`,
    });
    setIsOpen(false);
  };

  const isPassing = (score: number) => score > 11;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white"
        >
          <BarChart className="mr-2 h-4 w-4" /> Calificar Exámenes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Sistema de Calificación
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {selectedExamTitle} del Curso: {courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border border-gray-200">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm border-b border-gray-200">
              <div className="col-span-5 text-gray-700">Estudiante</div>
              <div className="col-span-2 text-center text-gray-700">Estado</div>
              <div className="col-span-3 text-center text-gray-700">
                Calificación (0-20)
              </div>
              <div className="col-span-2 text-center text-gray-700">
                Resultado
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {submissions.map((sub) => (
                <div
                  key={sub.studentId}
                  className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                      <AvatarImage src={sub.studentPhoto} />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {sub.studentName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium block text-gray-900">
                        {sub.studentName}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {sub.studentId.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    {sub.score !== null ? (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Calificado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-600 border-gray-300"
                      >
                        Pendiente
                      </Badge>
                    )}
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={sub.score ?? ""}
                        onChange={(e) =>
                          handleScoreChange(sub.studentId, e.target.value)
                        }
                        className="w-20 text-center h-9 border-gray-300 focus:border-gray-500 text-gray-900 bg-white"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">/ 20</span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    {sub.score !== null && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                          isPassing(sub.score)
                            ? "bg-gray-100 text-gray-700 border border-gray-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        {isPassing(sub.score) ? "APROBADO" : "REPROBADO"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={saveGrades}
              className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Guardar Calificaciones
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente de Lección (CreateLessonDialog MEJORADO)
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
        <Button
          variant="outline"
          className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Lección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Crear Nueva Lección
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Curso: {courseName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateLesson} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="flex items-center gap-2 text-gray-700"
            >
              <BookOpen className="h-4 w-4" />
              Título de la Lección
            </Label>
            <Input
              id="title"
              value={newLesson.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ej: Introducción al Presente Simple"
              required
              className="border-gray-300 focus:border-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="flex items-center gap-2 text-gray-700"
            >
              <FileText className="h-4 w-4" />
              Descripción
            </Label>
            <Textarea
              id="description"
              value={newLesson.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe el contenido de esta lección..."
              rows={3}
              className="border-gray-300 focus:border-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4" />
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
                className="file:text-gray-700 file:font-semibold border-gray-300"
              />
              {newLesson.pdfFile && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-300">
                  <span className="text-sm text-gray-800 truncate flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    {newLesson.pdfFile.name}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFileUpload("pdfFile", null)}
                    className="h-6 w-6 text-gray-600 hover:bg-gray-100 bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <Music className="h-4 w-4" />
                Audio (Opcional)
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
                className="file:text-gray-700 file:font-semibold border-gray-300"
              />
              {newLesson.audioFile && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-300">
                  <span className="text-sm text-gray-800 truncate flex items-center gap-2">
                    <Music className="h-3 w-3" />
                    {newLesson.audioFile.name}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFileUpload("audioFile", null)}
                    className="h-6 w-6 text-gray-600 hover:bg-gray-100 bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
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

// Componente de Asistencia MEJORADO
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
    if (isOpen) {
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
    const presentCount = attendanceState.filter((s) => s.attended).length;
    const attendancePercentage =
      students.length > 0
        ? Math.round((presentCount / students.length) * 100)
        : 0;

    toast({
      title: "Asistencia Guardada",
      description: `Registro completado: ${presentCount} presentes (${attendancePercentage}%)`,
    });
    setIsOpen(false);
  };

  const handleViewAttendanceReport = () => {
    setShowReport(true);
  };

  const handleSendToCoordinator = () => {
    toast({
      title: "Reporte Enviado",
      description: `El reporte de asistencia ha sido enviado al coordinador.`,
    });
  };

  const presentCount = attendanceState.filter((s) => s.attended).length;
  const absentCount = students.length - presentCount;
  const attendancePercentage =
    students.length > 0
      ? Math.round((presentCount / students.length) * 100)
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        >
          <UserCheck className="mr-2 h-4 w-4" /> Tomar Asistencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] transition-all duration-300 ease-in-out p-6">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Registro de Asistencia
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Curso: {courseName} • Fecha: {today}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAttendanceReport}
              className="flex items-center gap-2 transition-colors hover:bg-gray-50 border-gray-300 bg-white"
            >
              <BarChart className="h-4 w-4" />
              Ver Resumen
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-3">
          {students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                No hay estudiantes inscritos en este curso.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 font-bold text-sm text-gray-700 border-b border-gray-200 pb-2">
                <span className="col-span-6">Estudiante</span>
                <span className="col-span-2 text-center">Estado</span>
                <span className="col-span-2 text-center">Horas</span>
                <span className="col-span-2 text-center">Acciones</span>
              </div>

              {attendanceState.map((student) => (
                <div
                  key={student.id}
                  className={`grid grid-cols-12 gap-3 items-center p-3 rounded-lg transition-all duration-200 ${
                    student.attended
                      ? "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={student.photoUrl} alt={student.name} />
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {student.name ? student.name[0] : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium block text-gray-900">
                        {student.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {student.email}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <Badge
                      className={`font-semibold transition-colors ${
                        student.attended
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {student.attended ? "PRESENTE" : "AUSENTE"}
                    </Badge>
                  </div>

                  <div className="col-span-2 text-center">
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
                      max={8}
                      step={0.5}
                      className={`w-20 mx-auto text-center h-9 text-sm transition-all ${
                        !student.attended
                          ? "bg-gray-100 cursor-not-allowed text-gray-400"
                          : "bg-white border-gray-300 text-gray-900 font-semibold"
                      }`}
                      readOnly={!student.attended}
                    />
                  </div>

                  <div className="col-span-2 flex gap-1">
                    <Button
                      variant={student.attended ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceToggle(student.id, true)}
                      disabled={student.attended}
                      className="flex-1 h-9 bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                    >
                      ✓
                    </Button>
                    <Button
                      variant={!student.attended ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceToggle(student.id, false)}
                      disabled={!student.attended}
                      className="flex-1 h-9 bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                    >
                      ✗
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showReport && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200 transition-opacity duration-300">
            <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Resumen de Asistencia
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-600">Presentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {presentCount}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-600">Ausentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {absentCount}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-600">% Asistencia</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendancePercentage}%
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendToCoordinator}
                className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                Enviar a Coordinador
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport(false)}
                className="transition-colors hover:bg-gray-100 border-gray-300 bg-white"
              >
                Cerrar Resumen
              </Button>
            </div>
          </div>
        )}

        <Button
          className="w-full mt-4 bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-all duration-300 shadow-lg"
          onClick={handleSaveAttendance}
          size="lg"
        >
          <UserCheck className="mr-2 h-5 w-5" />
          Guardar Registro de Asistencia
        </Button>
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
  const academicLevel = (student as any).academicLevel || "No especificado";
  const studentCode = (student as any).studentCode || "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] p-6">
        <DialogHeader className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-gray-200 shadow-lg">
            <AvatarImage src={student.photoUrl} alt={student.name} />
            <AvatarFallback className="text-2xl font-bold bg-gray-900 text-white">
              {student.name ? student.name[0] : "?"}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-extrabold text-gray-900">
            {student.name}
          </DialogTitle>
          {studentCode && (
            <DialogDescription className="text-gray-600">
              Código:{" "}
              <span className="font-mono font-semibold">{studentCode}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Información Académica
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Nivel</p>
                <p className="text-sm font-medium text-gray-900">
                  {academicLevel}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Estado</p>
                <p className="text-sm font-medium text-gray-900">Activo</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600">
                  Email Universitario
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {student.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
              <FileDigit className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Documento</p>
                <p className="text-sm font-medium text-gray-900">
                  {student.documentId || "No registrado"}
                </p>
              </div>
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

  const loadStudents = useCallback(
    async (id: string) => {
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
    },
    [toast]
  );

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
          <Button
            variant="outline"
            className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
          >
            <Users className="mr-2 h-4 w-4" /> Listado de Estudiantes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] transition-all duration-300 ease-in-out">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Estudiantes Inscritos
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Curso: {courseName} • Total: {students.length} estudiantes
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">
                  Cargando estudiantes...
                </span>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  No hay estudiantes inscritos en este curso.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={student.photoUrl}
                          alt={student.name}
                        />
                        <AvatarFallback className="bg-gray-900 text-white">
                          {student.name ? student.name[0] : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium block text-gray-900">
                          {student.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.email}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(student)}
                      className="transition-colors hover:bg-gray-100 hover:text-gray-900 bg-white"
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

// Componente ViewLessonsDialog MEJORADO
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
    setLessons((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, is_published: !currentStatus }
          : lesson
      )
    );

    toast({
      title: "Éxito",
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
          <Button
            variant="outline"
            className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
          >
            <BookOpen className="mr-2 h-4 w-4" /> Gestionar Lecciones
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Contenido del Curso
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {courseName} • {lessons.length} lección
              {lessons.length !== 1 ? "es" : ""} disponible
              {lessons.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  No hay lecciones creadas para este curso.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <Card
                    key={lesson.id}
                    className="p-4 transition-all duration-150 hover:shadow-lg hover:border-gray-300 border-2 border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-lg text-gray-900">
                          {lesson.title}
                        </h4>
                        {lesson.description && (
                          <p className="text-sm text-gray-600">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {lesson.pdf_url && (
                            <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              <FileText className="h-3 w-3" />
                              Material PDF
                            </span>
                          )}
                          {lesson.audio_url && (
                            <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              <Music className="h-3 w-3" />
                              Audio
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Orden: {lesson.order_index}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            lesson.is_published ? "default" : "secondary"
                          }
                          className={`flex items-center gap-1 ${
                            lesson.is_published
                              ? "bg-gray-900 text-white hover:bg-gray-800 border-gray-900"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
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
                                ? "text-gray-500 border-gray-300 hover:bg-gray-50 bg-white"
                                : "text-gray-700 border-gray-300 hover:bg-gray-50 bg-white"
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
                            className="h-8 w-8 text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors bg-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-gray-900">
                                  ¿Estás absolutamente seguro?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600">
                                  Esta acción no se puede deshacer. Esto
                                  eliminará permanentemente la lección{" "}
                                  <span className="font-bold text-gray-900">
                                    "{lesson.title}"
                                  </span>{" "}
                                  y todos los datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    executeDeleteLesson(lesson.id, lesson.title)
                                  }
                                  className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
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

// Componente EditLessonDialog MEJORADO
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
          <DialogTitle className="text-xl font-bold text-gray-900">
            Editar Lección
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Modifica el título y descripción de la lección
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label
              htmlFor="edit-title"
              className="flex items-center gap-2 mb-2 text-gray-700"
            >
              <BookOpen className="h-4 w-4" />
              Título de la Lección
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la lección"
              className="border-gray-300 focus:border-gray-500"
            />
          </div>

          <div>
            <Label
              htmlFor="edit-description"
              className="flex items-center gap-2 mb-2 text-gray-700"
            >
              <FileText className="h-4 w-4" />
              Descripción
            </Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la lección (opcional)"
              rows={4}
              className="border-gray-300 focus:border-gray-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="transition-colors border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </DialogFooter>
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Mis Cursos
          </h2>
          <p className="text-gray-600">
            Listado de cursos que estás enseñando. Utiliza los botones para
            gestionar cada curso.
          </p>
        </div>

        {loading ? (
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                <p className="text-sm text-gray-600">Cargando cursos...</p>
              </div>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">
                No tienes cursos asignados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="flex flex-col transition-shadow duration-300 hover:shadow-lg hover:border-gray-300 border border-gray-200"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-gray-900">
                    {course.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge
                      variant="secondary"
                      className="transition-colors hover:bg-gray-200 bg-gray-100 text-gray-700"
                    >
                      {course.language}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="transition-colors hover:bg-gray-50 border-gray-300 text-gray-700"
                    >
                      {course.level}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    {course.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1 text-gray-700">
                          Descripción
                        </h4>
                        <p className="text-sm text-gray-600 italic line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    )}
                    {course.schedule && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1 text-gray-700">
                          Horario
                        </h4>
                        <p className="text-sm text-gray-600 font-semibold">
                          {course.schedule}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-4">
                    {/* GRUPO 1: Contenido y Creación */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200">
                      <CreateLessonDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                      <CreateExamWithStructureDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                    </div>

                    {/* GRUPO 2: Consulta y Calificación */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200">
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

                    {/* GRUPO 3: Gestión Administrativa */}
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