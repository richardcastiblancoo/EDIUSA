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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator"; // Asumiendo que tienes Separator

interface LastGradeRecord {
  id: string;
  score: number;
  course_name: string;
  type: "Examen" | "Lección";
  title: string;
  created_at: string;
}

interface GradeRecord {
  id: string;
  score: number;
  course_name: string;
  created_at: string;
  time: string;
  title: string;
  type: "Examen" | "Lección";
}

export default function StudentGradesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examGrades, setExamGrades] = useState<GradeRecord[]>([]); // Usando GradeRecord
  const [lessonGrades, setLessonGrades] = useState<GradeRecord[]>([]); // Usando GradeRecord
  const [loading, setLoading] = useState(true);
  const [lastGrade, setLastGrade] = useState<LastGradeRecord | null>(null);
  const MIN_PASS_SCORE = 3.0;

  // Función para Insignias de Calificaciones (RANGO 0-5)
  const getScoreBadge = (score: number, isBig: boolean = false) => {
    const baseClasses = isBig ? "text-base px-3 py-1" : "";
    if (score >= 4.5)
      return <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100`}>Excelente</Badge>;
    if (score >= 4.0)
      return <Badge className={`${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-100`}>Muy Bien</Badge>;
    if (score >= 3.0)
      return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100`}>Aprobado</Badge>;
    return <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100`}>No Aprobado</Badge>;
  };
  
  // Función para normalizar y mostrar la calificación de componente o guion
  const getScoreDisplay = (score: number | null) => 
    score !== null ? score.toFixed(1) : "—";


  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        // ... (Tu lógica de fetching de enrollments y grades, sin cambios sustanciales)
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
        const allLessonGrades: GradeRecord[] = [];

        for (const enrollment of enrollments) {
          const grades = await getStudentGrades(enrollment.id);
          const formattedLessonGrades: GradeRecord[] = grades.map((grade) => ({
            id: grade.id,
            score: grade.score,
            course_name: enrollment.course.name,
            created_at: grade.created_at,
            time: new Date(grade.created_at).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' }),
            title: "Calificación de Lección",
            type: "Lección" as const,
          }));
          allLessonGrades.push(...formattedLessonGrades);
        }

        const uniqueLessonGrades: GradeRecord[] = allLessonGrades.filter(
          (grade, index, self) =>
            index === self.findIndex((g) => g.id === grade.id)
        );
        setLessonGrades(uniqueLessonGrades);
        allRecords.push(...uniqueLessonGrades.map(g => ({...g, score: g.score} as LastGradeRecord)));

        // 2. Obtener los exámenes y sus calificaciones (RANGO 0-5)
        const { data: examSubmissions, error: submissionsError } =
          await supabase
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

        const formattedExamGrades: GradeRecord[] = examSubmissions.map((submission) => {
          const course = enrollments.find(
            (e) => e.course.id === submission.exam.course_id
          );
          return {
            id: submission.id,
            score: submission.score,
            course_name: course?.course?.name || "Curso sin nombre",
            created_at: submission.submitted_at,
            time: new Date(submission.submitted_at).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' }),
            title: submission.exam.title,
            type: "Examen" as const,
          };
        });

        setExamGrades(formattedExamGrades);
        allRecords.push(...formattedExamGrades.map(g => ({...g, score: g.score} as LastGradeRecord)));

        if (allRecords.length > 0) {
          const sortedRecords = allRecords.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          const latest = sortedRecords[0];
          setLastGrade(latest);
          // Omitimos el toast de la carga inicial para evitar spam,
          // se deja solo el Alert superior.
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

  // Cálculo de promedio y componentes del examen final (sin cambios)
  const FINAL_COMPONENTS = ["Oral", "Listening", "Use of Language", "Reading", "Writing"];
  const finalComponentRecords = FINAL_COMPONENTS.map(label => {
    const record = examGrades.find(g =>
      String(g.title || "").toLowerCase().includes(label.toLowerCase())
    );
    return {
      label,
      score: typeof record?.score === "number" ? record.score : null,
      title: record?.title || "",
      created_at: record?.created_at || null,
      time: record?.time || "",
    };
  });

  const availableScores = finalComponentRecords
    .map(r => r.score)
    .filter((s): s is number => typeof s === "number");

  const finalExamAverage =
    availableScores.length > 0
      ? availableScores.reduce((sum, s) => sum + s, 0) / availableScores.length
      : null;

  const latestExam =
    examGrades.length > 0
      ? [...examGrades].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;

  const examGroupName = (() => {
    const labels = FINAL_COMPONENTS;
    const titles = finalComponentRecords
      .map(r => r.title)
      .filter(t => t && t.length > 0);
    const cleaned = titles
      .map(t => {
        let s = t;
        labels.forEach(l => {
          s = s.replace(new RegExp(l, "i"), "").trim();
        });
        return s;
      })
      .filter(s => s.length > 0);
    if (cleaned.length > 0) {
      const freq = new Map<string, number>();
      cleaned.forEach(s => freq.set(s, (freq.get(s) || 0) + 1));
      const best = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return best || latestExam?.title || "";
    }
    return latestExam?.title || "";
  })();
  
  // ⭐️ Componente de Tarjeta Móvil para mostrar un solo componente del examen.
  const MobileExamComponentCard = ({ label, score, time, date }: { label: string; score: number | null; time: string; date: string | null; }) => (
    <div className="flex justify-between py-2 border-b last:border-b-0">
        <div className="flex flex-col">
            <span className="font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{date ? `Fecha: ${date}` : 'Sin fecha'}</span>
        </div>
        <div className="text-right">
            <span className={`text-xl font-bold ${score !== null && score < MIN_PASS_SCORE ? 'text-red-600' : 'text-primary'}`}>
                {getScoreDisplay(score)}
            </span>
            {score !== null && (
                <div className="mt-1">
                    {getScoreBadge(score)}
                </div>
            )}
        </div>
    </div>
  );
  
  // ⭐️ Componente de Tarjeta Móvil para la Lección (más compacto que el Acordeón simple)
  const MobileLessonCard = ({ grade }: { grade: GradeRecord }) => (
    <Card className="shadow-sm">
        <CardContent className="p-3 flex justify-between items-center">
            <div className="space-y-1">
                <p className="text-sm font-semibold leading-none">{grade.course_name}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(grade.created_at).toLocaleDateString("es-CO")} a las {grade.time}
                </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
                <span className="text-xl font-extrabold">{grade.score.toFixed(1)}</span>
                {getScoreBadge(grade.score)}
            </div>
        </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-6"> {/* ⭐️ Max-width para un mejor look en desktop */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calificaciones</h2>
          <p className="text-muted-foreground">
            Consulta tus calificaciones de exámenes y lecciones (Escala: 0-5).
          </p>
        </div>

        {/* ALERTA UNIFICADA */}
        {lastGrade && (
          <Alert
            className={
              lastGrade.score >= MIN_PASS_SCORE ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }
          >
            <AlertTitle>Última Calificación ({lastGrade.type})</AlertTitle>
            <AlertDescription>
              Obtuviste{" "}
              <span className="font-bold">
                {parseFloat(lastGrade.score.toString()).toFixed(1)}
              </span>{" "}
              en el registro{" "}
              <span className="font-bold">{lastGrade.title}</span> del curso{" "}
              {lastGrade.course_name}.
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
              <p className="text-sm text-muted-foreground text-center py-8">
                Cargando calificaciones...
              </p>
            ) : (
              <Tabs defaultValue="exams">
                {/* ⭐️ TabsList: Adaptado para pantalla completa */}
                <TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent gap-1">
                  <TabsTrigger value="exams" className="data-[state=active]:shadow-sm rounded-md h-10 border data-[state=active]:border-primary/50">Exámenes</TabsTrigger>
                  <TabsTrigger value="lessons" className="data-[state=active]:shadow-sm rounded-md h-10 border data-[state=active]:border-primary/50">Lecciones</TabsTrigger>
                  <TabsTrigger value="final" className="data-[state=active]:shadow-sm rounded-md h-10 border data-[state=active]:border-primary/50">FINAL</TabsTrigger>
                </TabsList>

                {/* ======================================= */}
                {/* ⭐️ Exámenes: Vista Móvil (Tarjetas apiladas) */}
                {/* ======================================= */}
                <TabsContent value="exams" className="mt-4 md:hidden">
                    <h3 className="text-lg font-semibold mb-3">{examGroupName || "Examen Final"}</h3>
                    <div className="space-y-2 border rounded-lg p-3">
                        {finalComponentRecords.map((record, index) => (
                            <MobileExamComponentCard 
                                key={index}
                                label={record.label}
                                score={record.score}
                                time={record.time}
                                date={record.created_at ? new Date(record.created_at).toLocaleDateString("es-CO") : null}
                            />
                        ))}
                    </div>
                </TabsContent>

                {/* ======================================= */}
                {/* ⭐️ Exámenes: Vista Escritorio (Tabla) */}
                {/* ======================================= */}
                <TabsContent value="exams" className="mt-4 hidden md:block">
                  {examGrades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tienes calificaciones de exámenes registradas.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Examen</TableHead>
                            <TableHead className="min-w-[70px] text-center">Oral</TableHead>
                            <TableHead className="min-w-[70px] text-center">Listening</TableHead>
                            <TableHead className="min-w-[70px] text-center">Use of Language</TableHead>
                            <TableHead className="min-w-[70px] text-center">Reading</TableHead>
                            <TableHead className="min-w-[70px] text-center">Writing</TableHead>
                            <TableHead className="min-w-[100px]">Fecha</TableHead>
                            <TableHead className="min-w-[70px]">Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-semibold whitespace-nowrap">{examGroupName || "—"}</TableCell>
                            <TableCell className="font-bold text-lg text-center whitespace-nowrap">{getScoreDisplay(finalComponentRecords[0].score)}</TableCell>
                            <TableCell className="font-bold text-lg text-center whitespace-nowrap">{getScoreDisplay(finalComponentRecords[1].score)}</TableCell>
                            <TableCell className="font-bold text-lg text-center whitespace-nowrap">{getScoreDisplay(finalComponentRecords[2].score)}</TableCell>
                            <TableCell className="font-bold text-lg text-center whitespace-nowrap">{getScoreDisplay(finalComponentRecords[3].score)}</TableCell>
                            <TableCell className="font-bold text-lg text-center whitespace-nowrap">{getScoreDisplay(finalComponentRecords[4].score)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {latestExam ? new Date(latestExam.created_at).toLocaleDateString("es-CO") : ""}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{latestExam?.time || ""}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

              
                <TabsContent value="lessons" className="mt-4 md:hidden">
                    {lessonGrades.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tienes calificaciones de lecciones registradas.</p>
                    ) : (
                        <div className="space-y-3">
                            {lessonGrades.map((grade) => (
                                <MobileLessonCard key={grade.id} grade={grade} />
                            ))}
                        </div>
                    )}
                </TabsContent>


             
                <TabsContent value="lessons" className="mt-4 hidden md:block">
                  {lessonGrades.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tienes calificaciones de lecciones registradas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">Curso</TableHead>
                                    <TableHead className="min-w-[150px]">Registro</TableHead>
                                    <TableHead className="min-w-[70px] text-center">Nota</TableHead>
                                    <TableHead className="min-w-[100px]">Estado</TableHead>
                                    <TableHead className="min-w-[100px]">Fecha</TableHead>
                                    <TableHead className="min-w-[70px]">Hora</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lessonGrades.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{grade.course_name}</TableCell>
                                        <TableCell className="whitespace-nowrap">{grade.title}</TableCell>
                                        <TableCell className="font-bold text-center text-lg whitespace-nowrap">
                                            {grade.score.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{getScoreBadge(grade.score)}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {new Date(grade.created_at).toLocaleDateString("es-CO")}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{grade.time}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                  )}
                </TabsContent>

               
                <TabsContent value="final" className="mt-4">
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="text-xl font-bold">Resumen del Examen Final</h3>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="font-semibold text-sm text-muted-foreground">Estudiante</p>
                            <p className="font-medium">{user?.name || "—"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-sm text-muted-foreground">ID</p>
                            <p className="font-medium">{user?.id || "—"}</p>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center py-2">
                        <span className="font-bold text-lg">Nota Final:</span>
                        <span className="font-extrabold text-3xl text-primary">
                            {finalExamAverage !== null
                            ? finalExamAverage.toFixed(1)
                            : "—"}
                        </span>
                    </div>

                    {finalExamAverage !== null && (
                      <div className="pt-2">
                          <span className="font-semibold">Resultado:</span>
                          <span className="ml-2 inline-block">
                            {getScoreBadge(finalExamAverage, true)} {/* true para insignia más grande */}
                          </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}