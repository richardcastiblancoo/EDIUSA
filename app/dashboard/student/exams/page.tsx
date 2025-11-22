"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { getExamById, getExamQuestions, submitExamWithMonitoring, getStudentExamAttemptsCount } from "@/lib/exams"; // Usar funciones existentes
import type { Exam, Question } from "@/lib/exams"; // Usar tipos del archivo existente

interface Answer {
  questionId: string;
  selectedOption?: string;
  responseText?: string;
}

export default function StudentExamPage() {
  const router = useRouter();
  const { examId } = useParams<{ examId: string }>(); // Obtener ID del examen desde la URL
  const { user, loading } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); // en segundos
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsMade, setAttemptsMade] = useState(0);
  const [canStartExam, setCanStartExam] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    if (!loading && user && examId) {
      fetchExam();
    }
  }, [loading, user, examId, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0 && !examFinished) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && examStarted && !examFinished) {
      handleSubmitExam(); // Enviar automáticamente si el tiempo se acaba
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft, examFinished]);

  const fetchExam = async () => {
    setError(null);
    try {
      const fetchedExam = await getExamById(examId!);
      if (fetchedExam && user) {
        setExam(fetchedExam);
        setTimeLeft(fetchedExam.duration_minutes * 60); // Convertir minutos a segundos

        const attempts = await getStudentExamAttemptsCount(user.id, examId!);
        setAttemptsMade(attempts);

        const isOverdue = new Date(fetchedExam.due_date) < new Date();
        const hasAttemptsLeft = attempts < fetchedExam.max_attempts;

        if (!isOverdue && hasAttemptsLeft) {
          setCanStartExam(true);
        } else {
          setCanStartExam(false);
          if (isOverdue) {
            setError("Este examen ha caducado.");
          } else if (!hasAttemptsLeft) {
            setError("Has agotado el número máximo de intentos para este examen.");
          }
        }

        const fetchedQuestions = await getExamQuestions(examId!);
        setQuestions(fetchedQuestions);
        setAnswers(
          fetchedQuestions.map((q) => ({
            questionId: q.id,
            selectedOption: undefined,
            responseText: undefined,
          }))
        );
      } else {
        setError("Examen no encontrado o no disponible.");
      }
    } catch (err) {
      console.error("Error fetching exam:", err);
      setError("Error al cargar el examen.");
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleAnswerChange = (
    questionId: string,
    value: string,
    type: "option" | "text"
  ) => {
    setAnswers((prevAnswers) =>
      prevAnswers.map((ans) =>
        ans.questionId === questionId
          ? {
              ...ans,
              selectedOption: type === "option" ? value : ans.selectedOption,
              responseText: type === "text" ? value : ans.responseText,
            }
          : ans
      )
    );
  };

  const handleNextQuestion = () => {
    if (questions.length > 0 && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!exam || !user || !examId) return;
    setExamFinished(true);
    setError(null);

    try {
      // Formatear respuestas al esquema requerido por submitExamWithMonitoring
      const formattedAnswers = answers.reduce((acc, ans) => {
        acc[ans.questionId] = ans.selectedOption || ans.responseText || "";
        return acc;
      }, {} as Record<string, string>);

      const submissionData = {
        exam_id: examId,
        student_id: user.id,
        answers: formattedAnswers,
        time_spent: exam.duration_minutes * 60 - timeLeft, // Tiempo que tardó el estudiante
        warnings: [], // Alineado con la función existente
        recording_url: undefined,
        screen_captures: undefined
      };

      const result = await submitExamWithMonitoring(submissionData);
      if (result.success) {
        alert(result.message || "Examen enviado con éxito!");
        router.push("/dashboard/student/exams/results"); // Redirigir a una página de resultados
      } else {
        throw new Error(result.message || "Error al enviar el examen.");
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      setError(err instanceof Error ? err.message : "Error al enviar el examen.");
      setExamFinished(false); // Permitir reintentar si hubo un error de envío
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole={user.role}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchExam} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <DashboardLayout userRole={user.role}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Cargando Examen</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cargando detalles del examen...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (ans) => ans.questionId === currentQuestion.id
  );

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <DashboardLayout userRole={user.role}>
      <div className="container mx-auto py-8">
        {!examStarted ? (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>{exam.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                **Instrucciones:** {exam.instructions || "No hay instrucciones."}
              </p>
              <p className="mb-4">
                **Duración:** {exam.duration_minutes} minutos
              </p>
              <p className="mb-4">
                **Número de preguntas:** {exam.total_questions}
              </p>
              <p className="mb-4">
                **Puntaje para aprobar:** {exam.passing_score}%
              </p>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <Button onClick={handleStartExam} className="w-full" disabled={!canStartExam}>
                Comenzar Examen
              </Button>
            </CardContent>
          </Card>
        ) : examFinished ? (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Examen Finalizado</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Gracias por completar el examen. Tus respuestas han sido enviadas.</p>
              <Button onClick={() => router.push("/dashboard/student")} className="mt-4">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </CardDescription>
              <div className="text-right text-lg font-bold">
                Tiempo restante: {formatTime(timeLeft)}
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion && (
                <div>
                  <p className="text-lg font-semibold mb-4">
                    {currentQuestion.text}
                  </p>
                  {currentQuestion.type === "multiple-choice" &&
                    currentQuestion.options && (
                      <RadioGroup
                        onValueChange={(value) =>
                          handleAnswerChange(currentQuestion.id, value, "option")
                        }
                        value={currentAnswer?.selectedOption || ""}
                      >
                        {currentQuestion.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2 mb-2"
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={`option-${option.id}`}
                            />
                            <Label htmlFor={`option-${option.id}`}>{option.text}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  {/* TODO: Añadir otros tipos de preguntas (respuesta abierta, etc.) */}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Anterior
              </Button>
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNextQuestion}>Siguiente</Button>
              ) : (
                <Button onClick={handleSubmitExam} className="bg-green-500 hover:bg-green-600">
                  Finalizar Examen
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}