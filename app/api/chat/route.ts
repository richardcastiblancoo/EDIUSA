// En tu archivo API (ej: src/app/api/chat/route.ts)

import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai" 

// 1. La clave de API de DeepSeek está en la variable OPENAI_API_KEY
const DEEPSEEK_KEY = process.env.OPENAI_API_KEY;


// Define el tipo de la respuesta HTTP
export async function POST(req: Request) {
  try {
    // Verificación de clave
    if (!DEEPSEEK_KEY) {
        return new Response("Error: Clave de API no configurada (OPENAI_API_KEY).", { status: 500 });
    }

    // 2. Inicialización del cliente DENTRO de POST (Solución para 404)
    // 💡 TRUCO AVANZADO: Apuntamos la baseURL al endpoint de chat/completions, 
    // esperando que el SDK use esta URL completa y no añada su sufijo /responses.
    const deepseek = createOpenAI({
        // ✅ Forzamos la URL base a la ruta de chat/completions
        baseURL: "https://api.deepseek.com/v1/chat/completions",
        apiKey: DEEPSEEK_KEY, 
    });


    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = await streamText({
      // 3. Usamos el modelo 'deepseek-chat' (solo el nombre del modelo, sin la ruta)
      model: deepseek("deepseek-chat"), 
      
      system: `Eres un asistente virtual especializado en el Centro de Idiomas de la Universidad Sergio Arboleda...`,
      
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}