import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai" 
const DEEPSEEK_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!DEEPSEEK_KEY) {
        return new Response("Error: Clave de API no configurada (OPENAI_API_KEY).", { status: 500 });
    }
    const deepseek = createOpenAI({
        baseURL: "https://api.deepseek.com/v1/chat/completions",
        apiKey: DEEPSEEK_KEY, 
    });

    const { messages }: { messages: UIMessage[] } = await req.json()
    const result = await streamText({
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