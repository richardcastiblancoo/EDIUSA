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

interface ExamInterfaceProps {
  exam: any
  onComplete: () => void
}

export default function ExamInterface({ exam, onComplete }: ExamInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60) // Convert to seconds
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Mock questions
  const questions = [
    {
      id: 1,
      type: "multiple-choice",
      question: '¿Cuál es la forma correcta del presente perfecto de "go"?',
      options: ["have went", "have gone", "has go", "have go"],
      correctAnswer: "have gone",
    },
    {
      id: 2,
      type: "multiple-choice",
      question: 'Choose the correct preposition: "I am interested ___ learning English"',
      options: ["in", "on", "at", "for"],
      correctAnswer: "in",
    },
    {
      id: 3,
      type: "essay",
      question: "Describe your daily routine using present simple tense (minimum 100 words)",
      correctAnswer: "",
    },
  ]

  // Request media permissions and start monitoring
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request camera and microphone
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream
        }

        // Request screen capture
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

        // Start recording
        const combinedStream = new MediaStream([...cameraStream.getTracks(), ...screenStream.getTracks()])

        const mediaRecorder = new MediaRecorder(combinedStream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.start()
        setExamStarted(true)

        // Monitor for tab changes, window focus, etc.
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
      // Cleanup media streams
      Object.values(mediaStreams).forEach((stream) => {
        stream?.getTracks().forEach((track) => track.stop())
      })
    }
  }, [])

  // Timer countdown
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

  const handleSubmitExam = () => {
    // Stop all recordings
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    // Stop all media streams
    Object.values(mediaStreams).forEach((stream) => {
      stream?.getTracks().forEach((track) => track.stop())
    })

    // Submit exam data
    const examData = {
      examId: exam.id,
      answers,
      timeSpent: exam.duration * 60 - timeLeft,
      warnings,
      timestamp: new Date().toISOString(),
    }

    console.log("Exam submitted:", examData)
    alert("Examen enviado exitosamente")
    onComplete()
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

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

  return (
    <div className="space-y-6">
      {/* Exam Header */}
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

      {/* Monitoring Panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <video ref={videoRef} autoPlay muted className="w-full h-24 bg-gray-100 rounded object-cover" />
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Cámara activa</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Audio grabando</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Pantalla capturada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Panel */}
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
              <div className="text-lg font-medium">{questions[currentQuestion].question}</div>

              {questions[currentQuestion].type === "multiple-choice" ? (
                <RadioGroup
                  value={answers[currentQuestion] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                >
                  {questions[currentQuestion].options?.map((option, index) => (
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

      {/* Warnings */}
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
