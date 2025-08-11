import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
      model: openai("gpt-3.5-turbo"),
      system: `Eres un asistente virtual especializado en el Centro de Idiomas de la Universidad Sergio Arboleda. 
      
      Tu función es ayudar a usuarios con diferentes roles:
      - Coordinadores: gestión administrativa, reportes, asignación de profesores
      - Profesores: creación de exámenes, calificaciones, gestión de cursos
      - Estudiantes: consultas sobre horarios, exámenes, calificaciones, inscripciones
      
      Responde de manera amigable, profesional y en español. Proporciona información específica y útil sobre el sistema de gestión académica.
      
      Si no tienes información específica sobre algo, sugiere contactar al coordinador o revisar la documentación del sistema.`,
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
