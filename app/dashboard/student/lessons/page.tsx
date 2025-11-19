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
  FileText,
  Music,
  Folder,
  ExternalLink,
  CheckCircle,
  BookOpen,
  PlayCircle,
  Download,
  Headphones,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getStudentLessons } from "@/lib/lessons";
import { Button } from "@/components/ui/button";

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
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Variantes específicas para las tarjetas de estadísticas (Bounce ligero)
const statsHoverVariants = {
  hover: {
    scale: 1.05,
    y: -5,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
  tap: { scale: 0.95 },
};

export default function StudentLessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return;

      try {
        const lessonsData = await getStudentLessons(user.id);
        setLessons(lessonsData);
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

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-8 max-w-7xl mx-auto p-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-2"
        >
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Mis Lecciones
          </h2>
          <p className="text-muted-foreground text-lg">
            Explora y descarga el contenido de tus cursos activos.
          </p>
        </motion.div>

        {/* SECCIÓN DE ESTADÍSTICAS ANIMADA */}
        {!loading && lessons.length > 0 && (
          <motion.div
            variants={containerVariants} // Usamos containerVariants para que aparezcan en orden
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm cursor-default">
                  <CardContent className="pt-6 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {lessons.length}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Lecciones totales
                      </p>
                    </div>
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
                <Card className="h-full border-l-4 border-l-green-500 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm cursor-default">
                  <CardContent className="pt-6 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {lessons.filter((lesson) => lesson.pdf_url).length}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Con material PDF
                      </p>
                    </div>
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
                <Card className="h-full border-l-4 border-l-purple-500 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm cursor-default">
                  <CardContent className="pt-6 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                      <Music className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-800">
                        {lessons.filter((lesson) => lesson.audio_url).length}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Con audio
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Badge variant="outline" className="px-3 py-1 text-base">
              {lessons.length} {lessons.length === 1 ? "Lección" : "Lecciones"}{" "}
              disponibles
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">
                Sincronizando contenido...
              </p>
            </div>
          ) : lessons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed"
            >
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay lecciones disponibles
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aún no se han publicado lecciones para tus cursos. Vuelve
                pronto.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            >
              <AnimatePresence>
                {lessons.map((lesson) => (
                  <motion.div
                    key={lesson.id}
                    variants={itemVariants as any}
                    layoutId={lesson.id}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.2 },
                    }}
                    className="h-full"
                  >
                    <Card className="flex flex-col h-full overflow-hidden border-gray-200 bg-white shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />

                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-3">
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            {lesson.courses?.language || "Curso"} •{" "}
                            {lesson.courses?.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded-md border">
                            #{lesson.order_index}
                          </span>
                        </div>

                        <CardTitle className="text-lg leading-tight group-hover:text-blue-700 transition-colors">
                          {lesson.title}
                        </CardTitle>

                        <CardDescription className="flex items-center gap-2 text-xs mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lesson.created_at)}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-grow pb-4">
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                            {lesson.description}
                          </p>
                        )}

                        <div className="space-y-3 mt-auto">
                          {(lesson.pdf_url || lesson.audio_url) && (
                            <div className="flex flex-col gap-2 pt-2">
                              {lesson.pdf_url && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-between group/btn hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all"
                                  asChild
                                >
                                  <a
                                    href={lesson.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <span className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-red-500 group-hover/btn:scale-110 transition-transform" />
                                      <span className="font-medium">
                                        Material PDF
                                      </span>
                                    </span>
                                    <Download className="h-4 w-4 opacity-50 group-hover/btn:opacity-100" />
                                  </a>
                                </Button>
                              )}

                              {lesson.audio_url && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-between group/btn hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all"
                                  onClick={() =>
                                    window.open(lesson.audio_url!, "_blank")
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <Headphones className="h-4 w-4 text-purple-500 group-hover/btn:scale-110 transition-transform" />
                                    <span className="font-medium">
                                      Audio Lección
                                    </span>
                                  </span>
                                  <PlayCircle className="h-4 w-4 opacity-50 group-hover/btn:opacity-100" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-0 pb-4 mt-auto border-t pt-4 bg-gray-50/50">
                        <div className="w-full flex items-center justify-start">
                          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Disponible
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Mensaje de ayuda */}
        {!loading && lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">
                      ¿Cómo usar las lecciones?
                    </h4>
                    <p className="text-sm text-blue-700">
                      • Descarga los materiales PDF para estudiar offline
                      <br />
                      • Escucha los audios para practicar comprensión oral
                      <br />
                      • Completa las lecciones en orden recomendado
                      <br />• Contacta a tu profesor si tienes dudas
                    </p>
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
