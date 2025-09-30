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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { getStudentGrades } from "@/lib/students";
import { supabase } from "@/lib/supabase";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Definición de tipo para la última calificación
interface LastGradeRecord {
    id: string;
    score: number;
    course_name: string;
    type: 'Examen' | 'Lección'; 
    title: string; 
    created_at: string;
}

export default function StudentGradesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examGrades, setExamGrades] = useState<any[]>([]);
  const [lessonGrades, setLessonGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [lastGrade, setLastGrade] = useState<LastGradeRecord | null>(null);
  
  // CONSTANTE DE APROBACIÓN: 3.0 para la escala 0-5
  const MIN_PASS_SCORE = 3.0; 

  // Función para Insignias de Calificaciones (RANGO 0-5)
  const getScoreBadge = (score: number) => {
    if (score >= 4.5)
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 4.0)
      return <Badge className="bg-blue-100 text-blue-800">Muy Bien</Badge>;
    if (score >= 3.0)
      return <Badge className="bg-yellow-100 text-yellow-800">Aprobado</Badge>;
    return <Badge className="bg-red-100 text-red-800">No Aprobado</Badge>;
  };
  

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setLessonGrades([]);

        // Obtener las inscripciones del estudiante
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("id, course:courses(id, name)")
          .eq("student_id", user.id);

        if (enrollmentsError) throw enrollmentsError;

        if (!enrollments || enrollments.length === 0) {
          setExamGrades([]);
          setLessonGrades([]);
          return;
        }
        
        const allRecords: LastGradeRecord[] = [];

        // 1. Obtener todas las calificaciones de lecciones (RANGO 0-5)
        const allLessonGrades = [];
        for (const enrollment of enrollments) {
          const grades = await getStudentGrades(enrollment.id);
          const formattedLessonGrades = grades.map((grade) => ({
            id: grade.id,
            score: grade.score,
            course_name: enrollment.course.name,
            created_at: grade.created_at,
            time: new Date(grade.created_at).toLocaleTimeString(),
            title: "Calificación de Lección",
            type: 'Lección' as const,
          }));
          allLessonGrades.push(...formattedLessonGrades);
        }

        const uniqueLessonGrades = allLessonGrades
          .filter(
            (grade, index, self) =>
              index === self.findIndex((g) => g.id === grade.id)
          );

        setLessonGrades(uniqueLessonGrades);
        allRecords.push(...uniqueLessonGrades);


        // 2. Obtener los exámenes y sus calificaciones (RANGO 0-5)
        const { data: examSubmissions, error: submissionsError } = await supabase
          .from("exam_submissions")
          .select(
            `
            id,
            score,
            submitted_at,
            exam:exams(id, title, course_id)
          `
          )
          .eq("student_id", user.id)
          .order("submitted_at", { ascending: false });

        if (submissionsError) throw submissionsError;

        // Formatear los datos de exámenes
        const formattedExamGrades = examSubmissions.map((submission) => {
          const course = enrollments.find(
            (e) => e.course.id === submission.exam.course_id
          );
          return {
            id: submission.id,
            score: submission.score, 
            course_name: course?.course?.name || "Curso sin nombre",
            created_at: submission.submitted_at, 
            time: new Date(submission.submitted_at).toLocaleTimeString(),
            title: submission.exam.title,
            type: 'Examen' as const,
          };
        });

        setExamGrades(formattedExamGrades);
        allRecords.push(...formattedExamGrades);
        
        
        // Lógica: Encontrar el registro más reciente y mostrar la alerta
        if (allRecords.length > 0) {
            const sortedRecords = allRecords.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const latest = sortedRecords[0];
            setLastGrade(latest);
            
            // Mostrar un toast discreto
            toast({
                title: `${latest.type} publicada`,
                description: `Has obtenido ${parseFloat(latest.score).toFixed(1)} en el registro de ${latest.title}.`,
                variant: latest.score >= MIN_PASS_SCORE ? "default" : "destructive",
            });
        }
        
      } catch (error) {
        console.error("Error al cargar calificaciones:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus calificaciones",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [user?.id, toast]);

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calificaciones</h2>
          <p className="text-muted-foreground">
            Consulta tus calificaciones de exámenes y lecciones (Escala: 0-5).
          </p>
        </div>

        {/* ALERTA UNIFICADA */}
        {lastGrade && (
          <Alert className={lastGrade.score >= MIN_PASS_SCORE ? "bg-green-50" : "bg-red-50"}>
            <AlertTitle>Última Calificación ({lastGrade.type})</AlertTitle>
            <AlertDescription>
              {/* ⭐️ CAMBIO APLICADO: Eliminados los asteriscos ** */}
              Obtuviste <span className="font-bold">{parseFloat(lastGrade.score).toFixed(1)}</span> en el registro <span className="font-bold">{lastGrade.title}</span> del curso {lastGrade.course_name}.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumen de calificaciones</CardTitle>
            <CardDescription>
              Todas las calificaciones se presentan en una escala de 0 a 5.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Cargando calificaciones...
              </p>
            ) : (
              <Tabs defaultValue="exams">
                <TabsList>
                  <TabsTrigger value="exams">Exámenes</TabsTrigger>
                  <TabsTrigger value="lessons">Lecciones</TabsTrigger>
                </TabsList>
                {/* Pestaña de Exámenes (0-5) */}
                <TabsContent value="exams">
                  {examGrades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tienes calificaciones de exámenes registradas.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Examen</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Calificación (0-5)</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examGrades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>{grade.title}</TableCell>
                            <TableCell>{grade.course_name}</TableCell>
                            <TableCell className="font-bold text-lg">
                              {parseFloat(grade.score).toFixed(1)} 
                            </TableCell>
                            <TableCell>
                              {getScoreBadge(grade.score)} 
                            </TableCell>
                            <TableCell>{new Date(grade.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{grade.time}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                
                {/* Pestaña de Lecciones (0-5) */}
                <TabsContent value="lessons">
                  {lessonGrades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tienes calificaciones de lecciones registradas.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Curso</TableHead>
                          <TableHead>Calificación (0-5)</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lessonGrades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>{grade.course_name}</TableCell>
                            <TableCell className="font-bold text-lg">
                              {parseFloat(grade.score).toFixed(1)}
                            </TableCell> 
                            <TableCell>
                              {getScoreBadge(grade.score)} 
                            </TableCell>
                            <TableCell>{new Date(grade.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{grade.time}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}