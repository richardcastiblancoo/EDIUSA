"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Headphones,
  BookOpen,
  PenTool,
  FileText,
  Clock,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Monitor,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ExamSection {
  id: string;
  title: string;
  type: "listening" | "reading" | "use-of-language" | "writing";
  instruction: string;
  duration: number;
  questions: Question[];
  audioUrl?: string;
  textContent?: string;
}

interface Question {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  options?: string[];
  correctAnswer?: string;
  maxScore: number;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  totalDuration: number;
  course: {
    name: string;
  };
  sections: ExamSection[];
}

interface ModernExamInterfaceProps {
  exam: Exam;
  student?: {
    name: string;
  };
  onComplete: () => void;
}

export default function ModernExamInterface({
  exam,
  student,
  onComplete,
}: ModernExamInterfaceProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.totalDuration * 60);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<Record<string, boolean>>({});
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  const { user } = useAuth();

  const sectionIcons = {
    listening: Headphones,
    reading: BookOpen,
    "use-of-language": PenTool,
    writing: FileText,
  };

  // Colores en escala de grises y tonos oscuros
  const sectionColors = {
    listening: "bg-gray-700",
    reading: "bg-gray-600",
    "use-of-language": "bg-gray-800",
    writing: "bg-gray-900",
  };

  // Bloquear combinaciones de teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear Ctrl+C, Ctrl+V, Ctrl+A, etc.
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C' || 
            e.key === 'v' || e.key === 'V' ||
            e.key === 'a' || e.key === 'A' ||
            e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      
      // Bloquear F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Bloquear right click contextual
      if (e.key === 'ContextMenu') {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    if (examStarted && !examSubmitted) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);
      
      // Intentar deshabilitar selección de texto
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      
      // Restaurar selección de texto
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [examStarted, examSubmitted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleSubmitExam = async () => {
    setExamSubmitted(true);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleAudioPlay = (audioId: string) => {
    setAudioPlaying((prev) => ({ ...prev, [audioId]: !prev[audioId] }));
  };

  const getCurrentSection = () => exam.sections[currentSection];
  const getCurrentQuestion = () => getCurrentSection().questions[currentQuestion];

  const goToNextQuestion = () => {
    const currentSectionData = getCurrentSection();
    if (currentQuestion < currentSectionData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < exam.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      const prevSection = exam.sections[currentSection - 1];
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(prevSection.questions.length - 1);
    }
  };

  const getTotalQuestions = () => {
    return exam.sections.reduce((total, section) => total + section.questions.length, 0);
  };

  const getAnsweredQuestions = () => {
    return Object.keys(answers).length;
  };

  const getProgress = () => {
    const total = getTotalQuestions();
    const answered = getAnsweredQuestions();
    return total > 0 ? (answered / total) * 100 : 0;
  };

  if (examSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Card className="w-full max-w-md text-center border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-900">Examen Completado</CardTitle>
            <CardDescription className="text-gray-600">
              Has finalizado el examen exitosamente.
              <div className="mt-2">
                <p className="text-gray-700">Curso: {exam.course?.name}</p>
                <p className="text-gray-700">Estudiante: {student?.name}</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Tus respuestas han sido guardadas correctamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card className="border-gray-300 bg-gray-50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">{exam.title}</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Examen de {exam.subject} - Curso: {exam.course?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {exam.sections.map((section, index) => {
                const Icon = sectionIcons[section.type];
                return (
                  <Card key={section.id} className="border-l-4 border-l-gray-600 bg-white">
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                      <h3 className="font-semibold text-sm text-gray-900">{section.title}</h3>
                      <p className="text-xs text-gray-600">
                        {section.questions.length} preguntas
                      </p>
                      <p className="text-xs text-gray-600">
                        {section.duration} minutos
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <h3 className="font-semibold mb-2 text-gray-900">Instrucciones:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Lee cuidadosamente cada pregunta antes de responder</li>
                <li>• Puedes navegar entre las diferentes secciones del examen</li>
                <li>• Una vez que inicies el examen, el temporizador no se detendrá</li>
                <li>• Asegúrate de tener una conexión estable a internet</li>
                <li>• Durante el examen, la copia y pegado estarán deshabilitados</li>
                <li>• Tu pantalla y cámara serán monitoreadas durante el examen</li>
              </ul>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleStartExam} 
                size="lg" 
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Examen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSectionData = getCurrentSection();
  const currentQuestionData = getCurrentQuestion();
  const Icon = sectionIcons[currentSectionData.type];
  const sectionColor = sectionColors[currentSectionData.type];

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {/* Ventanas flotantes de monitoreo */}
      <div className="fixed top-4 left-4 z-50">
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Cámara activa</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-blue-50 border-blue-200 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Pantalla grabada</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card className="border-gray-300 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{exam.title}</h2>
              <p className="text-gray-600">Estudiante: {student?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2 bg-white">
                <Clock className="h-4 w-4 text-gray-700" />
                <span className="text-gray-700">{formatTime(timeLeft)}</span>
              </Badge>
              <Badge className={`${sectionColor} text-white`}>
                <Icon className="h-4 w-4 mr-1" />
                {currentSectionData.title}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">Progreso General</span>
              <span className="text-sm text-gray-600">
                {getAnsweredQuestions()} / {getTotalQuestions()} respondidas
              </span>
            </div>
            <Progress value={getProgress()} className="h-2 bg-gray-200" />
          </div>
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <Tabs value={currentSection.toString()} onValueChange={(value) => setCurrentSection(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-100">
          {exam.sections.map((section, index) => {
            const SectionIcon = sectionIcons[section.type];
            const isCompleted = section.questions.every(q => answers[q.id]);
            return (
              <TabsTrigger 
                key={section.id} 
                value={index.toString()} 
                className="relative data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-700"
              >
                <SectionIcon className="h-4 w-4 mr-2" />
                {section.title}
                {isCompleted && (
                  <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {exam.sections.map((section, sectionIndex) => (
          <TabsContent key={section.id} value={sectionIndex.toString()}>
            <Card className="border-gray-300 bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${sectionColor} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900">{section.title}</CardTitle>
                      <CardDescription className="text-gray-600">{section.instruction}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    {currentQuestion + 1} / {section.questions.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Player for Listening Section */}
                {section.type === "listening" && section.audioUrl && (
                  <Card className="bg-gray-100 border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleAudioPlay(section.id)}
                          className="border-gray-300"
                        >
                          {audioPlaying[section.id] ? (
                            <Pause className="h-4 w-4 text-gray-700" />
                          ) : (
                            <Play className="h-4 w-4 text-gray-700" />
                          )}
                        </Button>
                        <Volume2 className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <Progress value={audioProgress[section.id] || 0} className="h-2 bg-gray-300" />
                        </div>
                        <span className="text-sm text-gray-600">0:00 / 3:45</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reading Text Content */}
                {section.type === "reading" && section.textContent && (
                  <Card className="bg-gray-100 border-gray-300">
                    <CardContent className="p-4">
                      <div className="prose max-w-none">
                        <p className="text-gray-700">{section.textContent}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Question */}
                {currentQuestionData && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">
                        Pregunta {currentQuestion + 1}
                      </h3>
                      <p className="text-gray-700">{currentQuestionData.question}</p>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-3">
                      {currentQuestionData.type === "multiple-choice" && currentQuestionData.options && (
                        <div className="space-y-2">
                          {currentQuestionData.options.map((option, index) => (
                            <label key={index} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer bg-white">
                              <input
                                type="radio"
                                name={`question-${currentQuestionData.id}`}
                                value={option}
                                checked={answers[currentQuestionData.id] === option}
                                onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                                className="h-4 w-4 text-gray-700 border-gray-300 focus:ring-gray-500"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {currentQuestionData.type === "essay" && (
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg min-h-32 focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-700"
                          placeholder="Escribe tu respuesta aquí..."
                          value={answers[currentQuestionData.id] || ""}
                          onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                        />
                      )}

                      {currentQuestionData.type === "short-answer" && (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-700"
                          placeholder="Escribe tu respuesta..."
                          value={answers[currentQuestionData.id] || ""}
                          onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                  <Button
                    variant="outline"
                    onClick={goToPreviousQuestion}
                    disabled={currentSection === 0 && currentQuestion === 0}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="text-sm text-gray-600">
                    Sección {sectionIndex + 1} de {exam.sections.length}
                  </div>

                  {currentSection === exam.sections.length - 1 && 
                   currentQuestion === currentSectionData.questions.length - 1 ? (
                    <Button 
                      onClick={handleSubmitExam} 
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      Enviar Examen
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={goToNextQuestion}
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Security Alert */}
      <Alert className="bg-gray-100 border-gray-300">
        <Shield className="h-4 w-4 text-gray-700" />
        <AlertTitle className="text-gray-900">Modo Seguro Activado</AlertTitle>
        <AlertDescription className="text-gray-700">
          El examen se encuentra en modo seguro. La copia, pegado y acceso a herramientas de desarrollador están deshabilitados. Tu actividad está siendo monitoreada.
        </AlertDescription>
      </Alert>
    </div>
  );
}