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
import { motion, AnimatePresence } from "framer-motion"

export default function StudentExamsPage() {
    const { user } = useAuth()
    const [selectedExam, setSelectedExam] = useState(null)
    const [examStarted, setExamStarted] = useState(false)
    const [availableExams, setAvailableExams] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadExams()
        }
    }, [user])

    const loadExams = async () => {
        setIsLoading(true)
        const exams = user ? await getStudentExams(user.id) : []
        setAvailableExams(exams)
        setIsLoading(false)
    }

    const handleStartExam = (exam) => {
        setSelectedExam(exam)
        setExamStarted(true)
    }

    const handleExamComplete = () => {
        setExamStarted(false)
        setSelectedExam(null)
        loadExams()
    }

    const fadeInScale = {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.3, ease: "easeInOut" },
    }

    // Lógica para mostrar los intentos restantes
    const getAttemptsDisplay = (exam) => {
        const completedAttempts = exam.exam_submissions?.length || 0
        const maxAttempts = exam.max_attempts
        const remainingAttempts = maxAttempts - completedAttempts

        if (remainingAttempts <= 0) {
            return (
                <div className="flex items-center gap-2 text-red-600 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Intentos agotados</span>
                </div>
            )
        }
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Intentos restantes:</span>
                <span className="font-semibold">{remainingAttempts}</span>
            </div>
        )
    }

    return (
        <DashboardLayout userRole="student">
            <AnimatePresence mode="wait">
                {examStarted && selectedExam ? (
                    <motion.div key="exam-interface" {...fadeInScale}>
                        <ExamInterface exam={selectedExam} onComplete={handleExamComplete} />
                    </motion.div>
                ) : (
                    <motion.div key="exams-list" {...fadeInScale}>
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
                                {isLoading ? (
                                    <Card>
                                        <CardContent className="text-center py-10 animate-pulse">
                                            <p className="text-muted-foreground">Cargando exámenes...</p>
                                        </CardContent>
                                    </Card>
                                ) : availableExams.length === 0 ? (
                                    <Card>
                                        <CardContent className="text-center py-10">
                                            <p>No tienes exámenes asignados en este momento.</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    availableExams.map((exam) => {
                                        const completedAttempts = exam.exam_submissions?.length || 0
                                        const remainingAttempts = exam.max_attempts - completedAttempts
                                        const isAvailable = exam.is_active && remainingAttempts > 0

                                        return (
                                            <Card key={exam.id}>
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="flex items-center gap-2">
                                                                <FileText className="h-5 w-5" />
                                                                {exam.title}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {exam.courses?.name} - {exam.courses?.level}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge variant={exam.is_active ? "default" : "secondary"}>
                                                                {exam.is_active ? "Disponible" : "No disponible"}
                                                            </Badge>
                                                            {exam.exam_submissions && exam.exam_submissions.length > 0 && exam.exam_submissions[0]?.score !== null && (
                                                                <Badge variant="outline" className="font-semibold">
                                                                    Calificación: {exam.exam_submissions[0].score}%
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{exam.duration_minutes} minutos</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{exam.total_questions} preguntas</span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">Tipo: </span>
                                                            {exam.exam_type}
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">Vence: </span>
                                                            {new Date(exam.due_date).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        {getAttemptsDisplay(exam)}

                                                        {isAvailable ? (
                                                            <Button onClick={() => handleStartExam(exam)}>Iniciar Examen</Button>
                                                        ) : (
                                                            <Button disabled>Iniciar Examen</Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    )
}