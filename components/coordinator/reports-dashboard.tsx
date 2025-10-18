"use client";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Loader2,
  RefreshCw,
  CheckCircle,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { searchStudents, type Student } from "@/lib/students";

interface LessonReport {
  lessonName: string;
  date: string;
  attendance: "Presente" | "Ausente" | "Tarde";
  notes: number | null;
}
interface ExamReport {
  title: string;
  date: string;
  score?: number | null;
  attendance: "Presente" | "Ausente";
}
interface CourseReport {
  courseId: string;
  courseName: string;
  lessons: LessonReport[];
  teacher?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  exams?: ExamReport[];
}
interface StudentReportData {
  studentName: string;
  studentId: string;
  overallAvgNotes: number;
  overallAttendanceRate: number;
  courses: CourseReport[];
}
interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: "coordinator";
  created_at: string;
}
interface TeacherInfo {
  id: string;
  name: string;
  email?: string;
  assignedCourses: number;
}
const emptyStudentData: StudentReportData = {
  studentName: "",
  studentId: "",
  overallAvgNotes: 0,
  overallAttendanceRate: 0,
  courses: [],
};
export default function StudentReportDashboard() {
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  useEffect(() => {
    fetchCoordinator();
  }, []);

  useEffect(() => {
    if (studentQuery.trim() === "") {
      setReportData(null);
      setSelectedStudent(null);
      setStudentResults([]);
    }
  }, [studentQuery]);

  useEffect(() => {
    let active = true;
    const term = studentQuery.trim();
    if (term.length < 2) {
      setStudentResults([]);
      return;
    }
    setSearchingStudents(true);
    const search = async () => {
      try {
        const results = await searchStudents(term);
        if (active) setStudentResults(results);
      } catch (err) {
        console.error("Error buscando estudiantes:", err);
      } finally {
        if (active) setSearchingStudents(false);
      }
    };
    search();
    return () => {
      active = false;
    };
  }, [studentQuery]);

  const handleSelectStudent = async (student: Student | null) => {
    if (!student) {
      setReportData(null);
      setSelectedStudent(null);
      return;
    }
    setLoading(true);
    try {
      setSelectedStudent(student);
      const data = await buildStudentReportData(student);
      const processed = calculateStudentStats(data);
      setReportData(processed);
    } catch (error) {
      console.error("Error cargando datos del estudiante:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del estudiante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildStudentReportData = async (
    student: Student
  ): Promise<StudentReportData> => {
    const { data: enrollments, error: enrErr } = await supabase
      .from("enrollments")
      .select("id, course:courses(id, name, teacher_id)")
      .eq("student_id", student.id);
    if (enrErr) {
      throw enrErr;
    }
    const courses: CourseReport[] = await Promise.all(
      (enrollments || []).map(async (enr: any) => {
        const courseId = enr.course_id ?? enr.course?.id;
        const courseName = enr.courses?.name || enr.course?.name || "Curso";

        const [lessonsRes, attendanceRes, gradesRes] = await Promise.all([
          supabase
            .from("lessons")
            .select("id, title, name, created_at, scheduled_date")
            .eq("course_id", courseId)
            .order("created_at", { ascending: true }),
          supabase
            .from("attendance")
            .select("lesson_id, status")
            .eq("enrollment_id", enr.id),
          supabase
            .from("grades")
            .select("lesson_id, score")
            .eq("enrollment_id", enr.id),
        ]);
        const lessonsData = lessonsRes.data || [];
        const attendanceData = attendanceRes.data || [];
        const gradesData = gradesRes.data || [];
        const attendanceMap = new Map(
          attendanceData.map((r: any) => [r.lesson_id, r.status])
        );
        const gradesMap = new Map(
          gradesData.map((r: any) => [r.lesson_id, r.score])
        );
        const lessons: LessonReport[] = lessonsData.map((l: any) => ({
          lessonName: l.title || l.name || `Lección ${l.id}`,
          date: l.scheduled_date || l.created_at,
          attendance:
            (attendanceMap.get(l.id) as LessonReport["attendance"]) || "Ausente",
          notes:
            typeof gradesMap.get(l.id) === "number"
              ? (gradesMap.get(l.id) as number)
              : null,
        }));
        const { data: examsData } = await supabase
          .from("exams")
          .select("id, title, due_date, created_at, is_active")
          .eq("course_id", courseId)
          .eq("is_active", true);
        const examIds = (examsData || []).map((e: any) => e.id);
        let submissionsMap = new Map<string, number | null>();
        if (examIds.length > 0) {
          const { data: subsData } = await supabase
            .from("exam_submissions")
            .select("exam_id, score")
            .eq("student_id", student.id)
            .in("exam_id", examIds);
          submissionsMap = new Map(
            (subsData || []).map((s: any) => [
              s.exam_id,
              typeof s.score === "number" ? s.score : null,
            ])
          );
        }
        const exams: ExamReport[] = (examsData || []).map((e: any) => ({
          title: e.title,
          date: e.due_date || e.created_at,
          score: submissionsMap.get(e.id) ?? null,
          attendance: submissionsMap.has(e.id) ? "Presente" : "Ausente",
        }));
        return {
          courseId,
          courseName,
          lessons,
          exams,
        };
      })
    );
    return {
      studentName: student.name,
      studentId: student.documentId,
      overallAvgNotes: 0,
      overallAttendanceRate: 0,
      courses,
    };
  };

  const fetchCoordinator = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "coordinator")
        .single();
      if (error) throw error;
      setCoordinator(data);
    } catch (error) {
      console.error("Error fetching coordinator:", error);
    }
  };

  const fetchTeacherInfo = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*, teacher:users!inner(id, name, email)")
        .eq("id", courseId)
        .single();
      if (error) throw error;
      if (data && data.teacher) {
        setTeacherInfo({
          id: data.teacher.id,
          name: data.teacher.name,
          email: data.teacher.email,
          assignedCourses: 1,
        });
      } else {
        setTeacherInfo(null);
      }
    } catch (error) {
      console.error("Error fetching teacher info:", error);
      setTeacherInfo(null);
    }
  };

  const getCourseStats = (course: CourseReport) => {
    let lessonNotesSum = 0;
    let lessonNotesCount = 0;
    let totalAttendance = 0;
    let totalClasses = 0;

    course.lessons.forEach((lesson) => {
      if (typeof lesson.notes === "number") {
        lessonNotesSum += lesson.notes;
        lessonNotesCount++;
      }
      totalClasses++;
      if (lesson.attendance === "Presente") {
        totalAttendance += 1;
      } else if (lesson.attendance === "Tarde") {
        totalAttendance += 0.5;
      }
    });
    const examsWithScore = (course.exams || []).filter(
      (exam) => typeof exam.score === "number"
    );
    const totalExamScore = examsWithScore.reduce(
      (sum, exam) => sum + (exam.score || 0),
      0
    );
    const avgExamNotes =
      examsWithScore.length > 0 ? totalExamScore / examsWithScore.length : 0;
    const avgLessonNotes = lessonNotesCount > 0 ? lessonNotesSum / lessonNotesCount : 0;
    const allScores = [
      ...course.lessons.filter(l => typeof l.notes === "number").map(l => l.notes!),
      ...examsWithScore.map(e => e.score!)
    ];
    const overallAvgNotes = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
    return {
      avgLessonNotes,
      avgExamNotes,
      attendanceRate: totalClasses > 0 ? (totalAttendance / totalClasses) * 100 : 0,
      overallAvgNotes
    };
  };

  const calculateStudentStats = (data: StudentReportData): StudentReportData => {
    let allLessonScores: number[] = [];
    let allExamScores: number[] = [];
    let totalAttendance = 0;
    let totalClasses = 0;
    data.courses.forEach((course) => {
      course.lessons.forEach(lesson => {
        if (typeof lesson.notes === "number") {
          allLessonScores.push(lesson.notes);
        }
        totalClasses++;
        if (lesson.attendance === "Presente") {
          totalAttendance += 1;
        } else if (lesson.attendance === "Tarde") {
          totalAttendance += 0.5;
        }
      });
      course.exams?.forEach(exam => {
        if (typeof exam.score === "number") {
          allExamScores.push(exam.score);
        }
      });
    });
    const allScores = [...allLessonScores, ...allExamScores];
    const overallAvgNotes = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
    const overallAttendanceRate = totalClasses > 0 ? (totalAttendance / totalClasses) * 100 : 0;
    return {
      ...data,
      overallAvgNotes,
      overallAttendanceRate,
    };
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`boletin-${reportData?.studentName || "export"}.pdf`);
      toast({
        title: "Exportado",
        description: "El boletín ha sido exportado como PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el boletín como PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "No hay un estudiante seleccionado para actualizar",
        variant: "destructive",
      });
      return;
    }
    setRefreshing(true);
    try {
      await handleSelectStudent(selectedStudent);
      toast({
        title: "Datos actualizados",
        description: "El boletín ha sido actualizado con los últimos datos",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el boletín",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const showLoader = loading && selectedStudent;
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando reporte del estudiante...</span>
      </div>
    );
  }

  const currentReportData = reportData || emptyStudentData;

  // Template helpers
  const passed = currentReportData.overallAvgNotes >= 60; // adjustable pass threshold
  const fullName = currentReportData.studentName;
  const studentId = currentReportData.studentId;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boletín Educativo</h1>
          <p className="text-sm text-muted-foreground">Informe resumido del estudiante</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-64 md:w-[420px]">
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Buscar estudiante por cédula o nombre"
              className="w-full"
            />
            {studentQuery && (
              <div className="absolute left-0 right-0 mt-1 z-50">
                <div className="border rounded-md bg-white shadow-sm max-h-60 overflow-auto">
                  {searchingStudents ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando estudiantes...
                    </div>
                  ) : studentResults.length > 0 ? (
                    studentResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStudentQuery("");
                          handleSelectStudent(s);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.documentId}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Sin resultados</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button onClick={handleExportPDF} disabled={exporting || !reportData}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Exportar PDF
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing || !reportData} variant="outline">
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
        </div>
      </div>

      {/* If no data */}
      {!reportData ? (
        <Card className="text-center p-8">
          <CardHeader className="items-center">
            <UserCheck className="w-12 h-12 text-muted-foreground" />
            <CardTitle>Selecciona un estudiante</CardTitle>
            <CardDescription>Usa el buscador para generar el boletín.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div ref={reportRef} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Top summary (certificate-like) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-muted-foreground">ID: <span className="font-medium">{studentId}</span></p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <div className="flex items-center justify-end space-x-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Nota Final</div>
                  <div className="text-3xl font-bold">{currentReportData.overallAvgNotes.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Asistencia</div>
                  <div className="text-3xl font-bold">{currentReportData.overallAttendanceRate.toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Estado</div>
                  <Badge variant={passed ? "default" : "destructive"} className="px-4 py-2">
                    {passed ? "Aprobado" : "Reprobado"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Courses table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Cursos</h3>
            {currentReportData.courses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Prom. Curso</TableHead>
                    <TableHead>Asistencia</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReportData.courses.map((course) => {
                    const stats = getCourseStats(course);
                    const coursePassed = stats.overallAvgNotes >= 60;
                    return (
                      <TableRow key={course.courseId}>
                        <TableCell>{course.courseName}</TableCell>
                        <TableCell>{stats.overallAvgNotes.toFixed(1)}</TableCell>
                        <TableCell>{stats.attendanceRate.toFixed(0)}%</TableCell>
                        <TableCell>
                          <Badge variant={coursePassed ? "default" : "destructive"}>
                            {coursePassed ? "Aprobado" : "Reprobado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No hay cursos registrados para este estudiante.</div>
            )}
          </div>

          {/* Detailed: small breakdown per course (lessons + exams) */}
          {currentReportData.courses.map((course) => (
            <Card key={course.courseId} className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">{course.courseName}</CardTitle>
                <CardDescription>
                  Promedio: {getCourseStats(course).overallAvgNotes.toFixed(1)} • Asistencia: {getCourseStats(course).attendanceRate.toFixed(0)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Lecciones</h4>
                    {course.lessons.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lección</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Asistencia</TableHead>
                            <TableHead>Nota</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {course.lessons.map((l, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{l.lessonName}</TableCell>
                              <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={l.attendance === "Presente" ? "default" : l.attendance === "Tarde" ? "secondary" : "destructive"}>
                                  {l.attendance}
                                </Badge>
                              </TableCell>
                              <TableCell>{typeof l.notes === "number" ? l.notes : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sin lecciones registradas.</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Exámenes</h4>
                    {course.exams && course.exams.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Examen</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Asistencia</TableHead>
                            <TableHead>Nota</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {course.exams.map((e, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{e.title}</TableCell>
                              <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={e.attendance === "Presente" ? "default" : "destructive"}>
                                  {e.attendance}
                                </Badge>
                              </TableCell>
                              <TableCell>{typeof e.score === "number" ? e.score : "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sin exámenes registrados.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Footer with coordinator info */}
          {coordinator && (
            <div className="mt-6 border-t pt-4 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Coordinador: {coordinator.name}</div>
                  <div>{coordinator.email}</div>
                </div>
                <div className="text-right">Documento generado: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
