"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getStudentExams } from "@/lib/exams";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Mic,
  Monitor,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import ExamInterface from "@/components/exam/exam-interface";
import { motion, AnimatePresence } from "framer-motion";

// Definiciones de tipo mínimas necesarias
interface Submission {
  score: number | null;
}

interface Course {
    name: string;
    level: string;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  total_questions: number;
  exam_type: string;
  due_date: string;
  is_active: boolean;
  max_attempts: number;
  exam_submissions?: Submission[];
  courses?: Course;
}

const calculateAverageScore = (studentExams: Exam[]) => {
  const scores = studentExams
    .filter((exam: Exam) => exam.exam_submissions?.[0]?.score !== null)
    .map((exam: Exam) => exam.exam_submissions?.[0]?.score);

  const numericScores = scores.filter((score): score is number => score !== null && score !== undefined); 
  
  if (numericScores.length > 0) {
    const rawAverage = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
    return rawAverage.toFixed(2);
  }
  return 0;
};

export default function StudentExamsPage() {
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExams();
    }
  }, [user]);

  const loadExams = async () => {
    setIsLoading(true);
    const exams = user ? (await getStudentExams(user.id)) as Exam[] : [];
    setAvailableExams(exams);
    setIsLoading(false);
  };

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    setExamStarted(true);
  };

  const handleExamComplete = () => {
    setExamStarted(false);
    setSelectedExam(null);
    loadExams();
  };

  const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3, ease: "easeInOut" },
  };

  const getAttemptsDisplay = (exam: Exam) => {
    const completedAttempts = exam.exam_submissions?.length || 0;
    const maxAttempts = exam.max_attempts;
    const remainingAttempts = maxAttempts - completedAttempts;

    if (remainingAttempts <= 0) {
      return (
        <div className="flex items-center gap-2 text-red-600 font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>Intentos agotados</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Intentos restantes:
        </span>
        <span className="font-semibold text-gray-900">{remainingAttempts}</span>
      </div>
    );
  };

  return (
    <DashboardLayout userRole="student">
      <AnimatePresence mode="wait">
        {examStarted && selectedExam ? (
          <motion.div
            key="exam-interface"
            initial={fadeInScale.initial}
            animate={fadeInScale.animate}
            exit={fadeInScale.exit}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            <ExamInterface
              exam={{ ...selectedExam, subject: selectedExam.courses?.name || "", course: selectedExam.courses || { name: "" } }}
              onComplete={handleExamComplete}
            />
          </motion.div>
        ) : (
          <motion.div key="exams-list" {...fadeInScale} transition={{ duration: 0.3, ease: "easeInOut" }}>
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Exámenes</h2>
                <p className="text-gray-600 mt-2">
                  Gestiona y realiza tus exámenes asignados
                </p>
              </div>

              {/* Security Notice */}
              <Alert className="bg-blue-50 border-blue-200">
                <Camera className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong className="font-semibold">Importante:</strong> Durante los exámenes se activará
                  automáticamente la cámara, micrófono y captura de pantalla
                  para garantizar la integridad académica.
                </AlertDescription>
              </Alert>

              {/* Monitoring Features */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Monitor className="h-5 w-5 text-gray-700" />
                    Sistema de Monitoreo
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Funciones de seguridad activas durante los exámenes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Camera className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cámara Web</p>
                        <p className="text-sm text-gray-600">
                          Monitoreo visual continuo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mic className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Audio</p>
                        <p className="text-sm text-gray-600">
                          Grabación de sonido ambiente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Monitor className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Pantalla</p>
                        <p className="text-sm text-gray-600">
                          Captura de actividad
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exams List */}
              <div className="grid gap-4">
                {isLoading ? (
                  <Card className="shadow-sm">
                    <CardContent className="text-center py-12">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 mx-auto"></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : availableExams.length === 0 ? (
                  <Card className="shadow-sm text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No tienes exámenes asignados en este momento.</p>
                    </CardContent>
                  </Card>
                ) : (
                  availableExams.map((exam) => {
                    const completedAttempts =
                      exam.exam_submissions?.length || 0;
                    const remainingAttempts =
                      exam.max_attempts - completedAttempts;
                    const isAvailable = exam.is_active && remainingAttempts > 0;
                    
                    const lastSubmission = exam.exam_submissions && exam.exam_submissions.length > 0
                        ? exam.exam_submissions[0] 
                        : null;
                    const score = lastSubmission?.score;

                    return (
                      <Card key={exam.id} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-gray-900">
                                <FileText className="h-5 w-5 text-gray-700" />
                                {exam.title}
                              </CardTitle>
                              <CardDescription className="text-gray-600 mt-1">
                                {exam.courses?.name} - {exam.courses?.level}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant={exam.is_active ? "default" : "secondary"}
                                className={exam.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-600"}
                              >
                                {exam.is_active ? "Disponible" : "No disponible"}
                              </Badge>
                              {score !== null && score !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="font-semibold border-blue-200 text-blue-700 bg-blue-50"
                                >
                                  Calificación: {score}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-700">
                                {exam.duration_minutes} minutos
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-700">
                                {exam.total_questions} preguntas
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">
                                Tipo:{" "}
                              </span>
                              <span className="text-gray-900 font-medium">{exam.exam_type}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">
                                Vence:{" "}
                              </span>
                              <span className="text-gray-900 font-medium">{new Date(exam.due_date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            {getAttemptsDisplay(exam)}

                            {isAvailable ? (
                              <Button 
                                onClick={() => handleStartExam(exam)}
                                className="bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                              >
                                Iniciar Examen
                              </Button>
                            ) : (
                              <Button 
                                disabled
                                className="bg-gray-100 text-gray-400 cursor-not-allowed shadow-sm"
                              >
                                Iniciar Examen
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}