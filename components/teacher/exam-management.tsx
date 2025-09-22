'use client'

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, FileText, Clock, Loader2, Save, Users } from "lucide-react"
import { Toaster, toast } from 'sonner'
import {
  getExamsByTeacher,
  createExam,
  updateExam,
  deleteExam,
  getExamQuestions,
  createQuestion,
  deleteQuestion,
  getExamSubmissions,
  updateSubmissionScore,
} from "@/lib/exams"
import type { Exam, Question } from "@/lib/exams"
import { getCourseAssignmentsByTeacher } from "@/lib/assignments";


interface ExamManagementProps {
  teacherId: string
}

export default function ExamManagement({ teacherId }: ExamManagementProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [examSubmissions, setExamSubmissions] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [teacherCourses, setTeacherCourses] = useState<any[]>([])
  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    course_id: "",
    duration_minutes: 60,
    exam_type: "mixed",
    due_date: "",
    max_attempts: 1,
    instructions: "",
    passing_score: 70,
    show_results: true,
    randomize_questions: false,
  })

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice" as Question["question_type"],
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
  })

  const [viewSubmissionDialogOpen, setViewSubmissionDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    loadExams()
    loadTeacherCourses()
  }, [teacherId])

  const loadExams = async () => {
    setLoading(true)
    const examData = await getExamsByTeacher(teacherId)
    setExams(examData)
    setLoading(false)
  }

  const loadQuestions = async (examId: string) => {
    const questionData = await getExamQuestions(examId)
    setQuestions(questionData)
  }

  const resetExamForm = () => {
    setExamForm({
      title: "",
      description: "",
      course_id: "",
      duration_minutes: 60,
      exam_type: "mixed",
      due_date: "",
      max_attempts: 1,
      instructions: "",
      passing_score: 70,
      show_results: true,
      randomize_questions: false,
    })
    setEditingExam(null)
  }

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1,
    })
  }

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const examData = {
        ...examForm,
        created_by: teacherId,
        total_questions: 0,
        is_active: true,
      }

      if (editingExam) {
        const updated = await updateExam(editingExam.id, examData)
        if (updated) {
          toast.success("Examen actualizado exitosamente")
          loadExams()
        } else {
          toast.error("Error al actualizar examen")
        }
      } else {
        const newExam = await createExam(examData)
        if (newExam) {
          toast.success("Examen creado exitosamente")
          loadExams()
        } else {
          toast.error("Error al crear examen")
        }
      }

      setDialogOpen(false)
      resetExamForm()
    } catch (error) {
      toast.error("Error inesperado al procesar el formulario.")
    } finally {
      setCreating(false)
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam) return

    try {
      const questionData = {
        exam_id: selectedExam.id,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        options: questionForm.question_type === "multiple_choice" ? questionForm.options.filter(opt => opt.trim() !== '') : null,
        correct_answer: questionForm.correct_answer,
        points: questionForm.points,
        order_number: questions.length + 1,
      }

      const newQuestion = await createQuestion({
        ...questionData,
        options: questionData.options || undefined
      })
      if (newQuestion) {
        toast.success("Pregunta agregada exitosamente")
        loadQuestions(selectedExam.id)
        resetQuestionForm()
      } else {
        toast.error("Error al agregar pregunta")
      }
    } catch (error) {
      toast.error("Error inesperado al agregar la pregunta.")
    }
  }

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam)
    setExamForm({
      title: exam.title,
      description: exam.description || "",
      course_id: exam.course_id,
      duration_minutes: exam.duration_minutes,
      exam_type: exam.exam_type,
      due_date: exam.due_date,
      max_attempts: exam.max_attempts,
      instructions: (exam as any).instructions || "",
      passing_score: (exam as any).passing_score || 70,
      show_results: (exam as any).show_results ?? true,
      randomize_questions: (exam as any).randomize_questions ?? false,
    })
    setDialogOpen(true)
  }

  const handleManageQuestions = (exam: Exam) => {
    setSelectedExam(exam)
    loadQuestions(exam.id)
    setQuestionsDialogOpen(true)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("¿Estás seguro de eliminar esta pregunta?")) {
      const success = await deleteQuestion(questionId)
      if (success) {
        toast.success("Pregunta eliminada exitosamente")
        if (selectedExam) {
          loadQuestions(selectedExam.id)
        }
      } else {
        toast.error("Error al eliminar pregunta")
      }
    }
  }

  const handleDeleteExam = (exam: Exam) => {
    toast.promise(deleteExam(exam.id), {
      loading: `Eliminando examen "${exam.title}"...`,
      success: () => {
        loadExams();
        return `El examen "${exam.title}" ha sido eliminado.`;
      },
      error: `Error al eliminar el examen "${exam.title}".`
    });
  };

  const handleReviewExam = async (exam: Exam) => {
    setSelectedExam(exam)
    const submissions = await getExamSubmissions(exam.id)
    setExamSubmissions(submissions)
    setReviewDialogOpen(true)
  }

  const handleScoreChange = (submissionId: string, score: string) => {
    setExamSubmissions(prevSubmissions => 
      prevSubmissions.map(submission => 
        submission.id === submissionId ? { ...submission, score: parseFloat(score) } : submission
      )
    );
  };

  const handleSaveScore = async (submissionId: string) => {
    const submission = examSubmissions.find(sub => sub.id === submissionId);
    if (submission) {
      toast.promise(updateSubmissionScore(submissionId, submission.score), {
        loading: "Guardando calificación...",
        success: "Calificación guardada exitosamente.",
        error: "Error al guardar la calificación."
      });
    }
  };

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setViewSubmissionDialogOpen(true);
  };

  const loadTeacherCourses = async () => {
    if (!teacherId) return
    try {
      const courses = await getCourseAssignmentsByTeacher(teacherId)
      setTeacherCourses(courses)
    } catch (error) {
      console.error("Error cargando cursos:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-right" />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Exámenes</h2>
          <p className="text-muted-foreground">Crea y administra tus exámenes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetExamForm}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Examen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Editar Examen" : "Crear Nuevo Examen"}</DialogTitle>
              <DialogDescription>
                {editingExam ? "Modifica los datos del examen" : "Completa los datos para crear un nuevo examen"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleExamSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Examen</Label>
                  <Input
                    id="title"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exam_type">Tipo de Examen</Label>
                  <Select
                    value={examForm.exam_type}
                    onValueChange={(value) => setExamForm({ ...examForm, exam_type: value as Exam["exam_type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixto</SelectItem>
                      <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                      <SelectItem value="essay">Ensayo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  placeholder="Descripción del examen..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones</Label>
                <Textarea
                  id="instructions"
                  value={examForm.instructions}
                  onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                  placeholder="Instrucciones para los estudiantes..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number.parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attempts">Intentos Máximos</Label>
                  <Input
                    id="attempts"
                    type="number"
                    value={examForm.max_attempts}
                    onChange={(e) => setExamForm({ ...examForm, max_attempts: Number.parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passing_score">Nota Mínima (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    value={examForm.passing_score}
                    onChange={(e) => setExamForm({ ...examForm, passing_score: Number.parseFloat(e.target.value) })}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha Límite</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={examForm.due_date}
                  onChange={(e) => setExamForm({ ...examForm, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_id">Curso *</Label>
                <Select
                  value={examForm.course_id}
                  onValueChange={(value) => setExamForm({ ...examForm, course_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} - {course.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingExam ? "Actualizar" : "Crear Examen"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Exámenes</CardTitle>
          <CardDescription>Lista de exámenes que has creado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{exam.exam_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.duration_minutes}min
                    </div>
                  </TableCell>
                  <TableCell>{new Date(exam.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={exam.is_active ? "default" : "secondary"}>
                      {exam.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleManageQuestions(exam)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteExam(exam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleReviewExam(exam)}>
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Questions Management Dialog */}
      <Dialog open={questionsDialogOpen} onOpenChange={setQuestionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Preguntas - {selectedExam?.title}</DialogTitle>
            <DialogDescription>Agrega y edita las preguntas del examen</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="questions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="questions">Preguntas ({questions.length})</TabsTrigger>
              <TabsTrigger value="add-question">Agregar Pregunta</TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm">Pregunta {index + 1}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{question.question_type}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium mb-2">{question.question_text}</p>
                      {question.question_type === "multiple_choice" && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`text-sm p-2 rounded ${option === question.correct_answer ? "bg-green-100 text-green-800" : "bg-gray-50"
                                }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correct_answer && " ✓"}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-sm text-muted-foreground">
                        Puntos: {question.points} | Respuesta correcta: {question.correct_answer}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay preguntas agregadas. Usa la pestaña "Agregar Pregunta" para comenzar.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="add-question">
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question_text">Pregunta</Label>
                  <Textarea
                    id="question_text"
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    placeholder="Escribe la pregunta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question_type">Tipo de Pregunta</Label>
                    <Select
                      value={questionForm.question_type}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, question_type: value as Question["question_type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                        <SelectItem value="essay">Ensayo</SelectItem>
                        <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                        <SelectItem value="fill_blank">Completar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Puntos</Label>
                    <Input
                      id="points"
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: Number.parseFloat(e.target.value) })}
                      min="0.1"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                {questionForm.question_type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Opciones</Label>
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="mb-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options]
                            newOptions[index] = e.target.value
                            setQuestionForm({ ...questionForm, options: newOptions })
                          }}
                          placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="correct_answer">Respuesta Correcta</Label>
                  {questionForm.question_type === "multiple_choice" ? (
                    <Select
                      value={questionForm.correct_answer}
                      onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}
                      required={questionForm.options.filter(opt => opt.trim() !== '').length > 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la respuesta correcta" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionForm.options
                          .filter(option => option.trim() !== '')
                          .map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Textarea
                      id="correct_answer"
                      value={questionForm.correct_answer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                      placeholder="Respuesta correcta o criterios de evaluación..."
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetQuestionForm}>
                    Limpiar
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Agregar Pregunta
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Agregar el diálogo de revisión de exámenes al final del componente */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Revisión de Examen: {selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Entregas de estudiantes para este examen
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto">
            {examSubmissions.length === 0 ? (
              <Alert>
                <AlertDescription>No hay entregas para este examen todavía.</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Fecha de entrega</TableHead>
                    <TableHead>Tiempo usado</TableHead>
                    <TableHead>Advertencias</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {submission.students?.name || `${submission.students?.first_name} ${submission.students?.last_name}`}
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {Math.floor(submission.time_spent / 60)}min {submission.time_spent % 60}s
                      </TableCell>
                      <TableCell>
                        {submission.warnings?.length > 0 ? (
                          <Badge variant="destructive">{submission.warnings.length} advertencias</Badge>
                        ) : (
                          <Badge variant="outline">Sin advertencias</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={submission.score || ''}
                          onChange={(e) => handleScoreChange(submission.id, e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewSubmission(submission)}>
                            Ver detalles
                          </Button>
                          <Button variant="default" size="sm" onClick={() => handleSaveScore(submission.id)}>
                            Guardar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialogo para ver detalles de la entrega */}
      <Dialog open={viewSubmissionDialogOpen} onOpenChange={setViewSubmissionDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Entrega</DialogTitle>
            <DialogDescription>
              Revisión de las respuestas del estudiante para este examen.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Estudiante:</p>
                  <p>{selectedSubmission.students?.name || `${selectedSubmission.students?.first_name} ${selectedSubmission.students?.last_name}`}</p>
                </div>
                <div>
                  <p className="font-semibold">Calificación:</p>
                  <p className="text-xl font-bold">{selectedSubmission.score !== null ? `${selectedSubmission.score}%` : 'Pendiente'}</p>
                </div>
                <div>
                  <p className="font-semibold">Fecha de entrega:</p>
                  <p>{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold">Tiempo usado:</p>
                  <p>{Math.floor(selectedSubmission.time_spent / 60)} min {selectedSubmission.time_spent % 60} s</p>
                </div>
              </div>

              {selectedSubmission.warnings?.length > 0 && (
                <Alert variant="destructive">
                  <p className="font-semibold">Advertencias:</p>
                  <ul className="list-disc list-inside mt-2">
                    {selectedSubmission.warnings.map((warning: any, index: number) => (
                      <li key={index}>{warning.message} (Hora: {new Date(warning.timestamp).toLocaleTimeString()})</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <h3 className="text-lg font-bold">Respuestas del Estudiante</h3>
              <div className="space-y-4">
                {Array.isArray(selectedSubmission.answers) ? (
                  selectedSubmission.answers.map((answer: any, index: number) => (
                    <Card key={index} className="p-4">
                      <p className="font-semibold">Pregunta {index + 1}:</p>
                      <p>{answer.question_text}</p>
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Respuesta del estudiante:</p>
                        <p className="bg-gray-100 p-2 rounded italic">{answer.student_answer}</p>
                        
                        {answer.question_type === "multiple_choice" && (
                          <p className="font-medium mt-2">Respuesta correcta: <span className="text-green-600">{answer.correct_answer}</span></p>
                        )}
                        
                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant={answer.is_correct ? "default" : "destructive"}>
                            {answer.is_correct ? "Correcta" : "Incorrecta"}
                          </Badge>
                          <Badge variant="secondary">Puntos: {answer.points_earned || 0}/{answer.points_possible}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Alert>
                    <AlertDescription>No hay respuestas disponibles para esta entrega.</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}