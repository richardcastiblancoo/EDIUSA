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
import {
  getExamById,
  getExamQuestions,
  getStudentExamAttemptsCount,
} from "@/lib/exams";
import type { Exam, Question } from "@/lib/exams";

const submitExam = async (submissionData: any) => {
  console.log("Enviando examen simple:", submissionData);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: "Examen enviado con éxito." };
};

interface Answer {
  questionId: string;
  selectedOption?: string;
  responseText?: string;
}

export default function StudentExamPage() {
  const router = useRouter();
  const { examId } = useParams<{ examId: string }>();
  const { user, loading } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canStartExam, setCanStartExam] = useState(false); 
  const [examFinished, setExamFinished] = useState(false); 

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
    let timer: NodeJS.Timeout | undefined;
    if (examStarted && timeLeft > 0 && !examFinished) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && examStarted && !examFinished) {
      handleSubmitExam();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStarted, timeLeft, examFinished]);

  const fetchExam = async () => {
    setError(null);
    try {
      const fetchedExam = await getExamById(examId!);
      if (fetchedExam && user) {
        setExam(fetchedExam);
        setTimeLeft(fetchedExam.duration_minutes * 60);
        const attempts = await getStudentExamAttemptsCount(user.id, examId!);
        const isOverdue = new Date(fetchedExam.due_date) < new Date();
        const hasAttemptsLeft = attempts < fetchedExam.max_attempts;
        if (!isOverdue && hasAttemptsLeft) {
          setCanStartExam(true);
        } else {
          setCanStartExam(false);
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

  const handleSubmitExam = async () => {
    if (!exam || !user || !examId || examFinished) return;
    setExamFinished(true);
    setError(null);
    try {
      const formattedAnswers = answers.reduce((acc, ans) => {
        acc[ans.questionId] = ans.selectedOption || ans.responseText || "";
        return acc;
      }, {} as Record<string, string>);
      const submissionData = {
        exam_id: examId,
        student_id: user.id,
        answers: formattedAnswers,
        time_spent: exam.duration_minutes * 60 - timeLeft,
      };

      const result = await submitExam(submissionData);
      if (result.success) {
        router.push("/dashboard/student/exams/results");
      } else {
        throw new Error(result.message || "Error al enviar el examen.");
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      setError(
        err instanceof Error ? err.message : "Error al enviar el examen."
      );
      setExamFinished(false); 
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (ans) => ans.questionId === currentQuestion?.id
  );

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading || !user || !examId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole={user.role}>
        <div className="text-center p-8">
          <h2 className="text-xl font-bold text-red-600">
            Error al cargar el examen
          </h2>
          <p className="text-red-500 mt-2">{error}</p>
          <Button onClick={fetchExam} className="mt-4">
            Reintentar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando detalles del examen...
      </div>
    );
  }

  return (
    <DashboardLayout userRole={user.role}>
      <div className="container mx-auto py-8">
        {!examStarted ? (
          // Vista de Introducción al Examen (Limpia)
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="bg-blue-50 p-6 border-b">
              <CardTitle className="text-3xl text-blue-700">
                {exam.title}
              </CardTitle>
              <CardDescription className="text-lg">
                {exam.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Detalles y Reglas</h3>
              <p className="mb-2">
                <span className="font-medium">Duración:</span>{" "}
                {exam.duration_minutes} minutos
              </p>
              <p className="mb-2">
                <span className="font-medium">Preguntas:</span>{" "}
                {questions.length}
              </p>
              <p className="mb-4">
                <span className="font-medium">Instrucciones:</span>{" "}
                {exam.instructions ||
                  "Siga las instrucciones en cada pregunta."}
              </p>

              <Button
                onClick={handleStartExam}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                disabled={!canStartExam}
              >
                Comenzar Examen Ahora
              </Button>
              {!canStartExam && (
                <p className="text-red-500 text-sm mt-3">
                  No puede iniciar: Ya caducó o agotó sus intentos.
                </p>
              )}
            </CardContent>
          </Card>
        ) : examFinished ? (
          // Vista de Examen Finalizado
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="bg-green-50 p-6">
              <CardTitle className="text-3xl text-green-700">
                ✅ Examen Finalizado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-lg">
                Tus respuestas han sido enviadas correctamente. Te redirigiremos
                a los resultados.
              </p>
              <Button
                onClick={() => router.push("/dashboard/student")}
                className="mt-6"
              >
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Vista de Preguntas Activas
          <Card className="w-full max-w-3xl mx-auto shadow-2xl border-t-4 border-blue-500">
            <CardHeader className="flex flex-row justify-between items-center p-6 bg-gray-50 border-b">
              <div>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                <CardDescription className="text-md">
                  Pregunta {currentQuestionIndex + 1} de {questions.length}
                </CardDescription>
              </div>
              <div
                className={`text-xl font-extrabold px-4 py-2 rounded-full ${
                  timeLeft < 60
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                ⏳ {formatTime(timeLeft)}
              </div>
            </CardHeader>
            <CardContent className="p-6 min-h-[200px]">
              {currentQuestion && (
                <div>
                  <p className="text-xl font-bold mb-6 text-gray-800">
                    {currentQuestion.text}
                  </p>

                  {/* Manejo de Preguntas de Opción Múltiple */}
                  {currentQuestion.type === "multiple-choice" &&
                    currentQuestion.options && (
                      <RadioGroup
                        onValueChange={(value) =>
                          handleAnswerChange(
                            currentQuestion.id,
                            value,
                            "option"
                          )
                        }
                        value={currentAnswer?.selectedOption || ""}
                      >
                        {currentQuestion.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-3 mb-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={`option-${option.id}`}
                            />
                            <Label
                              htmlFor={`option-${option.id}`}
                              className="text-lg cursor-pointer"
                            >
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  {/* TODO: Implementar tipos de pregunta adicionales (respuesta abierta, etc.) */}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between p-6 border-t bg-gray-50">
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                ← Anterior
              </Button>
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                >
                  Siguiente →
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitExam}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  disabled={examFinished}
                >
                  Finalizar Examen y Enviar
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
