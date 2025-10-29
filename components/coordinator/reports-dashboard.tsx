"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  RefreshCw,
  BookOpen,
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
// Asegúrate de que tu ruta de Supabase sea correcta
import { supabase } from "@/lib/supabase"; 


// --- Interfaces (Mantenidas) ---

interface Course {
  id: string;
  name: string;
  code: string;
}

interface StudentSummary {
  studentName: string;
  studentId: string;
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

// **SIMULADO:** Función de búsqueda de cursos
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
  return data.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code || "CÓDIGO N/A",
  })) as Course[];
};


// --- Componente Principal ---

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

  const PASS_THRESHOLD = 60;

  // --- Efectos y Lógica (Mantenidos) ---
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
    // 1. Obtener la información del profesor (teacher)
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
      : (courseInfo.teacher as { name?: string })?.name || "Sin profesor asignado";

    // 2. Obtener todos los estudiantes inscritos en el curso
    const { data: enrollments, error: enrErr } = await supabase
      .from("enrollments")
      .select("id, student:users(id, name, document_number)")
      .eq("course_id", course.id);

    if (enrErr) {
      throw enrErr;
    }

    const studentsSummary: StudentSummary[] = await Promise.all(
      (enrollments || []).map(async (enr: any) => {
        const studentId = enr.student.document_number; 
        const studentName = enr.student.name;
        // Simulando datos (reemplazar con lógica real de notas/asistencia)
        const overallAvgNotes = parseFloat((Math.random() * (100 - 40) + 40).toFixed(1));
        const overallAttendanceRate = parseFloat((Math.random() * (100 - 50) + 50).toFixed(0));
        return {
          studentName,
          studentId,
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
      courseAvgNotes: parseFloat(courseAvgNotes.toFixed(1)),
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
      if (error && error.code !== 'PGRST116') throw error;
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
      const canvas = await html2canvas(reportRef.current, { scale: 2, logging: true });
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
        <span className="ml-2 text-gray-800">Cargando reporte del curso...</span>
      </div>
    );
  }
  const currentReportData = reportData || emptyCourseData;
  const totalStudents = currentReportData.studentsSummary.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      
      {/* --- Header y Botones de Control (MÁXIMA COMPACTACIÓN MÓVIL) --- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
        
        {/* Título y Descripción */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reporte de Curso</h1>
          <p className="text-sm text-gray-600">Informe resumido del desempeño de los estudiantes</p>
        </div>
        
        {/* Controles: Buscador, Exportar, Actualizar */}
        {/* Contenedor principal de controles: flex-col y centrado para móvil, sin forzar ancho */}
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 w-auto items-center md:items-start"> 
          
          {/* Buscador: w-auto en móvil, con max-w para que no crezca demasiado */}
          {/* Alineado al centro en móvil */}
          <div className="relative w-auto max-w-xs md:w-56"> 
            <Input
              value={courseQuery}
              onChange={(e) => setCourseQuery(e.target.value)}
              placeholder="Buscar curso" 
              className="w-full h-7 text-xs" 
            />
            {/* Resultados de búsqueda (Mantenidos) */}
            {courseQuery && (
              <div className="absolute left-0 right-0 mt-1 z-50">
                <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-auto">
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
                        className="w-full text-left px-3 py-2" 
                      >
                        <span className="font-medium text-gray-900">{c.name}</span>
                        <span className="text-xs text-gray-600">{c.code}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Sin resultados</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones: w-auto en móvil para que solo ocupen el ancho de su contenido. */}
          {/* Centrados en móvil */}
          <div className="flex space-x-1.5 w-auto flex-shrink-0 justify-center">
            <Button 
                onClick={handleExportPDF} 
                disabled={exporting || !reportData} 
                className="w-auto h-7 text-xs px-1.5" 
            >
              {exporting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileText className="mr-1 h-3 w-3" />}
              PDF
            </Button>
            <Button 
                onClick={handleRefresh} 
                disabled={refreshing || !reportData} 
                variant="outline" 
                className="w-auto h-7 text-xs px-1.5" 
            >
              {refreshing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              Actualizar
            </Button>
          </div>
        </div>
      </div>
      {/* --- FIN Header y Botones de Control --- */}

      {/* Si no hay datos (Inicio) */}
      {!reportData ? (
        <Card className="text-center p-8">
          <CardHeader className="items-center">
            <BookOpen className="w-12 h-12 text-muted-foreground" />
            <CardTitle>Selecciona un Curso</CardTitle>
            <CardDescription>Usa el buscador para generar el reporte de curso.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div ref={reportRef} className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-black">
          
          {/* --- PLANTILLA DE ENCABEZADO CON LOGO (BORDE REMOVIDO) --- */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-4 mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {/* REMOVIDO: la clase "border" del div del logo */}
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg"> 
                 {/* Asumo que tienes una imagen en /ciusa.png en tu carpeta public */}
                 <img src="/ciusa.png" alt="Logo Institución" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Escuela de Idiomas, Universidad Sergio Arboleda Caribe</h1>
                <p className="text-sm text-gray-600">Reporte Detallado de Curso</p>
              </div>
            </div>
            <div className="text-left sm:text-right text-sm">
              <p className="text-gray-700">Fecha de Generación: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
              <p className="text-gray-700">Coordinador: <span className="font-medium">{coordinator?.name || "N/A"}</span></p>
            </div>
          </div>
          {/* --- FIN PLANTILLA DE ENCABEZADO CON LOGO --- */}


          {/* Solo Título del Curso y Profesor */}
          <div className="mb-6">
            <div className="bg-gray-50 border rounded-md p-3">
              <h2 className="text-xl font-bold text-gray-900">{currentReportData.courseName}</h2>
              <p className="text-sm text-gray-700">Código: <span className="font-semibold">{currentReportData.courseCode}</span> | Profesor: <span className="font-semibold">{currentReportData.teacherName}</span></p>
            </div>
          </div>

          {/* Tabla de Estudiantes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Resumen de Estudiantes Inscritos ({totalStudents})</h3>
            
            {/* Contenedor responsivo para la tabla en móviles */}
            <div className="overflow-x-auto border rounded-lg">
              {currentReportData.studentsSummary.length > 0 ? (
                // La clase 'no-hover' desactiva el cambio de color al pasar el cursor
                <Table className="no-hover min-w-[600px] w-full">
                  <TableHeader>
                    <TableRow className="text-gray-900 no-hover hover:bg-transparent">
                      <TableHead>Estudiante</TableHead>
                      <TableHead>ID / Cédula</TableHead>
                      <TableHead className="text-right">Prom. General</TableHead>
                      <TableHead className="text-right">Asistencia</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReportData.studentsSummary
                      .sort((a, b) => b.overallAvgNotes - a.overallAvgNotes)
                      .map((student) => {
                      const studentPassed = student.isPassed;
                      return (
                        <TableRow key={student.studentId} className="text-gray-800 no-hover hover:bg-transparent">
                          <TableCell className="font-medium">{student.studentName}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell className="text-right">{student.overallAvgNotes.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{student.overallAttendanceRate.toFixed(0)}%</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={studentPassed ? "default" : "destructive"}>
                              {studentPassed ? "Aprobado" : "Reprobado"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">No hay estudiantes registrados en este curso.</div>
              )}
            </div>
          </div>
          
          {/* ELIMINADA: Sección de progreso de aprobación */}
          
        </div>
      )}

      {/* Bloque de estilos CSS para deshabilitar el hover en las tablas de Shadcn/UI/Tailwind */}
      <style jsx global>{`
        /* Anula los estilos hover por defecto de la librería de UI */
        .no-hover:hover {
          background-color: transparent !important;
        }
        
        /* Asegura que los colores de fondo de las celdas se mantengan transparentes al pasar el cursor */
        .no-hover > td {
          background-color: transparent !important;
        }

        /* Anula la propiedad data-state="hover" que usa Shadcn/ui */
        .no-hover[data-state='hover'] {
          background-color: transparent !important;
        }

        /* Anula el hover para las celdas en el hover de la fila */
        .no-hover[data-state='hover'] > td {
            background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}