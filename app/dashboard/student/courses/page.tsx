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
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, BookOpen, Loader2, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStudentCourses, Course } from "@/lib/courses";
import { useAuth } from "@/lib/auth-context";

// Opcional: Para animaciones más avanzadas y declarativas
// import { motion } from "framer-motion";

// 1. Mejoras en la tipificación
type CourseWithTeacher = Course & {
  teachers: {
    name: string;
  } | null;
};

// 2. Hook personalizado para la lógica de cursos
const useStudentCourses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para ver tus cursos.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null); // Resetear el error al iniciar la carga

      try {
        const studentCourses = await getStudentCourses(user.id);
        setCourses(studentCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("No se pudieron cargar tus cursos. Inténtalo de nuevo más tarde.");
        toast({
          title: "Error de carga",
          description: "No se pudieron cargar tus cursos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, toast]);

  return { courses, isLoading, error, user };
};

// 3. Componente de tarjeta de curso con animaciones
const CourseCard = ({ course, index }: { course: CourseWithTeacher; index: number }) => {
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-green-200 text-green-900",
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-yellow-200 text-yellow-900",
      C1: "bg-orange-100 text-orange-800",
      C2: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      Inglés: "🇺🇸",
      Francés: "🇫🇷",
      Alemán: "🇩🇪",
      Italiano: "🇮🇹",
      Portugués: "🇧🇷",
      Mandarín: "🇨🇳",
    };
    return flags[language] || "🌐";
  };

  // Usando Tailwind para animaciones de entrada y hover
  // Puedes usar motion.div de framer-motion para animaciones más complejas
  // Por ejemplo:
  // <motion.div
  //   initial={{ opacity: 0, y: 20 }}
  //   animate={{ opacity: 1, y: 0 }}
  //   transition={{ duration: 0.3, delay: index * 0.05 }}
  //   whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
  // >
  //   <Card ...>
  //     ...
  //   </Card>
  // </motion.div>

  return (
    <Card
      // Animación de entrada con Tailwind
      className="
        hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out
        animate-fade-in animate-slide-up
      "
      style={{ animationDelay: `${index * 0.08}s` }} // Retraso para efecto escalonado
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getLanguageFlag(course.language)}</span>
            <div>
              <CardTitle className="text-lg">{course.name}</CardTitle>
              <CardDescription>{course.language}</CardDescription>
            </div>
          </div>
          <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {course.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4" />
          <span className="font-semibold">Profesor:</span>{" "}
          {course.teachers?.name || "No asignado"}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration_weeks}w
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.enrolled_count} / {course.max_students}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {course.hours_per_week}h/sem
          </div>
        </div>
        {course.schedule && (
          <div className="text-sm">
            <span className="font-medium">Horario:</span> {course.schedule}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para el esqueleto de carga
const SkeletonCard = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div> {/* Bandera */}
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div> {/* Título */}
            <div className="h-3 w-20 bg-gray-200 rounded"></div> {/* Descripción */}
          </div>
        </div>
        <div className="h-5 w-12 bg-gray-200 rounded-full"></div> {/* Nivel */}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="h-3 w-full bg-gray-200 rounded"></div> {/* Descripción */}
      <div className="h-3 w-5/6 bg-gray-200 rounded"></div> {/* Descripción */}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
        <div className="h-3 w-24 bg-gray-200 rounded"></div> {/* Profesor */}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="h-4 w-12 bg-gray-200 rounded"></div> {/* Duración */}
        <div className="h-4 w-16 bg-gray-200 rounded"></div> {/* Estudiantes */}
        <div className="h-4 w-16 bg-gray-200 rounded"></div> {/* Horas */}
      </div>
      <div className="h-3 w-full bg-gray-200 rounded"></div> {/* Horario */}
    </CardContent>
  </Card>
);


// 5. Componente principal simplificado
export default function StudentCoursesPage() {
  const { courses, isLoading, error } = useStudentCourses();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => ( // Muestra 3 esqueletos
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="col-span-full border-red-500 bg-red-50 text-red-800 animate-fade-in">
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-medium">{error}</h3>
            <p className="mt-2 text-sm">
              Por favor, verifica tu conexión o intenta recargar la página.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (courses.length === 0) {
      return (
        <Card className="col-span-full text-center py-12 animate-scale-in">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-bounce-subtle" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes cursos inscritos
            </h3>
            <p className="text-gray-500">
              Puedes inscribirte a nuevos cursos con un administrador.
            </p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <CourseCard key={course.id} course={course} index={index} />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div className="animate-fade-in-down"> {/* Animación para el título */}
          <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
          <p className="text-muted-foreground">Cursos en los que estás inscrito</p>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}