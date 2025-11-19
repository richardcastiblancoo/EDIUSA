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
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  FileText,
  Award,
  Clock,
  Calendar,
  User,
  IdCard,
} from "lucide-react";

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

interface StudentProfile {
  id: string;
  document_id: string;
  name: string;
  email: string;
}

export default function StudentGradesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [examGrades, setExamGrades] = useState<GradeRecord[]>([]);
  const [lessonGrades, setLessonGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastGrade, setLastGrade] = useState<LastGradeRecord | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const MIN_PASS_SCORE = 3.0;

  const getScoreBadge = (score: number, isBig: boolean = false) => {
    const baseClasses = isBig
      ? "text-base px-4 py-2 font-semibold border"
      : "px-2.5 py-0.5 border";

    if (score >= 4.5)
      return (
        <Badge
          className={`${baseClasses} bg-gray-900 text-white hover:bg-gray-800 border-gray-900`}
        >
          {isBig ? "Excelente" : "Excelente"}
        </Badge>
      );
    if (score >= 4.0)
      return (
        <Badge
          className={`${baseClasses} bg-gray-700 text-white hover:bg-gray-600 border-gray-700`}
        >
          {isBig ? "Muy Bien" : "Muy Bien"}
        </Badge>
      );
    if (score >= 3.0)
      return (
        <Badge
          className={`${baseClasses} bg-gray-600 text-white hover:bg-gray-500 border-gray-600`}
        >
          {isBig ? "Aprobado" : "Aprobado"}
        </Badge>
      );
    return (
      <Badge
        className={`${baseClasses} bg-gray-800 text-white hover:bg-gray-700 border-gray-800`}
      >
        {isBig ? "No Aprobado" : "No Aprobado"}
      </Badge>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-gray-900 font-bold";
    if (score >= 4.0) return "text-gray-800 font-bold";
    if (score >= 3.0) return "text-gray-700 font-bold";
    return "text-gray-900 font-bold";
  };

  const getScoreDisplay = (score: number | null) =>
    score !== null ? score.toFixed(1) : "—";

  const fetchStudentProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, document_id, name, email")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // FIX: Manejo seguro del error (unknown)
      const errorToLog = error instanceof Error ? error.message : String(error);
      console.error("Error al cargar perfil del estudiante:", errorToLog);
      return null;
    }
  };

  useEffect(() => {
    const fetchGrades = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const profile = await fetchStudentProfile(user.id);
        setStudentProfile(profile);

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
          // Asume que getStudentGrades es una función externa que devuelve calificaciones
          const grades = await getStudentGrades(enrollment.id);

          const formattedLessonGrades: GradeRecord[] = grades.map((grade) => ({
            id: grade.id ?? crypto.randomUUID(),
            score: grade.score,
            course_name: enrollment.course[0]?.name || "Curso sin nombre",
            created_at: grade.created_at ?? new Date().toISOString(),
            time: new Date(grade.created_at ?? Date.now()).toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }),
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
        allRecords.push(
          ...uniqueLessonGrades.map(
            (g) => ({ ...g, score: g.score } as LastGradeRecord)
          )
        );

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

        const formattedExamGrades: GradeRecord[] = examSubmissions.map(
          (submission) => {
            const course = enrollments.find(
              (e) => e.course[0].id === submission.exam?.[0]?.course_id
            );
            return {
              id: submission.id,
              score: submission.score,
              course_name: course?.course?.[0]?.name || "Curso sin nombre",
              created_at: submission.submitted_at,
              time: new Date(submission.submitted_at).toLocaleTimeString(
                "es-CO",
                { hour: "2-digit", minute: "2-digit" }
              ),
              title: submission.exam?.[0]?.title ?? "Examen",
              type: "Examen" as const,
            };
          }
        );

        setExamGrades(formattedExamGrades);
        allRecords.push(
          ...formattedExamGrades.map(
            (g) => ({ ...g, score: g.score } as LastGradeRecord)
          )
        );

        if (allRecords.length > 0) {
          const sortedRecords = allRecords.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          const latest = sortedRecords[0];
          setLastGrade(latest);
        }
      } catch (error) {
        // FIX: Manejo seguro del error (unknown)
        const errorToLog = error instanceof Error ? error.message : String(error);
        console.error("Error al cargar calificaciones:", errorToLog);
        
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

  const FINAL_COMPONENTS = [
    "Oral",
    "Listening",
    "Use of Language",
    "Reading",
    "Writing",
  ];

  const finalComponentRecords = FINAL_COMPONENTS.map((label) => {
    const record = examGrades.find((g) =>
      String(g.title || "")
        .toLowerCase()
        .includes(label.toLowerCase())
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
    .map((r) => r.score)
    .filter((s): s is number => typeof s === "number");

  const finalExamAverage =
    availableScores.length > 0
      ? availableScores.reduce((sum, s) => sum + s, 0) / availableScores.length
      : null;

  const latestExam =
    examGrades.length > 0
      ? [...examGrades].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;

  const examGroupName = (() => {
    const labels = FINAL_COMPONENTS;
    const titles = finalComponentRecords
      .map((r) => r.title)
      .filter((t) => t && t.length > 0);

    const cleaned = titles
      .map((t) => {
        let s = t;
        labels.forEach((l) => {
          s = s.replace(new RegExp(l, "i"), "").trim();
        });
        return s;
      })
      .filter((s) => s.length > 0);

    if (cleaned.length > 0) {
      const freq = new Map<string, number>();
      cleaned.forEach((s) => freq.set(s, (freq.get(s) || 0) + 1));
      const best = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return best || latestExam?.title || "";
    }
    return latestExam?.title || "";
  })();

  const MobileExamComponentCard = ({
    label,
    score,
    time,
    date,
  }: {
    label: string;
    score: number | null;
    time: string;
    date: string | null;
  }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-gray-100">
          <FileText className="w-4 h-4 text-gray-700" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{label}</span>
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {date ? date : "Sin fecha"}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-2xl font-bold ${
            score !== null ? getScoreColor(score) : "text-gray-400"
          }`}
        >
          {getScoreDisplay(score)}
        </span>
        {score !== null && <div className="mt-1">{getScoreBadge(score)}</div>}
      </div>
    </div>
  );

  const MobileLessonCard = ({ grade }: { grade: GradeRecord }) => (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gray-100">
            <BookOpen className="w-4 h-4 text-gray-700" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {grade.course_name}
            </p>
            <p className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(grade.created_at).toLocaleDateString("es-CO")}
              <Clock className="w-3 h-3 ml-2 mr-1" />
              {grade.time}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span
            className={`text-2xl font-extrabold ${getScoreColor(grade.score)}`}
          >
            {grade.score.toFixed(1)}
          </span>
          {getScoreBadge(grade.score)}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            Mis Calificaciones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Consulta tu progreso académico y desempeño en todas las actividades
          </p>
        </div>
        {lastGrade && (
          <Alert
            className={`border-l-4 ${
              lastGrade.score >= MIN_PASS_SCORE
                ? "border-gray-800 bg-gray-50"
                : "border-gray-600 bg-gray-50"
            } shadow-sm`}
          >
            <div className="flex items-center">
              <Award
                className={`w-5 h-5 mr-3 ${
                  lastGrade.score >= MIN_PASS_SCORE
                    ? "text-gray-800"
                    : "text-gray-600"
                }`}
              />
              <div>
                <AlertTitle className="text-sm font-semibold text-gray-900">
                  Última Calificación ({lastGrade.type})
                </AlertTitle>
                <AlertDescription className="text-sm text-gray-700">
                  Obtuviste{" "}
                  <span className="font-bold text-base text-gray-900">
                    {parseFloat(lastGrade.score.toString()).toFixed(1)}
                  </span>{" "}
                  en{" "}
                  <span className="font-semibold text-gray-900">
                    {lastGrade.title}
                  </span>{" "}
                  del curso {lastGrade.course_name}.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Resumen Académico
            </CardTitle>
            <CardDescription className="text-gray-600">
              Todas las calificaciones se presentan en una escala de 0 a 5.0
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando calificaciones...</p>
              </div>
            ) : (
              <Tabs defaultValue="lessons" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <TabsTrigger
                    value="lessons"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-300 transition-all"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Lecciones
                  </TabsTrigger>
                  <TabsTrigger
                    value="exams"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-300 transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Exámenes
                  </TabsTrigger>
                  <TabsTrigger
                    value="final"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-gray-300 transition-all"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    FINAL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="lessons" className="space-y-4">
                  <div className="md:hidden space-y-3">
                    {lessonGrades.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        No tienes calificaciones de lecciones registradas.
                      </div>
                    ) : (
                      lessonGrades.map((grade) => (
                        <MobileLessonCard key={grade.id} grade={grade} />
                      ))
                    )}
                  </div>
                  <div className="hidden md:block">
                    {lessonGrades.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">
                          No tienes calificaciones de lecciones registradas.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900">
                                Curso
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900">
                                Actividad
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center">
                                Calificación
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900">
                                Estado
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900">
                                Fecha
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900">
                                Hora
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lessonGrades.map((grade) => (
                              <TableRow
                                key={grade.id}
                                className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                              >
                                <TableCell className="font-medium text-gray-900">
                                  {grade.course_name}
                                </TableCell>
                                <TableCell className="text-gray-700">
                                  {grade.title}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={`text-lg font-bold ${getScoreColor(
                                      grade.score
                                    )}`}
                                  >
                                    {grade.score.toFixed(1)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {getScoreBadge(grade.score)}
                                </TableCell>
                                <TableCell className="text-gray-700">
                                  {new Date(
                                    grade.created_at
                                  ).toLocaleDateString("es-CO")}
                                </TableCell>
                                <TableCell className="text-gray-700">
                                  {grade.time}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="exams" className="space-y-4">
                  <div className="md:hidden space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {examGroupName || "Examen Final"}
                    </h3>
                    <div className="space-y-3">
                      {finalComponentRecords.map((record, index) => (
                        <MobileExamComponentCard
                          key={index}
                          label={record.label}
                          score={record.score}
                          time={record.time}
                          date={
                            record.created_at
                              ? new Date(record.created_at).toLocaleDateString(
                                  "es-CO"
                                )
                              : null
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    {examGrades.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">
                          No tienes calificaciones de exámenes registradas.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <Table className="min-w-full">
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="font-semibold text-gray-900 min-w-[150px]">
                                Examen
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center min-w-[70px]">
                                Oral
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center min-w-[70px]">
                                Listening
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center min-w-[70px]">
                                Use of Language
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center min-w-[70px]">
                                Reading
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center min-w-[70px]">
                                Writing
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 min-w-[100px]">
                                Fecha
                              </TableHead>
                              <TableHead className="font-semibold text-gray-900 min-w-[70px]">
                                Hora
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                              <TableCell className="font-semibold text-gray-900">
                                {examGroupName || "—"}
                              </TableCell>
                              {finalComponentRecords.map((record, index) => (
                                <TableCell key={index} className="text-center">
                                  <span
                                    className={`text-lg font-bold ${
                                      record.score !== null
                                        ? getScoreColor(record.score)
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {getScoreDisplay(record.score)}
                                  </span>
                                </TableCell>
                              ))}
                              <TableCell className="text-gray-700">
                                {latestExam
                                  ? new Date(
                                      latestExam.created_at
                                    ).toLocaleDateString("es-CO")
                                  : ""}
                              </TableCell>
                              <TableCell className="text-gray-700">
                                {latestExam?.time || ""}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="final">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="text-center mb-6">
                      <Award className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Resumen del Examen Final
                      </h3>
                      <p className="text-gray-600">
                        Resultados consolidados de tu evaluación final
                      </p>
                    </div>
                    <Separator className="my-6 bg-gray-300" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <User className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Estudiante
                            </p>
                            <p className="font-medium text-gray-900">
                              {user?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                          <IdCard className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Cédula
                            </p>
                            <p className="font-medium text-gray-900">
                              {studentProfile?.document_id || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Nota Final del Examen
                        </p>
                        <div
                          className={`text-5xl font-black ${
                            finalExamAverage !== null
                              ? getScoreColor(finalExamAverage)
                              : "text-gray-400"
                          }`}
                        >
                          {finalExamAverage !== null
                            ? finalExamAverage.toFixed(1)
                            : "—"}
                        </div>
                        {finalExamAverage !== null && (
                          <div className="mt-3">
                            {getScoreBadge(finalExamAverage, true)}
                          </div>
                        )}
                      </div>
                    </div>
                    {finalExamAverage !== null && (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                        <p className="text-sm font-semibold text-gray-700">
                          {finalExamAverage >= MIN_PASS_SCORE
                            ? "¡Felicidades! Has aprobado el examen final."
                            : "Sigue practicando, puedes mejorar en el próximo intento."}
                        </p>
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
