"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Calendar } from "lucide-react";
import { getExamsByCourse, Exam } from "@/lib/exams";
import { useToast } from "@/components/ui/use-toast";

export default function StudentExamsPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [errorExams, setErrorExams] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      if (!courseId) {
        setErrorExams("No se ha proporcionado un ID de curso.");
        setIsLoadingExams(false);
        return;
      }

      setIsLoadingExams(true);
      setErrorExams(null);
      try {
        const courseExams = await getExamsByCourse(courseId);
        setExams(courseExams);
      } catch (err) {
        console.error("Error fetching exams:", err);
        setErrorExams("No se pudieron cargar los exámenes. Inténtalo de nuevo más tarde.");
        toast({
          title: "Error de carga",
          description: "No se pudieron cargar los exámenes.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingExams(false);
      }
    };

    fetchExams();
  }, [courseId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderExamsContent = () => {
    if (!courseId) {
      return (
        <p className="text-gray-700">
          Selecciona un curso desde la página de "Mis Cursos" para ver sus exámenes disponibles.
        </p>
      );
    }

    if (isLoadingExams) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (errorExams) {
      return (
        <p className="text-red-500">Error: {errorExams}</p>
      );
    }

    if (exams.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay exámenes disponibles</h3>
          <p className="text-gray-500">No se han programado exámenes para este curso aún.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{exam.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Categoría: {exam.category}</span>
              </CardDescription>
              <CardDescription className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Fecha límite: {formatDate(exam.due_date)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-gray-700 line-clamp-2">{exam.description || "Sin descripción."}</p>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Preguntas: {exam.total_questions}</span>
                <span>Duración: {exam.duration_minutes} min</span>
              </div>
              <Link href={`/dashboard/student/exam-detail?examId=${exam.id}`} passHref>
                <Button className="w-full mt-2">
                  Iniciar Examen
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Exámenes
            {courseId && <span className="text-blue-600"> para el Curso: {courseId}</span>}
          </h2>
          <Link href="/dashboard/student/courses" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Cursos
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exámenes Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {renderExamsContent()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}