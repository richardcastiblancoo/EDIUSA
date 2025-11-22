"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Exam, ExamSubmission } from "@/lib/exams"; // Asumiendo que necesitas la interfaz Exam y ExamSubmission

export default function ExamResultsPage() {
  const params = useParams();
  const courseId = params?.courseId as string | undefined;
  const examId = params?.examId as string | undefined;
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number | null>(null);

  const calculateAndSaveScore = async (
    exam: Exam,
    submission: ExamSubmission,
    userId: string
  ) => {
    let score = 0;
    let totalPoints = 0;
    const userAnswers = submission.answers || {};

    if (exam.structure) {
      for (const section of exam.structure) {
        for (const question of section.questions) {
          totalPoints += question.points;
          const submittedAnswer = userAnswers[question.id];

          if (question.question_type === 'multiple-choice' || question.question_type === 'fill-in-the-blank') {
            if (submittedAnswer && question.correct_answer) {
              let isCorrect = false;
              if (question.question_type === 'multiple-choice') {
                isCorrect = submittedAnswer === question.correct_answer;
              } else if (question.question_type === 'fill-in-the-blank') {
                isCorrect = submittedAnswer.trim().toLowerCase() === (question.correct_answer as string).trim().toLowerCase();
              }

              if (isCorrect) {
                score += question.points;
              }
            }
          } else if (question.question_type === 'essay') {
            // Las preguntas de ensayo se califican manualmente, no se suman puntos automáticamente aquí.
            // Podríamos añadir una lógica para verificar si hay una respuesta, pero no para calificarla.
            if (submittedAnswer) {
              // Opcional: Asignar un punto base por responder, o dejar en 0 para calificación manual
            }
          }
        }
      }
    }

    setCalculatedScore(score);
    setTotalPossibleScore(totalPoints);

    // Si la puntuación no ha sido guardada en la base de datos, la guardamos
    if (submission.score === null || submission.score === undefined) {
      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({ score: score })
        .eq('id', submission.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error al actualizar la puntuación en la base de datos:', updateError);
      } else {
        console.log('Puntuación actualizada en la base de datos.');
      }
    }
  };

  useEffect(() => {
    async function fetchResults() {
      if (!courseId || !examId) return;

      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Usuario no autenticado.");
          setLoading(false);
          return;
        }
        const userId = user.id;

        // Obtener los detalles del examen
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*, structure")
          .eq("id", examId)
          .single();

        if (examError) throw examError;
        setExam(examData as Exam);

        // Obtener la entrega del examen del usuario
        const { data: submissionData, error: submissionError } = await supabase
          .from("exam_submissions")
          .select("*")
          .eq("exam_id", examId)
          .eq("user_id", userId)
          .single();

        if (submissionError) throw submissionError;
        setSubmission(submissionData as ExamSubmission);

        // Calcular y guardar la puntuación
        if (examData && submissionData) {
          await calculateAndSaveScore(examData as Exam, submissionData as ExamSubmission, userId);
        }

      } catch (err: any) {
        console.error("Error fetching exam results:", err);
        setError(`No se pudieron cargar los resultados del examen: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [courseId, examId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Cargando Resultados del Examen...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold">Error: {error}</h1>
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Resultados del Examen no disponibles.</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Resultados del Examen: {exam.title}</h1>
      <p className="text-lg mb-2"><strong>Curso:</strong> {courseId}</p>
      <p className="text-lg mb-2"><strong>ID del Examen:</strong> {examId}</p>
      
      <div className="mt-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold mb-3">Tu Entrega:</h2>
        <p><strong>Fecha de Envío:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
        {calculatedScore !== null && totalPossibleScore !== null && (
          <p className="text-xl mt-4"><strong>Puntuación:</strong> {calculatedScore} / {totalPossibleScore}</p>
        )}

        <h3 className="text-xl font-semibold mt-6 mb-3">Respuestas Detalladas:</h3>
        {exam.structure && exam.structure.map((section, sectionIndex) => (
          <div key={section.id || sectionIndex} className="mb-6">
            <h4 className="text-lg font-bold mb-2">Sección: {section.title}</h4>
            {section.questions.map((question, questionIndex) => {
              const userAnswer = submission.answers?.[question.id];
              const isCorrect = question.question_type === 'multiple-choice' || question.question_type === 'fill-in-the-blank'
                ? userAnswer?.trim().toLowerCase() === (question.correct_answer as string)?.trim().toLowerCase()
                : false; // Las preguntas de ensayo no se califican automáticamente aquí

              return (
                <div key={question.id || questionIndex} className="mb-4 p-3 border rounded-md bg-white">
                  <p><strong>Pregunta {questionIndex + 1}:</strong> {question.question_text}</p>
                  <p><strong>Tu Respuesta:</strong> {userAnswer || "No respondido"}</p>
                  {question.question_type !== 'essay' && (
                    <p>
                      <strong>Respuesta Correcta:</strong> {question.correct_answer}
                    </p>
                  )}
                  {question.question_type !== 'essay' && (
                    <p className={isCorrect ? "text-green-600" : "text-red-600"}>
                      <strong>Estado:</strong> {isCorrect ? "Correcta" : "Incorrecta"}
                    </p>
                  )}
                  <p><strong>Puntos:</strong> {question.points}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}