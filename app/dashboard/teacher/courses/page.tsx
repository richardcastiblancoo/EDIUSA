"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getCourseAssignmentsByTeacher } from "@/lib/assignments";
import { getStudentsForCourse, Student } from "@/lib/students";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Users,
  CheckCircle,
  Loader2,
  PlusCircle,
  Maximize,
  TrendingUp,
  Upload,
  Trash2,
  Mail,
  FileDigit,
  Phone,
  GraduationCap,
  X,
} from "lucide-react";

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
  questions: number;
  audio_file: File | null;
  audio_filename: string | null;
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

const EXAM_SECTIONS_TEMPLATE: ExamSection[] = [
  {
    section_id: "S1",
    title: "Listening",
    max_score: 2.0,
    parts: [
      {
        instruction:
          "Escucha el audio y responde a las preguntas de opción múltiple (Parte 1).",
        questions: 5,
        audio_file: null,
        audio_filename: null,
      },
      {
        instruction:
          "Escucha el audio y completa los espacios en blanco (Parte 2).",
        questions: 5,
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S2",
    title: "Reading",
    max_score: 1.5,
    parts: [
      {
        instruction:
          "Lee el texto y selecciona la mejor opción para cada pregunta.",
        questions: 10,
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S3",
    title: "Use of Language",
    max_score: 1.5,
    parts: [
      {
        instruction:
          "Selecciona la palabra o frase que mejor complete la oración.",
        questions: 35,
        audio_file: null,
        audio_filename: null,
      },
    ],
  },
  {
    section_id: "S4",
    title: "Writing",
    max_score: 0.0,
    parts: [
      {
        instruction:
          "Escribe un ensayo de 150-200 palabras sobre el tema dado.",
        questions: 0,
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
    maxScoreBase += section.max_score;
  });
  return { totalQuestions, maxScoreBase: parseFloat(maxScoreBase.toFixed(2)) };
};

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
  const maxScore = 5.0;
  const [examStructureState, setExamStructureState] = useState<ExamSection[]>(
    EXAM_SECTIONS_TEMPLATE
  );
  const { totalQuestions } = calculateTotals(examStructureState);
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

  const handleQuestionCountChange = (
    sectionIndex: number,
    partIndex: number,
    count: number
  ) => {
    setExamStructureState((prevStructure) => {
      const newStructure = [...prevStructure];
      if (newStructure[sectionIndex].title === "Writing") {
        newStructure[sectionIndex].parts[partIndex].questions = 0;
        return newStructure;
      }
      newStructure[sectionIndex].parts[partIndex].questions =
        count > 0 ? count : 1;
      return newStructure;
    });
  };

  const addPartToSection = (sectionIndex: number) => {
    setExamStructureState((prevStructure) => {
      const newStructure = [...prevStructure];
      const sectionTitle = newStructure[sectionIndex].title;
      const newPart: ExamPart = {
        instruction: `Nueva instrucción para ${sectionTitle} (Parte ${
          newStructure[sectionIndex].parts.length + 1
        })`,
        questions: sectionTitle === "Writing" ? 0 : 5,
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
      newStructure[sectionIndex].parts.splice(partIndex, 1);
      return newStructure;
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDuration(60);
      setInstructions("");
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

    console.log("Estructura de Examen Final a enviar:", {
      courseId,
      title,
      duration,
      totalQuestions,
      instructions,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Éxito (Simulado)",
      description: `Estructura del examen "${title}" creada. El siguiente paso sería la carga de preguntas.`,
    });

    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 shadow-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Examen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto p-8 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold text-gray-800">
            ✨ Creación de Examen: {courseName}
          </DialogTitle>
          <p className="text-base text-muted-foreground">
            Diseña la estructura del examen por secciones (Listening, Reading,
            etc.) y sube los recursos necesarios.
          </p>
        </DialogHeader>

        <div className="grid lg:grid-cols-12 gap-8 py-4">
          <Card className="lg:col-span-3 p-6 shadow-xl border-t-4 border-blue-600 h-fit sticky top-0">
            <h4 className="text-xl font-bold mb-4 border-b pb-2 text-blue-700">
              Configuración General
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
                  placeholder="Ej: Examen Final B2 - Junio 2025"
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
                  Instrucciones
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
                  Restricciones
                </h5>
                <div className="flex justify-between items-center bg-red-100 p-3 rounded-lg border border-red-300">
                  <Label className="flex items-center text-sm font-semibold text-red-800">
                    <Maximize className="w-4 h-4 mr-2" />
                    Máximo de Intentos
                  </Label>
                  <Badge
                    variant="default"
                    className="bg-red-600 hover:bg-red-600 text-white text-md py-1"
                  >
                    {maxAttempts}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-green-100 p-3 rounded-lg border border-green-300">
                  <Label className="flex items-center text-sm font-semibold text-green-800">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Calificación Máxima
                  </Label>
                  <Badge
                    variant="default"
                    className="bg-green-600 hover:bg-green-600 text-white text-md py-1"
                  >
                    {maxScore.toFixed(1)}
                  </Badge>
                </div>
              </div>

              <p className="text-sm font-medium pt-3 border-t">
                La estructura base tiene {totalQuestions} preguntas.
              </p>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
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
              Diseño de Secciones y Partes
            </h4>

            <div className="grid grid-cols-2 gap-6">
              {examStructureState.map((sectionData, sectionIndex) => (
                <Card
                  key={sectionData.section_id}
                  className={`flex flex-col shadow-lg border-l-8 ${
                    sectionData.title === "Writing"
                      ? "border-yellow-500"
                      : "border-blue-500"
                  } p-0`}
                >
                  <CardHeader
                    className={`pb-2 ${
                      sectionData.title === "Writing"
                        ? "bg-yellow-50"
                        : "bg-blue-50"
                    } rounded-t-lg`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge
                          className={`font-semibold text-sm ${
                            sectionData.title === "Writing"
                              ? "bg-yellow-600"
                              : "bg-blue-600"
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
                        className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-700">
                            {sectionData.title} Parte {partIndex + 1}
                          </p>

                          {sectionData.parts.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removePartFromSection(sectionIndex, partIndex)
                              }
                              className="h-6 w-6 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-600">
                            Instrucción para el Estudiante
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

                        {sectionData.title === "Listening" && (
                          <div className="space-y-1 pt-2 border-t border-dashed">
                            <Label className="text-xs flex items-center font-semibold text-blue-600">
                              <Upload className="w-3 h-3 mr-1" /> Archivo de
                              Audio (MP3/WAV)
                            </Label>

                            {part.audio_filename ? (
                              <div className="flex items-center justify-between bg-green-50 p-2 rounded-md border border-green-300">
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
                                  className="h-6 w-6 text-red-500 hover:bg-red-100"
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

                        <div className="flex justify-between items-center pt-2 border-t mt-3">
                          <Label className="text-xs font-semibold text-gray-600">
                            {sectionData.title === "Writing"
                              ? "Preguntas (Automático)"
                              : "Cantidad de Preguntas"}
                          </Label>
                          <Input
                            type="number"
                            value={part.questions}
                            onChange={(e) =>
                              handleQuestionCountChange(
                                sectionIndex,
                                partIndex,
                                parseInt(e.target.value)
                              )
                            }
                            readOnly={sectionData.title === "Writing"}
                            min={sectionData.title === "Writing" ? 0 : 1}
                            className={`w-20 text-center h-8 ${
                              sectionData.title === "Writing"
                                ? "bg-gray-200 cursor-not-allowed"
                                : "bg-white"
                            }`}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => addPartToSection(sectionIndex)}
                      className="w-full mt-4 border-dashed border-blue-400 text-blue-600 hover:bg-blue-100"
                      disabled={
                        sectionData.title === "Writing" &&
                        sectionData.parts.length >= 1
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Parte de{" "}
                      {sectionData.title}
                    </Button>

                    {sectionData.title === "Writing" && (
                      <p className="text-xs text-red-500 mt-2 italic">
                        Solo se permite una parte de Writing, ya que se evalúa
                        un solo texto.
                      </p>
                    )}
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
  const phoneNumber = (student as any).phoneNumber || "No Registrado";
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader className="text-center">
          <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-blue-500 shadow-lg">
            <AvatarImage src={student.photoUrl} alt={student.name} />
            <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-800">
              {student.name ? student.name[0] : "?"}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-extrabold text-gray-800">
            {student.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-lg font-bold text-gray-700">
            Información del Estudiante
          </h4>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-gray-500">
                Nivel Académico
              </p>
              <p className="text-sm font-medium">{academicLevel}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-gray-500">Email</p>
              <p className="text-sm font-medium">{student.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs font-semibold text-gray-500">
                Número de Contacto
              </p>
              <p className="text-sm font-medium">{phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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

const AttendanceDialog = ({
  courseName,
  students,
}: {
  courseName: string;
  students: Student[];
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
      attended: false,
      hours: 0,
    }))
  );

  useEffect(() => {
    setAttendanceState(
      students.map((student) => ({
        ...student,
        attended: false,
        hours: 0,
      }))
    );
  }, [students]);

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
    console.log(
      "Registros de asistencia a guardar:",
      attendanceState.map((s) => ({
        studentId: s.id,
        attended: s.attended ? "Si" : "No",
        hours: s.hours,
        date: today,
      }))
    );

    toast({
      title: "Asistencia Guardada (Simulada)",
      description: `Se registró la asistencia para ${
        attendanceState.filter((s) => s.attended).length
      } estudiantes el ${today}.`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" /> Tomar Asistencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] transition-all duration-300 ease-in-out p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Registro de Asistencia: {courseName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fecha: <span className="font-semibold text-blue-600">{today}</span>
          </p>
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
                  className={`grid grid-cols-5 gap-3 items-center p-2 rounded-md transition-colors ${
                    student.attended
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
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
                      className={`font-semibold ${
                        student.attended
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {student.attended ? "ASISTIÓ" : "NO ASISTIÓ"}
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
                      className={`w-20 mx-auto text-center h-8 text-sm ${
                        !student.attended
                          ? "bg-gray-200 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      readOnly={!student.attended}
                    />
                  </div>

                  <div className="space-y-1">
                    <Button
                      variant={student.attended ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleAttendanceToggle(student.id, true)}
                      disabled={student.attended && student.hours > 0} // Deshabilitar si ya está marcado y tiene horas
                      className="w-full h-8"
                    >
                      Asistió
                    </Button>
                    <Button
                      variant={!student.attended ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleAttendanceToggle(student.id, false)}
                      disabled={!student.attended && student.hours === 0}
                      className="w-full h-8 border-red-400 text-red-600 hover:bg-red-50"
                    >
                      No Asistió
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button className="w-full mt-4" onClick={handleSaveAttendance}>
          Guardar Asistencia
        </Button>
      </DialogContent>
    </Dialog>
  );
};

interface StudentListDialogProps {
  courseId: string;
  courseName: string;
}

const StudentListDialog = ({
  courseId,
  courseName,
}: StudentListDialogProps) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const loadStudents = async (id: string) => {
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
  };

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
  }, [isListOpen, courseId, toast]);

  return (
    <>
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Users className="mr-2 h-4 w-4" /> Listado de Estudiantes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] transition-all duration-300 ease-in-out">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Listado de Estudiantes Inscritos
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Curso: {courseName}</p>
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
                <p className="text-sm font-medium">
                  Total: {students.length} estudiantes
                </p>
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
        await new Promise((resolve) => setTimeout(resolve, 500));
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
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos 📚</h2>
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
              <Card key={course.id} className="flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{course.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary">{course.language}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-4 border-b pb-4">
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Duración</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.duration_weeks
                            ? `${course.duration_weeks} semanas`
                            : "No especificada"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Horas/Semana
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {course.hours_per_week
                            ? `${course.hours_per_week} horas`
                            : "No especificado"}
                        </p>
                      </div>
                    </div>
                    {course.schedule && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Horario</h4>
                        <p className="text-sm text-muted-foreground font-semibold">
                          {course.schedule}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="text-sm font-medium mb-1">
                      Estudiantes inscritos ({course.students.length})
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Capacidad: {course.max_students || "∞"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {course.students.length > 0 ? (
                        <>
                          {course.students
                            .slice(0, 5)
                            .map((student: Student) => (
                              <div
                                key={student.id}
                                className="flex items-center gap-1"
                                title={student.name}
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarImage
                                    src={student.photoUrl}
                                    alt={student.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {student.name ? student.name[0] : "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ))}
                          {course.students.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{course.students.length - 5}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No hay estudiantes inscritos
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/teacher/courses/${course.id}/lessons`}
                        passHref
                      >
                        <Button variant="outline" className="w-full">
                          <BookOpen className="mr-2 h-4 w-4" /> Lecciones
                        </Button>
                      </Link>

                      <CreateExamWithStructureDialog
                        courseId={course.id}
                        courseName={course.name}
                      />
                    </div>

                    <StudentListDialog
                      courseId={course.id}
                      courseName={course.name}
                    />

                    <AttendanceDialog
                      courseName={course.name}
                      students={course.students}
                    />
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
