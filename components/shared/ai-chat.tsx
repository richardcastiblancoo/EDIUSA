"use client";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Mic, Plus, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// 🚀 Preguntas Sugeridas Completadas
const suggestedQuestions = {
  coordinator: [
   
  ],
  teacher: [
   
  ],
  student: [
    
  ],
};
// ------------------------------------

export default function AIChat() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/chat",
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: `¡Hola${user?.name ? `, ${user.name}` : ""}! Soy tu asistente virtual. ¿En qué puedo ayudarte?`,
          },
        ],
      },
    ],
    onFinish: () => {
      setInput("");
    },
  });

  // Efecto para hacer scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, status]);

  const getMessageText = (message: any) => {
    if (Array.isArray(message?.parts)) {
      return message.parts
        .map((p: any) => (p?.type === "text" ? p.text : ""))
        .join("");
    }
    return typeof message?.content === "string" ? message.content : "";
  };

  const handleSuggestedQuestion = (question: string) => {
    // Si el usuario ya está logueado, se envía el rol implícitamente por el contexto.
    // Aunque el backend pregunta, es mejor dar un contexto inicial claro.
    const rolePrefix = user?.role ? `(Mi rol es ${user.role}). ` : '';
    sendMessage({ text: rolePrefix + question });
  };

  // Lógica de envío simplificada: solo maneja texto
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = input.trim();

    if (!textToSend) {
      return;
    }

    sendMessage({ text: textToSend });
    setInput("");
  };

  // 💡 Lógica para determinar el rol y las preguntas
  const userRole = (user?.role || "student") as keyof typeof suggestedQuestions;
  const questions = suggestedQuestions[userRole] || suggestedQuestions.student;

  const isWelcomeScreen = messages.length === 1 && messages[0].id === "welcome";

  return (
    // Contenedor principal: Ocupa todo el espacio vertical disponible (ajustado para el dashboard)
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-5xl mx-auto dark:bg-slate-950 relative">
      
      {/* Área de Scroll para mensajes (flex-1 para ocupar el espacio restante) */}
      {/* Se usa pb-40 para evitar que el input fijo tape el último mensaje */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-8 overflow-y-auto pb-40">
        <div className="flex flex-col min-h-full">
          
          {isWelcomeScreen ? (
            // Diseño de Bienvenida Centrado
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 animate-in fade-in zoom-in">
                Hola, {user?.name || "usuario"}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
                Soy tu Asistente AI, especialista en la gestión del Centro de Idiomas.
              </p>
            </div>
          ) : (
            // Mensajes de Chat (Conversación)
            <div className="space-y-6 pt-8 max-w-3xl mx-auto w-full">
              {messages.map((message) => {
                const textContent = getMessageText(message);
                const isUser = message.role === "user";

                if (message.id === "welcome") return null;

                return (
                  <div
                    key={message.id}
                    className={`flex w-full transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-bottom-2 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className={`max-w-[85%] flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                        ${isUser ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-800"}`}
                      >
                        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-purple-500 dark:text-purple-400" />}
                      </div>
                      
                      {/* Contenido del Mensaje */}
                      <div
                        className={`rounded-xl px-4 py-3 shadow-md transition-all duration-300 whitespace-pre-wrap ${
                          isUser 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-gray-100 rounded-tl-none"
                        }`}
                      >
                        {textContent && <p className="text-sm">{textContent}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Indicador de Carga del Bot */}
              {(status === "submitted" || status === "streaming") && (
                <div className="flex gap-3 justify-start transition-opacity duration-300">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-gray-100 dark:bg-slate-700 shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce-delay" style={{ animationDelay: '0s' }}></span>
                          <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce-delay" style={{ animationDelay: '0.2s' }}></span>
                          <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce-delay" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="text-center text-red-500 text-sm mt-4">
                  Error: No se pudo conectar con el asistente.
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Área de Input Fijo (Footer Fixed) - ANCLADO Y CENTRADO */}
      <div 
          // fixed bottom-0 left-0 right-0 y items-center centran el contenido
          className="fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center pt-4 pb-8 border-t dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950"
      >
        {/* max-w-3xl y mx-auto centran el formulario */}
        <div className="max-w-3xl w-full mx-auto px-4 md:px-0">
            
            {/* Preguntas Sugeridas (solo en la pantalla de bienvenida) */}
            {isWelcomeScreen && questions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4">
                    {questions.map((question, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            className="h-auto py-3 px-4 text-sm bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 text-left justify-start"
                            onClick={() => handleSuggestedQuestion(question)}
                        >
                            <MessageSquare className="h-4 w-4 mr-2 text-gray-500" /> {question}
                        </Button>
                    ))}
                </div>
            )}
            
            {/* Formulario de Entrada tipo Píldora (Gemini Style) */}
            <form 
                onSubmit={handleSend} 
                className="flex items-center gap-2 relative bg-gray-100 dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 p-2 pl-4 animate-in fade-in-0 slide-in-from-bottom-2"
            >
                
                {/* Botón de Adjuntar/Herramientas (Más) */}
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-gray-500 hover:text-blue-600 transition-colors"
                    disabled={status !== "ready"}
                    onClick={() => { /* Abrir menú de herramientas si hay más de una */ }}
                >
                    <Plus className="h-5 w-5" />
                </Button>

                {/* Campo de Texto */}
                <Input
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregunta al Asistente AI"
                    disabled={status !== "ready"}
                    className="flex-1 h-10 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { 
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                />
                
                {/* Botón de Micrófono (futura función de audio) */}
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-gray-500 hover:text-purple-600 transition-colors"
                    disabled={status !== "ready"}
                    onClick={() => alert("La función de audio está en desarrollo.")}
                >
                    <Mic className="h-5 w-5" />
                </Button>

                {/* Botón de Envío */}
                <Button 
                    type="submit" 
                    disabled={status !== "ready" || !input.trim()}
                    className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-transform duration-200 hover:scale-105"
                >
                    <Send className="h-5 w-5 -rotate-45" />
                </Button>
            </form>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                El asistente puede cometer errores. Verifica la información importante.
            </p>
        </div>
      </div>
    </div>
  );
}