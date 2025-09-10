"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, Mic, Monitor, Clock, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { submitExamWithMonitoring, getExamQuestions } from "@/lib/exams"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface Question {
  id: number
  type: "multiple-choice" | "essay"
  question: string
  options?: string[]
  correctAnswer?: string
}

interface ExamInterfaceProps {
  exam: any
  onComplete: () => void
}

export default function ExamInterface({ exam, onComplete }: ExamInterfaceProps) {
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
  const { user } = useAuth()

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Cargar preguntas desde la BD
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const examQuestions = await getExamQuestions(exam.id)
        setQuestions(examQuestions)
      } catch (error) {
        console.error("Error cargando preguntas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [exam.id])

  // Pedir permisos de cámara, micro y pantalla
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        setMediaStreams({
          camera: cameraStream,
          screen: screenStream,
        })

        setMediaPermissions({
          camera: true,
          microphone: true,
          screen: true,
        })

        // Iniciar grabación
        const combinedStream = new MediaStream([...cameraStream.getTracks(), ...screenStream.getTracks()])
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm;codecs=vp9",
        })
        mediaRecorderRef.current = mediaRecorder

        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
            setRecordedChunks([...chunks])
          }
        }

        mediaRecorder.start(10000)
        setExamStarted(true)

        // Capturar pantalla cada 30s
        setInterval(() => {
          const videoTrack = screenStream.getVideoTracks()[0]
          const imageCapture = new (window as any).ImageCapture(videoTrack)
          imageCapture
            .grabFrame()
            .then((bitmap: ImageBitmap) => {
              const canvas = document.createElement("canvas")
              canvas.width = bitmap.width
              canvas.height = bitmap.height
              const context = canvas.getContext("2d")
              context?.drawImage(bitmap, 0, 0)
              const screenshot = canvas.toDataURL("image/jpeg")
              setScreenCaptures((prev) => [...prev, screenshot])
            })
            .catch((error: Error) => {
              console.error("Error capturing screen:", error)
            })
        }, 30000)

        // Detectar cambios de pestaña/ventana
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
          document.removeEventListener("visibilitychange", handleVisibilityChange)
          window.removeEventListener("blur", handleBlur)
        }
      } catch (error) {
        console.error("Error requesting permissions:", error)
        alert("Se requieren permisos de cámara, micrófono y pantalla para realizar el examen.")
      }
    }

    requestPermissions()

    return () => {
      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
    }
  }, [])

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
  }, [examStarted])

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
      // Stop all recordings
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }

      // Stop all media streams
      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })

      let recordingUrl = null

      // Solo intentar subir la grabación si hay chunks grabados
      if (recordedChunks.length > 0) {
        // Crear un blob con todos los chunks grabados
        const recordingBlob = new Blob(recordedChunks, { type: 'video/webm' })
        
        const recordingFile = new File([recordingBlob], `exam_${exam.id}_${user.id}_${Date.now()}.webm`, {
          type: 'video/webm'
        })
        
        // Subir el archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('exam-recordings')
          .upload(`recordings/${recordingFile.name}`, recordingFile)
        
        if (uploadError) throw uploadError
        
        // Obtener la URL pública solo si la subida fue exitosa
        const { data: publicUrlData } = supabase.storage
          .from('exam-recordings')
          .getPublicUrl(`recordings/${recordingFile.name}`)
        
        recordingUrl = publicUrlData?.publicUrl
      }

      // Submit exam data
      const examData = {
        exam_id: exam.id,
        student_id: user.id,
        answers,
        time_spent: exam.duration_minutes * 60 - timeLeft, // Corregido a duration_minutes
        warnings,
        recording_url: recordingUrl,
        screen_captures: screenCaptures
      }

      const submitted = await submitExamWithMonitoring(examData)
      if (submitted) {
        onComplete()
      } else {
        throw new Error("Error al enviar el examen")
      }
    } catch (error) {
      console.error("Error al enviar el examen:", error)
      alert("Hubo un error al enviar el examen. Por favor, contacta al soporte técnico.")
    }
  }

  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0

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
                {mediaPermissions.camera && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className="flex items-center gap-3">
                <Mic className={`h-5 w-5 ${mediaPermissions.microphone ? "text-green-600" : "text-gray-400"}`} />
                <span>Micrófono</span>
                {mediaPermissions.microphone && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className="flex items-center gap-3">
                <Monitor className={`h-5 w-5 ${mediaPermissions.screen ? "text-green-600" : "text-gray-400"}`} />
                <span>Captura de Pantalla</span>
                {mediaPermissions.screen && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestionData = questions[currentQuestion]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{exam.title}</h2>
          <p className="text-muted-foreground">{exam.subject}</p>
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

      {/* Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Monitor */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <video ref={videoRef} autoPlay muted className="w-full h-24 bg-gray-100 rounded object-cover" />
          </CardContent>
        </Card>

        {/* Preguntas */}
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

      {/* Advertencias */}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Advertencias del sistema:</p>
              {warnings.slice(-3).map((warning, index) => (
                <p key={index} className="text-sm">
                  {warning}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}