"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getExamQuestions, getExamById, Exam, ExamCategory } from "@/lib/exams";
import { Question } from "@/lib/exams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Se importa useToast, no la función `toast` directamente.
import { useToast } from "@/components/ui/use-toast"; 
import { Skeleton } from "@/components/ui/skeleton";


function ExamDetailContent() {
  // Asegúrate de usar useToast() para obtener la función `toast`.
  const { toast: showToast } = useToast(); 
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId) {
        setError("No se ha proporcionado un ID de examen.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedExam = await getExamById(examId);
        if (fetchedExam) {
          setExam(fetchedExam);
        } else {
          setError("No se encontró el examen.");
          setIsLoading(false);
          return;
        }

        const fetchedQuestions = await getExamQuestions(examId);
        setQuestions(fetchedQuestions);

        if (fetchedQuestions.length === 0 && !fetchedExam) {
          setError("No se encontraron preguntas para este examen.");
        }

      } catch (err) {
        console.error("Error fetching exam details:", err);
        setError("No se pudieron cargar los detalles del examen. Inténtalo de nuevo más tarde.");
        // Usa la función de toast correctamente.
        showToast({ 
            title: "Error de carga", 
            description: "No se pudieron cargar los detalles del examen.", 
            variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamDetails();
  // showToast se incluye como dependencia ya que es parte del ámbito del componente
  // y se utiliza dentro del efecto.
  }, [examId, showToast]); 

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <Button className="mt-6" onClick={() => window.history.back()}>Volver</Button>
      </div>
    );
  }

  const examTitle = exam ? `Examen: ${exam.title}` : "Detalles del Examen";
  const examDescription = exam?.description || "Aquí se mostrarán las preguntas del examen.";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{examTitle}</h1>
      <p className="text-lg text-gray-600 mb-6">{examDescription}</p>

      {exam && (
        <div className="mb-6 text-gray-700">
          <p><strong>Categoría:</strong> {exam.category}</p>
          <p><strong>Fecha límite:</strong> {formatDate(exam.due_date)}</p>
        </div>
      )}

      {questions.length === 0 ? (
        <p>No hay preguntas disponibles para este examen.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>Pregunta {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2">{question.question_text}</p>
                {question.options && question.options.length > 0 && (
                  <div className="space-y-1">
                    {question.options.map((option, optIndex) => (
                      <p key={optIndex} className="text-sm">
                        {String.fromCharCode(65 + optIndex)}. {option}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button className="mt-6" onClick={() => window.history.back()}>Volver a Exámenes</Button>
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    // La importación de Suspense ya no está aquí, fue movida al inicio.
    <Suspense fallback={<div>Cargando detalles del examen...</div>}>
      <ExamDetailContent />
    </Suspense>
  );
}