"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, Mic, Monitor, Clock, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, XCircle } from "lucide-react"
import { submitExamWithMonitoring, getExamQuestions } from "@/lib/exams"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Question {
  id: number
  type: "multiple-choice" | "essay"
  question: string
  options?: string[]
}

interface Exam {
  id: string
  title: string
  subject: string
  duration_minutes: number
  course: {
    name: string
  }
}

interface ExamInterfaceProps {
  exam: Exam
  student: {
    name: string
  }
  onComplete: () => void
}

export default function ExamInterface({ exam, student, onComplete }: ExamInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60)
  const [mediaPermissions, setMediaPermissions] = useState({
    camera: false,
    microphone: false,
    screen: false,
  })
  const [mediaStreams, setMediaStreams] = useState<{
    camera?: MediaStream
    screen?: MediaStream
  }>({})
  const [examStarted, setExamStarted] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [screenCaptures, setScreenCaptures] = useState<string[]>([])
  const [examSubmitted, setExamSubmitted] = useState(false)
  const [examScore, setExamScore] = useState<number | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false) // Nuevo estado
  
  const { user } = useAuth()

  const videoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Cargar preguntas y solicitar permisos.
  useEffect(() => {
    const setupExam = async () => {
      // 1. Verificar si el examen ya se ha completado
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exam_submissions')
        .select('score')
        .eq('exam_id', exam.id)
        .eq('student_id', user.id)
        .limit(1)
        .single();
      
      if (data) {
        setAlreadyCompleted(true);
        setExamScore(data.score); // Si ya se completó, muestra la nota
        setLoading(false);
        return; // Salir de la función si ya se completó
      }

      // 2. Si no se ha completado, cargar preguntas
      try {
        const examQuestions = await getExamQuestions(exam.id)
        setQuestions(examQuestions.map(q => ({
          id: Number(q.id),
          type: q.question_type === "essay" ? "essay" : "multiple-choice",
          question: q.question_text || '',
          options: q.options || [],
        })))
      } catch (error) {
        console.error("Error cargando preguntas:", error)
      } finally {
        setLoading(false)
      }

      // 3. Pedir permisos y empezar a grabar
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream
        }

        setMediaStreams({ camera: cameraStream, screen: screenStream })
        setMediaPermissions({ camera: true, microphone: true, screen: true })

        const combinedStream = new MediaStream([...cameraStream.getTracks(), ...screenStream.getTracks()])
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm;codecs=vp9",
        })
        mediaRecorderRef.current = mediaRecorder

        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        mediaRecorder.start(10000)
        setExamStarted(true)
        setRecordedChunks(chunks);

      } catch (error) {
        console.error("Error requesting permissions:", error)
        alert("Se requieren permisos de cámara, micrófono y pantalla para realizar el examen.")
      }
    }

    setupExam()

    // 4. Configurar eventos de monitoreo (visibilidad y foco)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((prev) => [
          ...prev,
          `Advertencia: Cambio de pestaña detectado a las ${new Date().toLocaleTimeString()}`,
        ])
      }
    }

    const handleBlur = () => {
      setWarnings((prev) => [
        ...prev,
        `Advertencia: Ventana perdió el foco a las ${new Date().toLocaleTimeString()}`,
      ])
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    // 5. Limpieza de streams y eventos
    return () => {
      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [exam.id, mediaStreams, user]) // Añadir `user` a las dependencias

  // Timer
  useEffect(() => {
    if (!examStarted) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examStarted, timeLeft])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const handleSubmitExam = async () => {
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }

      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
      
      let recordingUrl = null

      if (recordedChunks.length > 0) {
        const recordingBlob = new Blob(recordedChunks, { type: 'video/webm' })

        try {
          if (!user?.id) {
            throw new Error('Usuario no autenticado')
          }
          const timestamp = Date.now()
          const filename = `exam_${exam.id}_${user.id}_${timestamp}.webm`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('exam-recordings')
            .upload(filename, recordingBlob, {
              contentType: 'video/webm',
              cacheControl: '3600'
            })

          if (uploadError) {
            throw uploadError
          }
          
          const { data: publicUrlData } = supabase.storage
            .from('exam-recordings')
            .getPublicUrl(uploadData.path)
          
          recordingUrl = publicUrlData?.publicUrl
          
        } catch (uploadError) {
          console.error('Error uploading recording:', uploadError)
          alert('Error al subir la grabación. El examen se enviará sin ella.')
          recordingUrl = null 
        }
      }

      const examData = {
        exam_id: exam.id,
        student_id: user?.id || '',
        answers,
        time_spent: exam.duration_minutes * 60 - timeLeft,
        warnings,
        recording_url: recordingUrl,
        screen_captures: screenCaptures
      }

      const submitted = await submitExamWithMonitoring({
        ...examData,
        exam_id: String(exam.id),
        recording_url: recordingUrl || undefined
      })
      
      if (submitted) {
        const { data: submissionData } = await supabase
          .from('exam_submissions')
          .select('score')
          .eq('exam_id', exam.id)
          .eq('student_id', user?.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .single()

        if (submissionData?.score !== undefined) {
          setExamScore(submissionData.score)
        }
        setExamSubmitted(true)
      } else {
        throw new Error("Error al enviar el examen")
      }
    } catch (error) {
      console.error("Error al enviar el examen:", error)
      alert(`Error al enviar el examen: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, contacta al soporte técnico.`)
    }
  }

  // Lógica de renderizado condicional
  if (alreadyCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Examen ya completado</CardTitle>
            <CardDescription>
              Ya has realizado el examen {exam.title}. No puedes volver a presentarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Tu calificación:</h3>
              <div className="text-4xl font-bold text-primary">
                {examScore !== null ? `${examScore}%` : 'No disponible'}
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={onComplete}>
                Volver a mis exámenes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Examen Completado</CardTitle>
            <CardDescription>
              Has finalizado el examen {exam.title}
              <div className="mt-2">
                <p>Curso: {exam.course.name}</p>
                <p>Estudiante: {student.name}</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Tu calificación:</h3>
              <div className="text-4xl font-bold text-primary">
                {examScore !== null ? `${examScore}%` : 'Calculando...'}
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={onComplete}>
                Volver a mis exámenes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alreadyCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Examen ya completado</CardTitle>
            <CardDescription>
              Ya has realizado el examen {exam.title}
              <div className="mt-2">
                <p>Curso: {exam.course.name}</p>
                <p>Estudiante: {student.name}</p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Tu calificación:</h3>
              <div className="text-4xl font-bold text-primary">
                {examScore !== null ? `${examScore}%` : 'No disponible'}
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={onComplete}>
                Volver a mis exámenes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div>Cargando preguntas...</div>
  }

  if (!examStarted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurando Sistema de Monitoreo</CardTitle>
            <CardDescription>Verificando permisos y configurando grabación...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Camera className={`h-5 w-5 ${mediaPermissions.camera ? "text-green-600" : "text-gray-400"}`} />
                <span>Cámara</span>
                {mediaPermissions.camera ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              </div>
              <div className="flex items-center gap-3">
                <Mic className={`h-5 w-5 ${mediaPermissions.microphone ? "text-green-600" : "text-gray-400"}`} />
                <span>Micrófono</span>
                {mediaPermissions.microphone ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              </div>
              <div className="flex items-center gap-3">
                <Monitor className={`h-5 w-5 ${mediaPermissions.screen ? "text-green-600" : "text-gray-400"}`} />
                <span>Captura de Pantalla</span>
                {mediaPermissions.screen ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestionData = questions[currentQuestion]
  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="fixed top-4 right-4 flex flex-col gap-4 z-50">
        <div className="relative w-48 h-36 bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="relative w-48 h-36 bg-black rounded-lg overflow-hidden">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2">
            <Monitor className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      // En la sección donde se muestra el título del examen
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{exam.title}</h2>
          <p className="text-muted-foreground">Curso: {exam.course.name}</p>
          <p className="text-muted-foreground">Estudiante: {student.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Grabando</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Pregunta {currentQuestion + 1} de {questions.length}
              </CardTitle>
              <Progress value={progress} className="w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-lg font-medium">{currentQuestionData.question}</div>

              {currentQuestionData.type === "multiple-choice" ? (
                <RadioGroup
                  value={answers[currentQuestion] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                >
                  {currentQuestionData.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  className="min-h-32"
                />
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button onClick={handleSubmitExam} className="bg-green-600 hover:bg-green-700">
                    Enviar Examen
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}>
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Advertencias del sistema:</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              {warnings.slice(-3).map((warning, index) => (
                <p key={index} className="text-sm">{warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}