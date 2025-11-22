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
import { Clock, Calendar, Users, BookOpen, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getStudentCourses, Course } from "@/lib/courses";
import { useAuth } from "@/lib/auth-context";

type CourseWithTeacher = Course & {
  teachers: {
    name: string;
  } | null;
};

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
      setError(null);
      try {
        const studentCourses = await getStudentCourses(user.id);
        setCourses(studentCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(
          "No se pudieron cargar tus cursos. Inténtalo de nuevo más tarde."
        );
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

const CourseCard = ({
  course,
  index,
}: {
  course: CourseWithTeacher;
  index: number;
}) => {
  const router = useRouter();
  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      A1: "bg-gray-100 text-gray-900 border border-gray-300",
      A2: "bg-gray-200 text-gray-900 border border-gray-400",
      B1: "bg-gray-300 text-gray-900 border border-gray-500",
      B2: "bg-gray-400 text-gray-900 border border-gray-600",
      C1: "bg-gray-600 text-white border border-gray-700",
      C2: "bg-gray-800 text-white border border-gray-900",
    };
    return colors[level] || "bg-gray-100 text-gray-900 border border-gray-300";
  };

  return (
    <Card
      className="
        group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out
        border border-gray-200 bg-white overflow-hidden
        animate-fade-in animate-slide-up
      "
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
              {course.name}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-gray-600">
              {course.language}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${getLevelColor(course.level)} font-semibold text-xs px-3 py-1`}
          >
            {course.level}
          </Badge>
        </div>

        {course.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {course.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Información del profesor */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-900 rounded-full">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500">Profesor</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {course.teachers?.name || "Por asignar"}
            </p>
          </div>
        </div>

        {/* Información del curso */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg border border-gray-200">
              <Clock className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <p className="font-semibold">Duración</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg border border-gray-200">
              <Calendar className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <p className="font-semibold">Horas</p>
            </div>
          </div>
        </div>

        {/* Horario */}
        {course.schedule && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-700" />
              <span className="font-semibold text-gray-900">Horario:</span>
              <span className="text-gray-700">{course.schedule}</span>
            </div>
          </div>
        )}

        {/* Estado del curso */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {course.enrolled_count} estudiantes
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            router.push(`/dashboard/student/courses/${course.id}/exams`);
          }}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Acceder a exámenes
        </button>
      </CardContent>
    </Card>
  );
};

const SkeletonCard = () => (
  <Card className="animate-pulse overflow-hidden border border-gray-200">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pt-0">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="space-y-1 flex-1">
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="space-y-1">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="space-y-1">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex justify-between pt-3">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

export default function StudentCoursesPage() {
  const { courses, isLoading, error } = useStudentCourses();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="col-span-full border-gray-300 bg-gray-50 text-gray-900 animate-fade-in">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{error}</h3>
            <p className="text-sm text-gray-600">
              Por favor, verifica tu conexión o intenta recargar la página.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (courses.length === 0) {
      return (
        <Card className="col-span-full text-center py-16 animate-scale-in bg-gray-50 border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            No tienes cursos inscritos
          </h3>
          <div className="text-gray-600 max-w-md mx-auto">
            Actualmente no estás inscrito en ningún curso. Contacta con la administración para inscribirte en los cursos disponibles.
          </div>
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
      <div className="space-y-8">
        <div className="animate-fade-in-down">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Mis Cursos</h2>
          <p className="text-gray-600 text-lg mt-2">
            Gestiona y revisa todos tus cursos universitarios
          </p>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}