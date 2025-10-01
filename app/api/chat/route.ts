import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { google } from "@ai-sdk/google" // Proveedor para Gemini

export async function POST(req: Request) {
  try {
    // ⚠️ PRUEBA TEMPORAL DE DEPURACIÓN (VERIFICAR EN LOS LOGS)
    // Esto se ejecuta primero para ver si la variable de entorno está disponible.
    const apiKeyStatus = process.env.GEMINI_API_KEY 
        ? "Clave GEMINI_API_KEY cargada correctamente (length: " + process.env.GEMINI_API_KEY.length + ")" 
        : "⚠️ ERROR: Clave GEMINI_API_KEY no cargada o es undefined";
    console.log("Estado de la API Key:", apiKeyStatus); 
    // ⚠️ Una vez que funcione, puedes eliminar estas líneas.

    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
      // Usamos el modelo gemini-2.5-flash
      model: google("gemini-2.5-flash"), 
      
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
    // Esto mostrará el error real (por ejemplo, "401 Unauthenticated") en los logs del servidor
    console.error("Chat API error:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}