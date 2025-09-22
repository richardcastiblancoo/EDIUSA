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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false) // Added this line

  const { user } = useAuth()

  const videoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const setupExam = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('exam_submissions')
        .select('score')
        .eq('exam_id', exam.id)
        .eq('student_id', user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setAlreadyCompleted(true);
        setExamScore(data.score);
        setLoading(false);
        return;
      }

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
    }

    setupExam()

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

    return () => {
      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [exam.id, mediaStreams, user])

  const startMonitoring = async () => {
    setPermissionError(null)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasCamera = devices.some(d => d.kind === 'videoinput')
      const hasMic = devices.some(d => d.kind === 'audioinput')
      
      let cameraStream: MediaStream | null = null;
      let screenStream: MediaStream | null = null;

      if (hasCamera && hasMic) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          })
          setMediaPermissions(prev => ({ ...prev, camera: true, microphone: true }));
        } catch (error) {
          console.error("Error al obtener la cámara/micrófono:", error);
          setPermissionError("No se pudo iniciar la cámara o el micrófono. El examen continuará sin el monitoreo de video/audio.");
          setMediaPermissions(prev => ({ ...prev, camera: false, microphone: false }));
        }
      } else {
        setPermissionError("No se detectaron dispositivos de cámara o micrófono. El examen continuará sin el monitoreo de video/audio.");
        setMediaPermissions(prev => ({ ...prev, camera: false, microphone: false }));
      }

      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        setMediaPermissions(prev => ({ ...prev, screen: true }));
      } catch (error) {
        console.error("Error al obtener la captura de pantalla:", error);
        setPermissionError(prev => prev ? `${prev} También hubo un problema con la captura de pantalla.` : "No se pudo iniciar la captura de pantalla. El examen continuará sin esta función.");
        setMediaPermissions(prev => ({ ...prev, screen: false }));
      }

      if (cameraStream || screenStream) {
        if (videoRef.current && cameraStream) {
          videoRef.current.srcObject = cameraStream
        }
        if (screenVideoRef.current && screenStream) {
          screenVideoRef.current.srcObject = screenStream
        }

        const tracks = [];
        if (cameraStream) tracks.push(...cameraStream.getTracks());
        if (screenStream) tracks.push(...screenStream.getTracks());

        const combinedStream = new MediaStream(tracks);
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm"
        const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: mime })
        mediaRecorderRef.current = mediaRecorder

        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }

        mediaRecorder.start(10000)
        setRecordedChunks(chunks)
      } else {
        console.error("No se pudo iniciar ningún tipo de monitoreo.");
      }

      setExamStarted(true);

    } catch (error: any) {
      console.error("Error al iniciar el monitoreo:", error);
      setPermissionError(`Error inesperado al iniciar el monitoreo: ${error?.message || "desconocido"}. El examen continuará.`);
      setExamStarted(true);
    }
  }

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
          .maybeSingle();

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
                <p>Curso: {exam.course?.name}</p>
                <p>Estudiante: {student?.name}</p>
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

  if (loading) {
    return <div>Cargando preguntas...</div>
  }

  if (!examStarted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Permisos requeridos</CardTitle>
            <CardDescription>Antes de iniciar, otorga permisos para cámara, micrófono y pantalla.</CardDescription>
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

              {permissionError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Problema con los permisos</AlertTitle>
                  <AlertDescription>{permissionError}</AlertDescription>
                </Alert>
              )}

              <div className="pt-2">
                <Button onClick={startMonitoring} className="w-full">
                  Iniciar examen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Consejo: cierra otras aplicaciones que podrían estar usando la cámara o el micrófono (Zoom, Teams, Meet, OBS, etc.).
              </p>
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

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{exam.title}</h2>
          <p className="text-muted-foreground">Curso: {exam.course?.name}</p>
          <p className="text-muted-foreground">Estudiante: {student?.name}</p>
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
                  <Button onClick={() => setConfirmOpen(true)} className="bg-green-600 hover:bg-green-700">
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

      {/* Diálogo de confirmación antes de enviar */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar el examen ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              Asegúrate de haber revisado todas tus respuestas. Una vez enviado, no podrás modificarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir revisando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                handleSubmitExam()
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Sí, enviar ahora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}