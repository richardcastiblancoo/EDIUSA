"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getStudentExams } from "@/lib/exams"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Mic, Monitor, Clock, FileText, CheckCircle } from "lucide-react"
import ExamInterface from "@/components/exam/exam-interface"

export default function StudentExamsPage() {
  const { user } = useAuth()
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [examStarted, setExamStarted] = useState(false)
  const [availableExams, setAvailableExams] = useState([])

  useEffect(() => {
    if (user) {
      loadExams()
    }
  }, [user])

  const loadExams = async () => {
    const exams = user ? await getStudentExams(user.id) : []
    setAvailableExams(exams as any[])
  }

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam)
    setExamStarted(true)
  }

  const handleExamComplete = () => {
    setExamStarted(false)
    setSelectedExam(null)
    loadExams() // Recargar la lista de exámenes
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
          {availableExams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <p>No tienes exámenes asignados en este momento.</p>
              </CardContent>
            </Card>
          ) : (
            availableExams.map((exam) => (
              <Card key={(exam as { id: string }).id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {(exam as { title: string }).title}
                      </CardTitle>
                      <CardDescription>
                        {(exam as any).courses?.name} - {(exam as any).courses?.level}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={(exam as { is_active: boolean }).is_active ? "default" : "secondary"}>
                        {(exam as { is_active: boolean }).is_active ? "Disponible" : "No disponible"}
                      </Badge>
                      {(exam as any).exam_submissions && (exam as any).exam_submissions.length > 0 && (exam as any).exam_submissions[0]?.score !== null && (
                        <Badge variant="outline" className="font-semibold">
                          Calificación: {(exam as any).exam_submissions[0].score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{(exam as any).duration_minutes} minutos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{(exam as any).total_questions} preguntas</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tipo: </span>
                      {(exam as any).exam_type}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Vence: </span>
                      {new Date((exam as any).due_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Intentos máximos: {(exam as any).max_attempts}
                    </div>

                    {(exam as { is_active: boolean }).is_active && (
                      <Button onClick={() => handleStartExam(exam)}>Iniciar Examen</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
