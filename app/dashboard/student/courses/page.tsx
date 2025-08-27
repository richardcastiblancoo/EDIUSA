"use client"

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStudentCourses } from "@/lib/courses";
import { Course } from "@/lib/courses";
import { useAuth } from "@/lib/auth-context"; // Importar el hook de autenticación

type CourseWithTeacher = Course & {
    teachers: {
        name: string;
    } | null;
};

export default function StudentCoursesPage() {
    const { toast } = useToast();
    const { user } = useAuth(); // Obtener el usuario autenticado
    const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoading(true);
            try {
                if (!user) {
                    toast({
                        title: "Error",
                        description: "Debes iniciar sesión para ver tus cursos.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                // Usar el ID del usuario autenticado
                const studentCourses = await getStudentCourses(user.id);
                setCourses(studentCourses);
            } catch (error) {
                console.error("Error fetching courses:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar tus cursos.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, [toast, user]); // Añadir user como dependencia

    const getLevelColor = (level: string) => {
        const colors = {
            A1: "bg-green-100 text-green-800",
            A2: "bg-green-200 text-green-900",
            B1: "bg-yellow-100 text-yellow-800",
            B2: "bg-yellow-200 text-yellow-900",
            C1: "bg-orange-100 text-orange-800",
            C2: "bg-red-100 text-red-800",
        };
        return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800";
    };

    const getLanguageFlag = (language: string) => {
        const flags = {
            Inglés: "🇺🇸",
            Francés: "🇫🇷",
            Alemán: "🇩🇪",
            Italiano: "🇮🇹",
            Portugués: "🇧🇷",
            Mandarín: "🇨🇳",
        };
        return flags[language as keyof typeof flags] || "🌐";
    };

    return (
        <DashboardLayout userRole="student">
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mis Cursos</h2>
                    <p className="text-muted-foreground">Cursos en los que estás inscrito</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.length > 0 ? (
                            courses.map((course) => (
                                <Card key={course.id} className="hover:shadow-lg transition-shadow">
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
                                    <CardContent>
                                        <div className="space-y-3">
                                            {course.description && <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>}

                                            {/* Aquí se muestra el nombre del profesor */}
                                            <div className="text-sm text-gray-700">
                                                <span className="font-semibold">Profesor:</span> {course.teachers?.name || 'No asignado'}
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
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="col-span-full">
                                <CardContent className="text-center py-12">
                                    <div className="text-2xl font-bold">0</div>
                                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos inscritos</h3>
                                    <p className="text-gray-500">Puedes inscribirte a nuevos cursos con un administrador.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}