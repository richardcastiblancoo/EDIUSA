// imports del componente AIChat
"use client"
import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const suggestedQuestions = {
  coordinator: [
    "¿Cómo puedo generar reportes de estudiantes?",
    "¿Cuáles son las estadísticas de inscripciones?",
    "¿Cómo asigno profesores a cursos?",
    "¿Cómo gestiono los horarios de clases?",
  ],
  teacher: [
    "¿Cómo creo un nuevo examen?",
    "¿Cómo califico a mis estudiantes?",
    "¿Cómo veo la lista de mis cursos?",
    "¿Cómo subo material de clase?",
  ],
  student: [
    "¿Cuáles son mis próximos exámenes?",
    "¿Cómo veo mis calificaciones?",
    "¿Cuál es mi horario de clases?",
    "¿Cómo me inscribo en un curso?",
  ],
}

export default function AIChat() {
  const { user } = useAuth()
  const [input, setInput] = useState("")
  const { messages, sendMessage, status } = useChat({
    api: "/api/chat",
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: `¡Hola${user?.name ? ` ${user.name}` : ""}! Soy tu asistente virtual del Centro de Idiomas. ¿En qué puedo ayudarte hoy?`,
          },
        ],
      },
    ],
  })

  const getMessageText = (message: any) => {
    if (Array.isArray(message?.parts)) {
      return message.parts
        .map((p: any) => (p?.type === "text" ? p.text : ""))
        .join("")
    }
    return typeof message?.content === "string" ? message.content : ""
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const userRole = user?.role || "student"
  const questions = suggestedQuestions[userRole] || suggestedQuestions.student

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Asistente Virtual - Centro de Idiomas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{getMessageText(message)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(status === "submitted" || status === "streaming") && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">Escribiendo...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Preguntas sugeridas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {questions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3 text-xs bg-transparent"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (input.trim()) {
                sendMessage({ text: input })
                setInput("")
              }
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              disabled={status !== "ready"}
              className="flex-1"
            />
            <Button type="submit" disabled={status !== "ready" || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
