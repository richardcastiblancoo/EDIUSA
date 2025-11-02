"use client";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  RefreshCw,
  BookOpen,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Course {
  id: string;
  name: string;
  code: string;
}

interface StudentSummary {
  studentName: string;
  studentId: string;
  photoUrl?: string;
  overallAvgNotes: number;
  overallAttendanceRate: number;
  isPassed: boolean;
}

interface CourseReportData {
  courseName: string;
  courseCode: string;
  teacherName: string;
  studentsSummary: StudentSummary[];
  courseAvgNotes: number;
  courseAvgAttendance: number;
}

interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: "coordinator";
  created_at: string;
}

const emptyCourseData: CourseReportData = {
  courseName: "",
  courseCode: "",
  teacherName: "N/A",
  studentsSummary: [],
  courseAvgNotes: 0,
  courseAvgAttendance: 0,
};

const searchCourses = async (query: string): Promise<Course[]> => {
  console.log(`Buscando cursos con query: ${query}`);
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, code")
    .ilike("name", `%${query}%`)
    .limit(5);
  if (error) {
    console.error("Error en la búsqueda de cursos:", error);
    return [];
  }
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code || "CÓDIGO N/A",
  })) as Course[];
};

export default function CourseReportDashboard() {
  const [reportData, setReportData] = useState<CourseReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseQuery, setCourseQuery] = useState("");
  const [courseResults, setCourseResults] = useState<Course[]>([]);
  const [searchingCourses, setSearchingCourses] = useState(false);
  const PASS_THRESHOLD = 2.95;

  useEffect(() => {
    fetchCoordinator();
  }, []);

  useEffect(() => {
    if (courseQuery.trim() === "") {
      setReportData(null);
      setSelectedCourse(null);
      setCourseResults([]);
    }
  }, [courseQuery]);

  useEffect(() => {
    let active = true;
    const term = courseQuery.trim();
    if (term.length < 2) {
      setCourseResults([]);
      return;
    }
    setSearchingCourses(true);
    const search = async () => {
      try {
        const results = await searchCourses(term);
        if (active) setCourseResults(results);
      } catch (err) {
        console.error("Error buscando cursos:", err);
      } finally {
        if (active) setSearchingCourses(false);
      }
    };
    const timeoutId = setTimeout(search, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [courseQuery]);

  const handleSelectCourse = async (course: Course | null) => {
    if (!course) {
      setReportData(null);
      setSelectedCourse(null);
      return;
    }
    setLoading(true);
    try {
      setSelectedCourse(course);
      const data = await buildCourseReportData(course);
      const processed = calculateCourseStats(data);
      setReportData(processed);
    } catch (error) {
      console.error("Error cargando datos del curso:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del curso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildCourseReportData = async (
    course: Course
  ): Promise<CourseReportData> => {
    const { data: courseInfo, error: courseErr } = await supabase
      .from("courses")
      .select("name, code, teacher:users(name)")
      .eq("id", course.id)
      .single();
    if (courseErr || !courseInfo) {
      throw courseErr || new Error("Curso no encontrado.");
    }
    const teacherName = Array.isArray(courseInfo.teacher)
      ? courseInfo.teacher[0]?.name || "Sin profesor asignado"
      : (courseInfo.teacher as { name?: string })?.name ||
        "Sin profesor asignado";
    const { data: enrollments, error: enrErr } = await supabase
      .from("enrollments")
      // Asumiendo que 'photo' es el campo de la URL de la imagen en la tabla 'users'
      .select("id, student:users(id, name, document_number, photo)") 
      .eq("course_id", course.id);
    if (enrErr) {
      throw enrErr;
    }
    const studentsSummary: StudentSummary[] = await Promise.all(
      (enrollments || []).map(async (enr: any) => {
        const studentId = enr.student.document_number;
        const studentName = enr.student.name;
        // Si el campo es 'photo', lo usamos
        const photoUrl = enr.student.photo as string | null; 
        
        // Datos simulados
        const overallAvgNotes = parseFloat((Math.random() * (5.0 - 1.0) + 1.0).toFixed(2));
        const overallAttendanceRate = parseFloat((Math.random() * (100 - 50) + 50).toFixed(0));
        return {
          studentName,
          studentId,
          photoUrl: photoUrl || undefined, // Usa la URL o undefined
          overallAvgNotes,
          overallAttendanceRate,
          isPassed: overallAvgNotes >= PASS_THRESHOLD,
        };
      })
    );
    return {
      courseName: courseInfo.name,
      courseCode: courseInfo.code || "N/A",
      teacherName,
      studentsSummary,
      courseAvgNotes: 0,
      courseAvgAttendance: 0,
    };
  };

  const calculateCourseStats = (data: CourseReportData): CourseReportData => {
    const totalStudents = data.studentsSummary.length;
    if (totalStudents === 0) {
      return { ...data, courseAvgNotes: 0, courseAvgAttendance: 0 };
    }
    const totalNotesSum = data.studentsSummary.reduce(
      (sum, s) => sum + s.overallAvgNotes,
      0
    );
    const totalAttendanceSum = data.studentsSummary.reduce(
      (sum, s) => sum + s.overallAttendanceRate,
      0
    );
    const courseAvgNotes = totalNotesSum / totalStudents;
    const courseAvgAttendance = totalAttendanceSum / totalStudents;
    return {
      ...data,
      courseAvgNotes: parseFloat(courseAvgNotes.toFixed(2)),
      courseAvgAttendance: parseFloat(courseAvgAttendance.toFixed(0)),
    };
  };

  const fetchCoordinator = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "coordinator")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      setCoordinator(data || null);
    } catch (error) {
      console.error("Error fetching coordinator:", error);
      setCoordinator(null);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let position = 0;
      let heightLeft = pdfHeight;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= 297;
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= 297;
      }
      pdf.save(`reporte-curso-${reportData?.courseCode || "export"}.pdf`);
      toast({
        title: "Exportado",
        description: "El reporte ha sido exportado como PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte como PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedCourse) {
      toast({
        title: "Error",
        description: "No hay un curso seleccionado para actualizar",
        variant: "destructive",
      });
      return;
    }
    setRefreshing(true);
    try {
      await handleSelectCourse(selectedCourse);
      toast({
        title: "Datos actualizados",
        description: "El reporte ha sido actualizado con los últimos datos",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const showLoader = loading && selectedCourse;
  if (showLoader) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-800">
          Cargando reporte del curso...
        </span>
      </div>
    );
  }

  const currentReportData = reportData || emptyCourseData;
  const totalStudents = currentReportData.studentsSummary.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      {/* 🧭 Header y Controles */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Reporte de Curso
          </h1>
          <p className="text-sm text-gray-600">
            Informe resumido del desempeño de los estudiantes
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 w-auto items-center md:items-start">
          {/* Campo de búsqueda de curso */}
          <div className="relative w-auto max-w-xs md:w-64">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                value={courseQuery}
                onChange={(e) => setCourseQuery(e.target.value)}
                placeholder="Buscar curso por nombre o código"
                className="w-full h-8 text-xs pl-7"
              />
            </div>
            {courseQuery && (
              <div className="absolute left-0 right-0 mt-1 z-50">
                <div className="rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                  {searchingCourses ? (
                    <div className="p-2 text-sm text-muted-foreground flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando cursos...
                    </div>
                  ) : courseResults.length > 0 ? (
                    courseResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCourseQuery("");
                          handleSelectCourse(c);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">
                          {c.name}
                        </span>
                        <span className="text-xs text-gray-600 ml-2">
                          {c.code}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Sin resultados
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Botones de acción */}
          <div className="flex space-x-1.5 w-auto flex-shrink-0 justify-center">
            <Button
              onClick={handleExportPDF}
              disabled={exporting || !reportData}
              className="w-auto h-8 text-xs px-2"
            >
              {exporting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <FileText className="mr-1 h-3 w-3" />
              )}
              PDF
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || !reportData}
              variant="outline"
              className="w-auto h-8 text-xs px-2"
            >
              {refreshing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Actualizar
            </Button>
          </div>
        </div>
      </div>
      {/* ⚠️ Pantalla de inicio/No data */}
      {!reportData ? (
        <Card className="text-center p-8">
          <CardHeader className="items-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
            <CardTitle>Selecciona un Curso</CardTitle>
            <CardDescription>
              Usa el buscador para generar el reporte de curso.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        /* 📄 Contenedor principal del reporte (para PDF) */
        <div
          ref={reportRef}
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-black"
        >
          {/* Encabezado del reporte */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-4 mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg">
                <img
                  src="/ciusa.png"
                  alt="Logo Institución"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  Escuela de Idiomas, Universidad Sergio Arboleda Caribe
                </h1>
                <p className="text-sm text-gray-600">
                  Reporte Detallado de Curso
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-sm">
              <p className="text-gray-700">
                Fecha de Generación:{" "}
                <span className="font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
          {/* Datos del Curso */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-md p-3">
              <h2 className="text-xl font-bold text-gray-900">
                {currentReportData.courseName}
              </h2>
              <p className="text-sm text-gray-700">
                Código:{" "}
                <span className="font-semibold">
                  {currentReportData.courseCode}
                </span>{" "}
                | Profesor:{" "}
                <span className="font-semibold">
                  {currentReportData.teacherName}
                </span>
              </p>
            </div>
          </div>
          {/* Resumen de Estudiantes (Tabla) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Resumen de Estudiantes Inscritos ({totalStudents})
            </h3>
            <div className="overflow-x-auto rounded-lg">
              {currentReportData.studentsSummary.length > 0 ? (
                <Table className="no-hover min-w-[700px] w-full">
                  <TableHeader>
                    {/* ✅ SIN ESPACIOS/SALTOS DE LÍNEA entre <TableRow> y <TableHead> */}
                    <TableRow className="text-gray-900 no-hover hover:bg-transparent border-b">
                      <TableHead className="py-2 px-4 w-12"></TableHead> 
                      <TableHead className="py-2 px-4">Estudiante</TableHead>
                      <TableHead className="py-2 px-4">ID / Cédula</TableHead>
                      <TableHead className="text-right py-2 px-4">Nota Final</TableHead>
                      <TableHead className="text-right py-2 px-4">Asistencia</TableHead>
                      <TableHead className="text-center py-2 px-4">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReportData.studentsSummary
                      .sort((a, b) => b.overallAvgNotes - a.overallAvgNotes)
                      .map((student) => {
                        const studentPassed = student.isPassed;
                        const initialLetters = student.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                          // ✅ SIN ESPACIOS/SALTOS DE LÍNEA entre <TableRow> y <TableCell>
                          <TableRow
                            key={student.studentId}
                            className="text-gray-800 no-hover hover:bg-transparent border-b last:border-b-0"
                          >
                            <TableCell className="py-2 px-4">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={student.photoUrl || "/placeholder-user.jpg"} 
                                  alt={student.studentName} 
                                />
                                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                  {initialLetters}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>

                            <TableCell className="font-medium py-2 px-4">
                              {student.studentName}
                            </TableCell>
                            <TableCell className="py-2 px-4">
                              {student.studentId}
                            </TableCell>
                            <TableCell className="text-right py-2 px-4">
                              {/* Formato de nota a dos decimales */}
                              {student.overallAvgNotes.toFixed(2)} 
                            </TableCell>
                            <TableCell className="text-right py-2 px-4">
                              {student.overallAttendanceRate.toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-center py-2 px-4">
                              <span
                                className={`text-sm font-semibold ${
                                  studentPassed
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {studentPassed ? "Aprobado" : "Reprobado"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No hay estudiantes registrados en este curso.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}