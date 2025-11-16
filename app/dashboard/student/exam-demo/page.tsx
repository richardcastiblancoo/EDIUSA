"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ModernExamInterface from "@/components/exam/modern-exam-interface";

// Componente para el sistema de monitoreo
const MonitoringSystem = () => {
  const [monitoringStatus, setMonitoringStatus] = useState({
    camera: false,
    microphone: false,
    screen: false
  });

  useEffect(() => {
    // Simular activación del sistema de monitoreo
    const activateMonitoring = async () => {
      try {
        // En un entorno real, aquí iría la lógica para acceder a los dispositivos
        console.log("Activando sistema de monitoreo...");
        
        setMonitoringStatus({
          camera: true,
          microphone: true,
          screen: true
        });

        // Simular permisos de dispositivos
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
      } catch (error) {
        console.error("Error al activar monitoreo:", error);
        alert("No se pudo activar el monitoreo. Por favor, permite el acceso a cámara y micrófono.");
      }
    };

    activateMonitoring();
  }, []);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Sistema de Monitoreo Activo
          </h3>
          <p className="text-red-600 text-sm mt-1">
            Durante el examen se grabará: cámara, micrófono y pantalla
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className={`flex items-center gap-1 ${monitoringStatus.camera ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${monitoringStatus.camera ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Cámara
          </div>
          <div className={`flex items-center gap-1 ${monitoringStatus.microphone ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${monitoringStatus.microphone ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Audio
          </div>
          <div className={`flex items-center gap-1 ${monitoringStatus.screen ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${monitoringStatus.screen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Pantalla
          </div>
        </div>
      </div>

      {/* Detalles del monitoreo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
        <div className="bg-white rounded p-3 border">
          <h4 className="font-semibold text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
            Cámara Web
          </h4>
          <p className="text-gray-600 mt-1">Monitoreo visual continuo</p>
        </div>
        
        <div className="bg-white rounded p-3 border">
          <h4 className="font-semibold text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Audio
          </h4>
          <p className="text-gray-600 mt-1">Grabación de sonido ambiente</p>
        </div>
        
        <div className="bg-white rounded p-3 border">
          <h4 className="font-semibold text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            Pantalla
          </h4>
          <p className="text-gray-600 mt-1">Captura de actividad</p>
        </div>
      </div>
    </div>
  );
};

// Componente de advertencia de monitoreo
const MonitoringWarning = ({ onAccept }: { onAccept: () => void }) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl mx-4 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema de Monitoreo de Exámenes
          </h2>
          <p className="text-gray-600">
            Para garantizar la integridad académica, durante el examen se activará:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Cámara Web</h3>
              <p className="text-red-600 text-sm">Monitoreo visual continuo durante todo el examen</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Audio</h3>
              <p className="text-red-600 text-sm">Grabación de sonido ambiente para detectar actividades sospechosas</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">Pantalla</h3>
              <p className="text-red-600 text-sm">Captura periódica de la actividad en pantalla</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-yellow-800 font-semibold">Aviso importante</p>
              <p className="text-yellow-700 text-sm">
                Al continuar, aceptas el monitoreo completo. Cualquier intento de desactivar 
                los dispositivos de monitoreo resultará en la terminación inmediata del examen.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAccept}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          Aceptar y comenzar examen
        </button>
      </div>
    </div>
  );
};

// Sample exam data (igual que tu código original)
const sampleExam = {
  id: "demo-exam-001",
  title: "Examen de Inglés B2 - Demo",
  subject: "Inglés",
  totalDuration: 120,
  course: {
    name: "Inglés B2 - Grupo A"
  },
  sections: [
    // ... (mantener todas las secciones igual que en tu código original)
    {
      id: "listening-section",
      title: "Listening",
      type: "listening" as const,
      instruction: "Escucha los audios y responde las preguntas correspondientes. Puedes reproducir el audio dos veces.",
      duration: 30,
      audioUrl: "/audio/sample-listening.mp3",
      questions: [
        {
          id: "q1",
          question: "¿Cuál es el propósito principal de la conversación?",
          type: "multiple-choice" as const,
          options: [
            "Solicitar información sobre un producto",
            "Hacer una reserva en un restaurante",
            "Discutir planes de viaje",
            "Resolver un problema técnico"
          ],
          maxScore: 2
        },
        {
          id: "q2",
          question: "Según el audio, ¿qué día se llevará a cabo el evento?",
          type: "multiple-choice" as const,
          options: [
            "El próximo viernes",
            "Este fin de semana",
            "El mes que viene",
            "Mañana"
          ],
          maxScore: 2
        },
        {
          id: "q3",
          question: "Describe brevemente la opinión del hablante sobre el tema discutido.",
          type: "short-answer" as const,
          maxScore: 3
        }
      ]
    },
    {
      id: "reading-section",
      title: "Reading",
      type: "reading" as const,
      instruction: "Lee cuidadosamente el texto y responde las preguntas basándote en la información proporcionada.",
      duration: 35,
      textContent: "El cambio climático es uno de los desafíos más apremiantes de nuestro tiempo. Las evidencias científicas muestran que las actividades humanas, particularmente la quema de combustibles fósiles, han incrementado significativamente las concentraciones de gases de efecto invernadero en la atmósfera. Esto ha llevado a un aumento gradual en la temperatura global del planeta, con consecuencias que incluyen el derretimiento de los glaciares, el aumento del nivel del mar, y patrones climáticos más extremos. Los expertos advierten que si no tomamos medidas drásticas para reducir las emisiones de carbono en la próxima década, podríamos alcanzar un punto de no retorno.",
      questions: [
        {
          id: "q4",
          question: "¿Cuál es la causa principal del cambio climático según el texto?",
          type: "multiple-choice" as const,
          options: [
            "Fenómenos naturales",
            "Actividades humanas",
            "Variaciones solares",
            "Cambios en la órbita terrestre"
          ],
          maxScore: 2
        },
        {
          id: "q5",
          question: "¿Qué consecuencias del cambio climático se mencionan en el texto?",
          type: "multiple-choice" as const,
          options: [
            "Aumento de la población",
            "Derretimiento de glaciares",
            "Crecimiento económico",
            "Disminución del nivel del mar"
          ],
          maxScore: 2
        },
        {
          id: "q6",
          question: "¿Cuál es el mensaje principal de los expertos mencionados en el texto?",
          type: "short-answer" as const,
          maxScore: 3
        }
      ]
    },
    {
      id: "use-of-language-section",
      title: "Use of Language",
      type: "use-of-language" as const,
      instruction: "Selecciona la opción correcta para completar cada oración de manera gramaticalmente correcta.",
      duration: 25,
      questions: [
        {
          id: "q7",
          question: "She _____ to the store every morning before work.",
          type: "multiple-choice" as const,
          options: [
            "go",
            "goes",
            "going",
            "went"
          ],
          maxScore: 2
        },
        {
          id: "q8",
          question: "If I _____ you, I would take the job offer.",
          type: "multiple-choice" as const,
          options: [
            "am",
            "was",
            "were",
            "be"
          ],
          maxScore: 2
        },
        {
          id: "q9",
          question: "The report _____ by the committee yesterday.",
          type: "multiple-choice" as const,
          options: [
            "approved",
            "was approved",
            "has approved",
            "approves"
          ],
          maxScore: 2
        }
      ]
    },
    {
      id: "writing-section",
      title: "Writing",
      type: "writing" as const,
      instruction: "Escribe un ensayo de aproximadamente 200 palabras sobre el tema propuesto. Asegúrate de tener una estructura clara con introducción, desarrollo y conclusión.",
      duration: 30,
      questions: [
        {
          id: "q10",
          question: "Tema: 'El impacto de la tecnología en la educación moderna'.\n\nEscribe un ensayo discutiendo cómo la tecnología ha transformado la educación. Considera aspectos positivos y negativos, y da tu opinión personal sobre el futuro de la educación tecnológica.",
          type: "essay" as const,
          maxScore: 10
        }
      ]
    }
  ]
};

export default function StudentExamDemoPage() {
  const [examStarted, setExamStarted] = useState(false);
  const [monitoringAccepted, setMonitoringAccepted] = useState(false);

  const handleStartExam = () => {
    setMonitoringAccepted(true);
  };

  const handleCompleteExam = () => {
    setExamStarted(false);
    setMonitoringAccepted(false);
    console.log("Exam completed - returning to dashboard");
  };

  if (!monitoringAccepted) {
    return (
      <DashboardLayout userRole="student">
        <div className="container mx-auto py-6">
          <MonitoringWarning onAccept={handleStartExam} />
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Demo del Nuevo Examen</h1>
            <p className="text-muted-foreground">
              Esta es una demostración de la nueva interfaz de examen con los cuatro tipos de secciones.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="container mx-auto py-6">
        <MonitoringSystem />
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Demo del Nuevo Examen</h1>
          <p className="text-muted-foreground">
            Esta es una demostración de la nueva interfaz de examen con los cuatro tipos de secciones.
          </p>
        </div>

        <ModernExamInterface
          exam={sampleExam}
          student={{ name: "Estudiante Demo" }}
          onComplete={handleCompleteExam}
        />
      </div>
    </DashboardLayout>
  );
}