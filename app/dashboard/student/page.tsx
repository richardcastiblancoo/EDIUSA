"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Award,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getStudentCourses } from "@/lib/courses";
import { getStudentExams } from "@/lib/exams";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const cardHoverEffect = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

interface Teacher {
  name: string;
}

interface Course {
  id: string;
  name: string;
  schedule: string;
  teachers?: Teacher;
}

interface ExamSubmission {
  score: number | null;
}

interface Exam {
  id: string;
  title: string;
  due_date: string;
  courses?: {
    name: string;
  };
  exam_submissions?: ExamSubmission[];
}

/**
 * FUNCIÓN DE CONVERSIÓN
 * Convierte una puntuación de la escala 0-100 a la escala 0-5.
 * @param score_100 El puntaje en base 100.
 * @returns El puntaje en base 5.
 */
const convertToScaleFive = (score_100: number): number => {
  return Math.min(Math.max((score_100 / 100) * 5, 0), 5);
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          toast({
            title: "Error de Autenticación",
            description: "Debes iniciar sesión para ver tu información.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const studentCourses = await getStudentCourses(user.id);
        setCourses(
          (studentCourses ?? []).map((c: any) => ({
            ...c,
            schedule: c.schedule ?? "",
            teachers: c.teachers ?? undefined,
          }))
        );

        const studentExams = await getStudentExams(user.id);
        setExams(studentExams ?? []);
        const scores: number[] = (studentExams ?? [])
          .map((exam: Exam) => {
            const submission = exam.exam_submissions?.[0];
            return submission?.score ?? null;
          })
          .filter((score): score is number => score !== null)
          .map((score) => score as number);

        if (scores.length > 0) {
          const sumOfScores = scores.reduce((a, b) => a + b, 0);
          const rawAverage = sumOfScores / scores.length;

          const finalAverage = convertToScaleFive(rawAverage);
          setAverageScore(Number(finalAverage.toFixed(1)));
        } else {
          setAverageScore(null);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        toast({
          title: "Error de Carga",
          description:
            "No se pudo cargar tu información. Intenta de nuevo más tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout userRole="student">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants as any}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Dashboard Estudiante 🎓
          </h2>
          <p className="text-muted-foreground">Sigue tu progreso académico</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <motion.div
              className="grid gap-4 md:grid-cols-3"
              variants={containerVariants}
            >
              <motion.div
                variants={itemVariants as Variants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cursos Activos
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <p className="text-xs text-muted-foreground">En progreso</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Exámenes Pendientes
                    </CardTitle>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{exams.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Programados / No calificados
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants} whileHover={cardHoverEffect}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Promedio General
                    </CardTitle>
                    <Award className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {averageScore !== null ? averageScore.toFixed(1) : "--"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {averageScore !== null
                        ? `Basado en ${scores.length} notas`
                        : "Sin notas aún"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            <motion.div
              className="grid gap-4 md:grid-cols-1 space-y-4"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Mis Cursos 📖</CardTitle>
                    <CardDescription>
                      Cursos en los que estás inscrito
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <motion.div
                            key={course.id}
                            className="border rounded-lg p-4"
                            whileHover={cardHoverEffect}
                            variants={itemVariants}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{course.name}</h4>
                              <span className="text-sm text-muted-foreground">
                                En progreso
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {course.teachers?.name || "Profesor no asignado"}
                            </p>
                            {course.schedule && (
                              <p className="text-sm font-medium text-blue-600 mb-2">
                                Horario: {course.schedule}
                              </p>
                            )}
                            <Link href="/dashboard/student/courses">
                              <Button size="sm">Ver Curso</Button>
                            </Link>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No tienes cursos inscritos
                          </h3>
                          <p className="text-gray-500">
                            Puedes inscribirte a nuevos cursos con un
                            administrador.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Próximos Exámenes 🗓️</CardTitle>
                    <CardDescription>Exámenes programados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exams.length > 0 ? (
                        exams.map((exam) => (
                          <motion.div
                            key={exam.id}
                            className="border rounded-lg p-4"
                            whileHover={cardHoverEffect}
                            variants={itemVariants}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{exam.title}</h4>
                              <span className="text-sm font-medium text-green-600">
                                Disponible
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Fecha Límite: {formatDate(exam.due_date)} -{" "}
                              {formatTime(exam.due_date)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Curso: {exam.courses?.name || "No especificado"}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No hay exámenes programados
                          </h3>
                          <p className="text-gray-500">
                            No tienes exámenes próximos en este momento.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <CardHeader>
                  <CardTitle>PQR 💬</CardTitle>
                  <CardDescription>
                    Peticiones, Quejas y Reclamos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center py-4">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Gestiona tus solicitudes
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Envía peticiones, quejas o reclamos relacionados con tus
                      cursos.
                    </p>
                    <Link href="/dashboard/student/pqr">
                      <Button>Crear nueva solicitud</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}