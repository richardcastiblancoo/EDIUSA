// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

// Asegúrate de que esta variable esté definida en tu .env.local
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(req: Request) {
  if (!DEEPSEEK_KEY) {
    return NextResponse.json(
      {
        error:
          "Error: La clave DEEPSEEK_API_KEY no está configurada en las variables de entorno.",
      },
      { status: 500 }
    );
  }

  try {
    const deepseek = createOpenAI({
      baseURL: "https://api.deepseek.com/",
      apiKey: DEEPSEEK_KEY,
    });

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = await streamText({
      model: deepseek("deepseek-chat"),
      system: `Eres un asistente virtual especializado en el Centro de Idiomas de la Universidad Sergio Arboleda. Proporciona información precisa, profesional y amigable.`,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    // Manejo de errores detallado en la respuesta del servidor.
    let errorMessage =
      "Error interno del servidor al procesar la solicitud del chat.";
    if (error instanceof Error) {
      errorMessage += ` Detalles: ${error.message}`;
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
