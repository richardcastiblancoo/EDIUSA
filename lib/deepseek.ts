// lib/deepseek.ts
// Este archivo maneja la configuración y las utilidades para la API de Deepseek.

// Se recomienda usar variables de entorno para almacenar claves API de forma segura.
// Por ejemplo, en un archivo .env.local: DEEPSEEK_API_KEY="tu_clave_api_aqui"

export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/chat/completions";

if (!DEEPSEEK_API_KEY) {
  console.warn(
    "DEEPSEEK_API_KEY no está configurada. Asegúrate de establecerla en tus variables de entorno."
  );
}

/**
 * Función para realizar una solicitud a la API de Deepseek.
 * @param messages Array de mensajes en el formato de la API de Deepseek.
 * @param model El modelo de Deepseek a utilizar (por ejemplo, "deepseek-chat").
 * @param temperature La temperatura para la generación de texto.
 * @returns La respuesta de la API de Deepseek.
 */
export async function deepseekRequest(
  messages: Array<{ role: string; content: string }>,
  model: string = "deepseek-chat",
  temperature: number = 0.7
) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("La clave API de Deepseek no está configurada.");
  }

  try {
    const response = await fetch(DEEPSEEK_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: false, // Por ahora, no usaremos streaming para simplificar
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error de la API de Deepseek: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error al realizar la solicitud a Deepseek:", error);
    throw error;
  }
}