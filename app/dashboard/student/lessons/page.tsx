"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Loader2,
  BookOpen,
  FileText,
  Headphones,
  Download,
  PlayCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getStudentLessons } from "@/lib/lessons";
import { Button } from "@/components/ui/button";

// --- Constante de Paginación ---
const LESSONS_PER_PAGE = 6;
// ------------------------------

// Definición de la interfaz (sin cambios)
interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  courses: {
    name: string;
    language: string;
    level: string;
  };
}

// Variantes para el contenedor general (cascada)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Variantes para los items individuales (entrada desde abajo)
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Variantes específicas para las tarjetas de estadísticas (Bounce ligero y sin color en borde)
const statsHoverVariants = {
  hover: {
    scale: 1.03, // Menos agresivo
    boxShadow: "0 10px 15px rgba(0, 0, 0, 0.05)", // Sombra elegante
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.98 },
};

export default function StudentLessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  // --- Estado para el límite de lecciones a mostrar ---
  const [limit, setLimit] = useState(LESSONS_PER_PAGE);
  // ----------------------------------------------------

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;

      try {
        // Simular carga con un pequeño retraso para apreciar la animación
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const lessonsData = await getStudentLessons(user.id);
        setLessons(lessonsData.filter(l => l.is_published)); // Solo mostrar publicadas
      } catch (error) {
        console.error("Error cargando lecciones:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las lecciones",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user?.id, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // --- Manejador para cargar más lecciones ---
  const handleLoadMore = () => {
    setLimit(prev => prev + LESSONS_PER_PAGE);
  };
  // -----------------------------------------

  const totalPDF = lessons.filter((lesson) => lesson.pdf_url).length;
  const totalAudio = lessons.filter((lesson) => lesson.audio_url).length;
  
  // Lecciones a mostrar en la vista actual
  const lessonsToShow = lessons.slice(0, limit);
  const hasMoreLessons = lessons.length > limit;

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* ENCABEZADO MINIMALISTA (Sin iconos) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Mis Lecciones
          </h2>
          <p className="text-lg text-gray-500">
            Accede al material de estudio, documentos y audios de tus cursos.
          </p>
        </motion.div>

        {/* SECCIÓN DE ESTADÍSTICAS (Sin iconos ni asteriscos) */}
        {!loading && lessons.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {/* Tarjeta 1: Totales */}
            <motion.div
              variants={itemVariants as any}
              whileHover="hover"
              whileTap="tap"
              className="h-full"
            >
              <motion.div
                variants={statsHoverVariants as any}
                className="h-full"
              >
                <Card className="h-full shadow-md border-gray-200 bg-white hover:shadow-lg transition-all duration-300 cursor-default">
                  <CardContent className="pt-6 flex items-start space-x-0 flex-col">
                    <p className="text-4xl font-bold text-gray-800 mb-1">
                      {lessons.length}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      Total de Lecciones
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Tarjeta 2: PDF */}
            <motion.div
              variants={itemVariants as any}
              whileHover="hover"
              whileTap="tap"
              className="h-full"
            >
              <motion.div
                variants={statsHoverVariants as any}
                className="h-full"
              >
                <Card className="h-full shadow-md border-gray-200 bg-white hover:shadow-lg transition-all duration-300 cursor-default">
                  <CardContent className="pt-6 flex items-start space-x-0 flex-col">
                    <p className="text-4xl font-bold text-gray-800 mb-1">
                      {totalPDF}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      Material PDF
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Tarjeta 3: Audio */}
            <motion.div
              variants={itemVariants as any}
              whileHover="hover"
              whileTap="tap"
              className="h-full"
            >
              <motion.div
                variants={statsHoverVariants as any}
                className="h-full"
              >
                <Card className="h-full shadow-md border-gray-200 bg-white hover:shadow-lg transition-all duration-300 cursor-default">
                  <CardContent className="pt-6 flex items-start space-x-0 flex-col">
                    <p className="text-4xl font-bold text-gray-800 mb-1">
                      {totalAudio}
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      Con Audio
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* LISTADO DE LECCIONES */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-700">Contenido Disponible</h3>
            <Badge variant="outline" className="px-3 py-1 text-base text-gray-600 border-gray-300">
              {lessons.length} {lessons.length === 1 ? "Lección" : "Lecciones"}
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-gray-500 animate-pulse">
                Sincronizando contenido...
              </p>
            </div>
          ) : lessons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200"
            >
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                El camino de aprendizaje espera
              </h3>
              <p className="text-gray-500 max-w-lg mx-auto">
                Parece que aún no hay lecciones publicadas para tus cursos activos. Vuelve pronto para empezar a explorar.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence>
                  {/* Se usa lessonsToShow (el array con el límite aplicado) */}
                  {lessonsToShow.map((lesson) => (
                    <motion.div
                      key={lesson.id}
                      variants={itemVariants as any}
                      layoutId={lesson.id}
                      className="h-full"
                    >
                      <Card className="flex flex-col h-full overflow-hidden border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-indigo-400 transition-all duration-300 group">
                        {/* Indicador superior */}
                        <div className="h-1 bg-gray-300 w-full group-hover:h-1.5 group-hover:bg-indigo-500 transition-all duration-300" />

                        <CardHeader className="pb-3 flex-shrink-0">
                          <div className="flex justify-between items-start mb-2">
                            {/* Información de Curso/Nivel sin iconos */}
                            <div className="text-sm font-medium text-gray-600">
                              <span className="font-semibold text-indigo-600">
                                  {lesson.courses?.language || "Curso"}
                              </span>
                              <span className="text-gray-400 mx-1">•</span>
                              <span>
                                  {lesson.courses?.level}
                              </span>
                            </div>
                            
                            <Badge 
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border-gray-300"
                            >
                              Lección {lesson.order_index}
                            </Badge>
                          </div>

                          <CardTitle className="text-xl leading-snug font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {lesson.title}
                          </CardTitle>

                          <CardDescription className="flex items-center gap-1.5 text-xs mt-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Publicada: {formatDate(lesson.created_at)}
                            </span>
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-grow pb-4">
                          {lesson.description && (
                            <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-normal">
                              {lesson.description}
                            </p>
                          )}

                          <div className="space-y-3 mt-auto pt-2">
                            {(lesson.pdf_url || lesson.audio_url) && (
                              <div className="flex flex-col gap-2">
                                {/* Botón PDF (CON ICONOS) */}
                                {lesson.pdf_url && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between h-10 group/btn border-gray-300 text-gray-800 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all"
                                    asChild
                                  >
                                    <a
                                      href={lesson.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <span className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-red-500 transition-transform" />
                                          <span className="font-medium">
                                              Descargar Material PDF
                                          </span>
                                      </span>
                                      <Download className="h-4 w-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:text-red-600" />
                                    </a>
                                  </Button>
                                )}

                                {/* Botón Audio (CON ICONOS) */}
                                {lesson.audio_url && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between h-10 group/btn border-gray-300 text-gray-800 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all"
                                    onClick={() =>
                                      window.open(lesson.audio_url!, "_blank")
                                    }
                                  >
                                    <span className="flex items-center gap-2">
                                      <Headphones className="h-4 w-4 text-teal-500 transition-transform" />
                                      <span className="font-medium">
                                          Escuchar Audio
                                      </span>
                                    </span>
                                    <PlayCircle className="h-4 w-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:text-teal-600" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0 pb-4 mt-auto border-t pt-4 bg-gray-50/50 flex-shrink-0">
                          <div className="w-full flex items-center justify-start">
                              {/* Estado Disponible sin icono */}
                              <div className="text-xs text-green-700 font-semibold bg-green-100 px-3 py-1 rounded-full border border-green-300">
                                  Disponible
                              </div>
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* --- Botón de Paginación (Cargar Más) --- */}
              {hasMoreLessons && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center pt-8"
                  >
                      <Button 
                          variant="outline"
                          className="w-full sm:w-1/2 md:w-1/3 mx-auto h-12 text-lg font-semibold border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                          onClick={handleLoadMore}
                      >
                          Cargar más lecciones ({lessons.length - limit} restantes)
                      </Button>
                  </motion.div>
              )}
              {/* -------------------------------------- */}
            </>
          )}
        </div>

        {/* Mensaje de ayuda (Sin iconos y sin asteriscos) */}
        {!loading && lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white border-indigo-200 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div>
                    <h4 className="font-bold text-lg text-indigo-800 mb-1.5">
                      Consejos para el Estudio
                    </h4>
                    <ul className="text-base text-gray-700 list-disc ml-5 space-y-1">
                        <li>
                            Descarga los materiales PDF para estudiar sin conexión o imprimir.
                        </li>
                        <li>
                            Utiliza los audios para mejorar tu comprensión oral y pronunciación.
                        </li>
                        <li>
                            Intenta seguir el orden numerado de las lecciones para un aprendizaje progresivo.
                        </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}