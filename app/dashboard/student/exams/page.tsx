"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Mic, Monitor, Clock, FileText, CheckCircle } from "lucide-react"
import ExamInterface from "@/components/exam/exam-interface"

export default function StudentExamsPage() {
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [examStarted, setExamStarted] = useState(false)

  const availableExams = [
    {
      id: 1,
      subject: "Inglés Intermedio",
      title: "Examen Final - Unidad 5",
      duration: 90,
      questions: 25,
      type: "Mixto",
      status: "available",
      dueDate: "25 Enero 2024",
      attempts: 0,
      maxAttempts: 2,
    },
    {
      id: 2,
      subject: "Francés Básico",
      title: "Quiz - Vocabulario",
      duration: 30,
      questions: 15,
      type: "Opción Múltiple",
      status: "available",
      dueDate: "28 Enero 2024",
      attempts: 1,
      maxAttempts: 3,
    },
    {
      id: 3,
      subject: "Inglés Intermedio",
      title: "Examen Parcial - Unidad 4",
      duration: 60,
      questions: 20,
      type: "Mixto",
      status: "completed",
      dueDate: "15 Enero 2024",
      attempts: 1,
      maxAttempts: 1,
      score: 85,
    },
  ]

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam)
    setExamStarted(true)
  }

  const handleExamComplete = () => {
    setExamStarted(false)
    setSelectedExam(null)
    // Refresh exams list
  }

  if (examStarted && selectedExam) {
    return (
      <DashboardLayout userRole="student">
        <ExamInterface exam={selectedExam} onComplete={handleExamComplete} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exámenes</h2>
          <p className="text-muted-foreground">Gestiona y realiza tus exámenes</p>
        </div>

        {/* Security Notice */}
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Durante los exámenes se activará automáticamente la cámara, micrófono y captura
            de pantalla para garantizar la integridad académica.
          </AlertDescription>
        </Alert>

        {/* Monitoring Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Sistema de Monitoreo
            </CardTitle>
            <CardDescription>Funciones de seguridad activas durante los exámenes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Camera className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Cámara Web</p>
                  <p className="text-sm text-muted-foreground">Monitoreo visual continuo</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Mic className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Audio</p>
                  <p className="text-sm text-muted-foreground">Grabación de sonido ambiente</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Monitor className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">Pantalla</p>
                  <p className="text-sm text-muted-foreground">Captura de actividad</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        <div className="grid gap-4">
          {availableExams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {exam.title}
                    </CardTitle>
                    <CardDescription>{exam.subject}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      exam.status === "available"
                        ? "default"
                        : exam.status === "completed"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {exam.status === "available"
                      ? "Disponible"
                      : exam.status === "completed"
                        ? "Completado"
                        : "Vencido"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{exam.duration} minutos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{exam.questions} preguntas</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tipo: </span>
                    {exam.type}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Vence: </span>
                    {exam.dueDate}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Intentos: {exam.attempts}/{exam.maxAttempts}
                    {exam.status === "completed" && exam.score && (
                      <span className="ml-4 font-medium text-green-600">Calificación: {exam.score}/100</span>
                    )}
                  </div>

                  {exam.status === "available" && exam.attempts < exam.maxAttempts && (
                    <Button onClick={() => handleStartExam(exam)}>Iniciar Examen</Button>
                  )}

                  {exam.status === "completed" && (
                    <Button variant="outline" disabled>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Completado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
