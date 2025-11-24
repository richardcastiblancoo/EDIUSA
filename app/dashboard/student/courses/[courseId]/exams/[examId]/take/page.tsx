"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
// Asegúrate de que estas importaciones existan en tu proyecto
import { getExamsByCourse, Exam, Question, Section } from "@/lib/exams";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  BookOpen,
  HelpCircle,
  Award,
  AlertTriangle,
  CheckCircle,
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
} from "lucide-react";

interface ExamType extends Exam {
  structure: Section[];
}

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  isConfirming = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "danger" | "success";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div
          className={`p-4 border-b flex items-center justify-between ${
            type === "danger"
              ? "bg-red-50 border-red-100"
              : type === "warning"
              ? "bg-amber-50 border-amber-100"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <h3
            className={`font-bold text-lg flex items-center gap-2 ${
              type === "danger"
                ? "text-red-700"
                : type === "warning"
                ? "text-amber-700"
                : "text-gray-800"
            }`}
          >
            {type === "warning" && <AlertTriangle size={20} />}
            {type === "danger" && <AlertTriangle size={20} />}
            {type === "success" && <CheckCircle size={20} />}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            {onConfirm ? cancelText : "Cerrar"}
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className={`px-4 py-2 text-white font-bold rounded-lg shadow-md transition flex items-center gap-2 ${
                type === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {isConfirming && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              )}
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 border-l-4 border-gray-900/70 hover:shadow-md transition-shadow">
    <div className="text-gray-700 p-2 bg-gray-100 rounded-full">{icon}</div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const QuestionDisplay = ({
  question,
  userAnswer,
  onAnswerChange,
}: {
  question: Question;
  userAnswer: string | null;
  onAnswerChange: (questionId: string, answer: string) => void;
}) => {
  const isMultipleChoice = question.question_type === "multiple-choice";
  const orderNum = (question as any).order_number ?? 0;

  return (
    <div className="mb-6 p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors">
      <div className="font-semibold text-base text-gray-800 mb-3 flex items-start">
        <span className="inline-flex items-center justify-center w-6 h-6 mr-3 text-white bg-gray-900 rounded-full text-xs font-bold flex-shrink-0 shadow-sm">
          {orderNum}
        </span>
        <span className="pt-0.5 leading-relaxed">{question.question_text}</span>
      </div>
      {isMultipleChoice && question.options && (
        <div className="space-y-3 mt-4 ml-9">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-start group">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  id={`q-${question.id}-o-${option.id}`}
                  name={`q-${question.id}`}
                  value={option.id}
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 cursor-pointer"
                  checked={userAnswer === option.id}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                />
              </div>
              <label
                htmlFor={`q-${question.id}-o-${option.id}`}
                className="ml-3 text-sm text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors select-none"
              >
                {option.text}
              </label>
            </div>
          ))}
        </div>
      )}

      {question.question_type === "essay" && (
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg mt-4 ml-0 md:ml-9 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition duration-150 text-sm resize-none shadow-inner"
          rows={5}
          placeholder="Escribe tu respuesta detallada aquí..."
          value={userAnswer || ""}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
        ></textarea>
      )}
    </div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-800">Cargando Examen...</h1>
      <p className="text-gray-500 mt-2 text-sm">
        Preparando el entorno seguro.
      </p>
    </div>
  </div>
);

const ErrorScreen = ({ message }: { message: string | null }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-xl shadow-xl border-l-4 border-red-600 max-w-md">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Error Inesperado
      </h1>
      <p className="text-gray-600 text-sm mb-6">
        {message || "No se pudo cargar la información del examen."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-gray-900 hover:underline underline-offset-2"
      >
        Intentar recargar la página
      </button>
    </div>
  </div>
);

const ProcteringWarning = ({
  onAccept,
}: {
  onAccept: (hasAccepted: boolean) => void;
}) => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      // 1. Camera & Mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: true,
      });

      // 2. Screen Share
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: false,
      });

      // Stop immediately after checking
      stream.getTracks().forEach((track) => track.stop());
      displayStream.getTracks().forEach((track) => track.stop());

      setPermissionsGranted(true);
    } catch (err: any) {
      console.error("Error al obtener permisos:", err);
      setError(
        "Se requieren permisos de Cámara, Micrófono y Captura de Pantalla para continuar. Asegúrese de permitirlos en su navegador."
      );
      setPermissionsGranted(false);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <AlertTriangle className="text-yellow-400" />
            Monitoreo de Examen
          </h1>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600 mb-6 text-base leading-relaxed">
            Para garantizar la integridad académica, este examen requiere acceso
            temporal a sus dispositivos.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
              Permisos Requeridos:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                Cámara Web (Identidad)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                Micrófono (Audio ambiental)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                Pantalla (Actividad de escritorio)
              </li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 text-left border border-red-100">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={requestPermissions}
              disabled={isRequesting || permissionsGranted}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                permissionsGranted
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
              }`}
            >
              {isRequesting && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              )}
              {permissionsGranted ? (
                <>
                  <CheckCircle size={18} /> Permisos Verificados
                </>
              ) : (
                "1. Habilitar Permisos"
              )}
            </button>

            <button
              onClick={() => onAccept(true)}
              disabled={!permissionsGranted || isRequesting}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm text-gray-900 border-2 border-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              2. Comenzar Examen
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 px-4">
            Al continuar, acepta ser grabado durante la sesión del examen.
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente para el cronómetro
const CountdownTimer = ({
  duration,
  onTimeUp,
}: {
  duration: number;
  onTimeUp: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convertir a segundos
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  useEffect(() => {
    // Cambiar a color de advertencia cuando queden 10 minutos
    if (timeLeft <= 600 && timeLeft > 300) {
      // 10-5 minutos
      setIsWarning(true);
      setIsCritical(false);
    }
    // Cambiar a color crítico cuando queden 5 minutos
    else if (timeLeft <= 300) {
      // 5 minutos o menos
      setIsWarning(false);
      setIsCritical(true);
    } else {
      setIsWarning(false);
      setIsCritical(false);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`fixed top-4 left-4 z-40 bg-white rounded-lg shadow-2xl border-2 ${
        isCritical
          ? "border-red-500 bg-red-50"
          : isWarning
          ? "border-amber-500 bg-amber-50"
          : "border-gray-900"
      } p-4 transition-all duration-300`}
    >
      <div className="flex items-center gap-2">
        <Clock
          className={`w-5 h-5 ${
            isCritical
              ? "text-red-600"
              : isWarning
              ? "text-amber-600"
              : "text-gray-900"
          }`}
        />
        <span
          className={`text-lg font-bold ${
            isCritical
              ? "text-red-700"
              : isWarning
              ? "text-amber-700"
              : "text-gray-900"
          }`}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
      <div
        className={`text-xs mt-1 ${
          isCritical
            ? "text-red-600"
            : isWarning
            ? "text-amber-600"
            : "text-gray-500"
        }`}
      >
        {isCritical
          ? "¡Tiempo crítico!"
          : isWarning
          ? "Queda poco tiempo"
          : "Tiempo restante"}
      </div>
    </div>
  );
};

export default function TakeExamPage() {
  const params = useParams();
  const courseId = params?.courseId as string | undefined;
  const examId = params?.examId as string | undefined;
  const router = useRouter();
  const [exam, setExam] = useState<ExamType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monitoringAccepted, setMonitoringAccepted] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger" | "success";
    onConfirm?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Nuevos estados para el monitoreo activo
  const [streams, setStreams] = useState<{
    camera: MediaStream | null;
    screen: MediaStream | null;
  }>({
    camera: null,
    screen: null,
  });
  const [permissions, setPermissions] = useState<{
    camera: boolean;
    microphone: boolean;
    screen: boolean;
  }>({
    camera: false,
    microphone: false,
    screen: false,
  });
  const [showMonitor, setShowMonitor] = useState(true);

  // Refs para los elementos de video
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Inicializar streams de medios
  const initializeMediaStreams = async () => {
    try {
      // 1. Inicializar cámara y micrófono
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: true,
      });

      // 2. Inicializar captura de pantalla
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: false,
      });

      setStreams({
        camera: cameraStream,
        screen: screenStream,
      });

      setPermissions({
        camera: true,
        microphone: true,
        screen: true,
      });

      // Configurar event listeners para detectar cuando se detiene la captura
      screenStream.getTracks().forEach((track) => {
        track.onended = () => {
          setModalState({
            isOpen: true,
            title: "Captura de Pantalla Interrumpida",
            message:
              "La captura de pantalla se ha detenido. Debe reactivarla para continuar con el examen.",
            type: "danger",
          });
          setPermissions((prev) => ({ ...prev, screen: false }));
        };
      });
    } catch (err: any) {
      console.error("Error inicializando medios:", err);
      setModalState({
        isOpen: true,
        title: "Error de Permisos",
        message:
          "No se pudieron inicializar todos los dispositivos requeridos. Por favor, recargue la página e intente nuevamente.",
        type: "danger",
      });
    }
  };

  // Actualizar elementos de video cuando los streams cambien
  useEffect(() => {
    if (cameraVideoRef.current && streams.camera) {
      cameraVideoRef.current.srcObject = streams.camera;
    }
    if (screenVideoRef.current && streams.screen) {
      screenVideoRef.current.srcObject = streams.screen;
    }
  }, [streams]);

  // Detener todos los streams al desmontar el componente
  useEffect(() => {
    return () => {
      if (streams.camera) {
        streams.camera.getTracks().forEach((track) => track.stop());
      }
      if (streams.screen) {
        streams.screen.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Componente para el panel de monitoreo
  const MonitoringPanel = () => (
    <div
      className={`fixed top-4 right-4 z-40 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        showMonitor ? "w-80" : "w-12"
      }`}
    >
      {/* Header del panel */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {showMonitor && (
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Monitoreo Activo
          </h3>
        )}
        <button
          onClick={() => setShowMonitor(!showMonitor)}
          className="p-1 hover:bg-gray-100 rounded transition"
          title={showMonitor ? "Ocultar monitor" : "Mostrar monitor"}
        >
          {showMonitor ? <X size={16} /> : <Video size={16} />}
        </button>
      </div>

      {/* Contenido del panel */}
      {showMonitor && (
        <div className="p-3 space-y-3">
          {/* Indicadores de estado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Cámara:</span>
              <div className="flex items-center gap-1">
                {permissions.camera ? (
                  <Video className="w-3 h-3 text-green-500" />
                ) : (
                  <VideoOff className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={
                    permissions.camera ? "text-green-600" : "text-red-600"
                  }
                >
                  {permissions.camera ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Micrófono:</span>
              <div className="flex items-center gap-1">
                {permissions.microphone ? (
                  <Mic className="w-3 h-3 text-green-500" />
                ) : (
                  <MicOff className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={
                    permissions.microphone ? "text-green-600" : "text-red-600"
                  }
                >
                  {permissions.microphone ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Pantalla:</span>
              <div className="flex items-center gap-1">
                {permissions.screen ? (
                  <Monitor className="w-3 h-3 text-green-500" />
                ) : (
                  <MonitorOff className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={
                    permissions.screen ? "text-green-600" : "text-red-600"
                  }
                >
                  {permissions.screen ? "Compartida" : "No compartida"}
                </span>
              </div>
            </div>
          </div>

          {/* Vista previa de cámara */}
          {permissions.camera && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">
                Vista de cámara:
              </label>
              <video
                ref={cameraVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-24 bg-gray-900 rounded border border-gray-300 object-cover"
              />
            </div>
          )}

          {/* Vista previa de pantalla */}
          {permissions.screen && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">
                Pantalla compartida:
              </label>
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-32 bg-gray-900 rounded border border-gray-300 object-contain"
              />
            </div>
          )}

          {/* Mensaje de advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <p className="text-xs text-yellow-700 text-center">
              ⚠️ El monitoreo está activo
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Modificar el ProcteringWarning para usar la nueva función de inicialización
  const ModifiedProcteringWarning = ({
    onAccept,
  }: {
    onAccept: (hasAccepted: boolean) => void;
  }) => {
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestPermissions = async () => {
      setIsRequesting(true);
      setError(null);
      try {
        await initializeMediaStreams();
      } catch (err: any) {
        console.error("Error al obtener permisos:", err);
        setError(
          "Se requieren permisos de Cámara, Micrófono y Captura de Pantalla para continuar. Asegúrese de permitirlos en su navegador."
        );
      } finally {
        setIsRequesting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 p-6 text-center">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <AlertTriangle className="text-yellow-400" />
              Monitoreo de Examen
            </h1>
          </div>
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Para garantizar la integridad académica, este examen requiere
              acceso temporal a sus dispositivos.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                Permisos Requeridos:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                  Cámara Web (Identidad)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                  Micrófono (Audio ambiental)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>{" "}
                  Pantalla (Actividad de escritorio)
                </li>
              </ul>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 text-left border border-red-100">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={requestPermissions}
                disabled={
                  isRequesting || (permissions.camera && permissions.screen)
                }
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                  permissions.camera && permissions.screen
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
                }`}
              >
                {isRequesting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                )}
                {permissions.camera && permissions.screen ? (
                  <>
                    <CheckCircle size={18} /> Permisos Verificados
                  </>
                ) : (
                  "1. Habilitar Permisos"
                )}
              </button>

              <button
                onClick={() => onAccept(true)}
                disabled={
                  !permissions.camera || !permissions.screen || isRequesting
                }
                className="w-full py-3 px-4 rounded-lg font-bold text-sm text-gray-900 border-2 border-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                2. Comenzar Examen
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4 px-4">
              Al continuar, acepta ser grabado durante la sesión del examen.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Calculate Sections
  const filteredSections = useMemo(() => {
    const allPossibleSections = [
      "Listening",
      "Reading",
      "Use of Language",
      "Writing",
    ];

    const existingSections =
      exam?.structure?.filter((section: Section) =>
        allPossibleSections.includes(section.title)
      ) || [];

    const generalSection = exam?.structure?.find(
      (section: Section) => section.title === "General"
    );

    const combinedSections = allPossibleSections.map((title) => {
      const existing = exam?.structure?.find((s) => s.title === title);
      return {
        id: existing?.id || title.toLowerCase().replace(/ /g, "-"),
        title: title,
        description: existing?.description || `Preguntas de ${title}`,
        questions: existing?.questions || [],
      };
    });

    if (generalSection) {
      combinedSections.push({
        ...generalSection,
        description:
          generalSection.description ?? `Preguntas de ${generalSection.title}`,
      });
    }

    return combinedSections;
  }, [exam]);

  // Determine Active Section
  const activeSection = useMemo(() => {
    return filteredSections.find((section) => section.id === activeSectionId);
  }, [filteredSections, activeSectionId]);

  // Initial Section Set
  useEffect(() => {
    if (filteredSections.length > 0 && !activeSectionId) {
      setActiveSectionId(filteredSections[0].id);
    }
  }, [filteredSections, activeSectionId]);

  const handleAnswerChange = useCallback(
    (questionId: string, answer: string) => {
      setUserAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: answer,
      }));
    },
    []
  );

  const closeModal = () =>
    setModalState((prev) => ({ ...prev, isOpen: false }));

  // Función para cuando se acaba el tiempo
  const handleTimeUp = () => {
    setModalState({
      isOpen: true,
      title: "Tiempo Agotado",
      message:
        "El tiempo del examen ha finalizado. Sus respuestas serán enviadas automáticamente.",
      type: "danger",
      onConfirm: executeSubmit,
      confirmText: "Entendido",
    });
  };

  const executeSubmit = async () => {
    if (!exam || !courseId || !examId) return;

    setIsSubmitting(true);
    closeModal();

    try {
      // Detener todos los streams de medios
      if (streams.camera) {
        streams.camera.getTracks().forEach((track) => track.stop());
      }
      if (streams.screen) {
        streams.screen.getTracks().forEach((track) => track.stop());
      }

      const userId = "placeholder-user-id";

      const submissionData = {
        user_id: userId,
        exam_id: exam.id,
        course_id: courseId,
        answers: userAnswers,
        submitted_at: new Date().toISOString(),
      };

      const { error: submitError } = await supabase
        .from("exam_submissions")
        .insert([submissionData]);

      if (submitError) throw submitError;

      router.push(`/dashboard/student`);
    } catch (err: any) {
      console.error("Error al enviar:", err);
      setModalState({
        isOpen: true,
        title: "Error de Envío",
        message: `Hubo un problema al enviar sus respuestas: ${
          err.message || "Error desconocido"
        }. Por favor intente nuevamente.`,
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreSubmitValidation = () => {
    if (!exam) return;

    // Validate Multiple Choice
    const allQuestions = filteredSections.flatMap(
      (section) => section.questions || []
    );
    const unansweredRequiredQuestions = allQuestions.filter(
      (q) => q.question_type !== "essay" && !userAnswers[q.id]
    );

    if (unansweredRequiredQuestions.length > 0) {
      setModalState({
        isOpen: true,
        title: "Preguntas Incompletas",
        message: `Faltan ${unansweredRequiredQuestions.length} preguntas de selección múltiple por responder. Debe completar todas las preguntas obligatorias antes de enviar.`,
        type: "warning",
      });
      return;
    }

    // Show Confirm Modal
    setModalState({
      isOpen: true,
      title: "Confirmar Envío",
      message:
        "¿Está seguro que desea finalizar y enviar el examen? Una vez enviado, no podrá modificar sus respuestas.",
      type: "info",
      onConfirm: executeSubmit,
      confirmText: "Sí, Finalizar Examen",
    });
  };

  useEffect(() => {
    async function fetchExam() {
      if (!courseId || !examId) {
        setLoading(false);
        setError("ID de curso o examen no especificado.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const fetchedExams = await getExamsByCourse(courseId);
        const currentExam = fetchedExams.find((e) => e.id === examId);
        if (currentExam) {
          // Reconstruir la estructura con las preguntas ordenadas
          const structureWithOrder = (currentExam.structure || []).map(
            (section) => ({
              ...section,
              questions: (section.questions || []).map((q, index) => ({
                ...q,
                order_number: index + 1,
              })),
            })
          );

          setExam({
            ...currentExam,
            structure: structureWithOrder,
          } as ExamType);
        } else {
          setError("Examen no encontrado.");
        }
      } catch (err) {
        console.error("Error fetching exam:", err);
        setError("No se pudo cargar el examen. Verifique la conexión.");
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [courseId, examId]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!exam) return <ErrorScreen message="Examen no disponible." />;
  if (!monitoringAccepted)
    return <ModifiedProcteringWarning onAccept={setMonitoringAccepted} />;

  return (
    <div className="min-h-screen bg-gray-50 py-10 relative">
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        isConfirming={isSubmitting}
      />

      {/* Cronómetro */}
      {exam && monitoringAccepted && (
        <CountdownTimer
          duration={exam.duration_minutes}
          onTimeUp={handleTimeUp}
        />
      )}

      {/* Panel de monitoreo */}
      <MonitoringPanel />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <header className="mb-8 p-8 bg-white rounded-2xl shadow-lg border-t-8 border-gray-900 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {exam.title}
            </h1>
            <p className="text-gray-500 mb-6 max-w-2xl">{exam.description}</p>
            {exam.instructions && (
              <div className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900 mb-1">
                    Instrucciones:
                  </strong>
                  {exam.instructions}
                </div>
              </div>
            )}
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<Clock size={24} />}
            label="Duración"
            value={`${exam.duration_minutes} min`}
          />
          <MetricCard
            icon={<BookOpen size={24} />}
            label="Categoría"
            value={exam.category}
          />
          <MetricCard
            icon={<HelpCircle size={24} />}
            label="Preguntas"
            value={`${exam.total_questions}`}
          />
          <MetricCard
            icon={<Award size={24} />}
            label="Puntaje Max"
            value="5.0"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              Secciones del Examen
            </h2>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 pb-2">
              {filteredSections.map((section) => {
                const isActive = section.id === activeSectionId;
                const questions = section.questions || [];
                const answeredCount = questions.filter(
                  (q) => userAnswers[q.id] && userAnswers[q.id].trim() !== ""
                ).length;
                const totalCount = questions.length;
                const isComplete =
                  totalCount > 0 && answeredCount === totalCount;

                const buttonBaseClasses =
                  "px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border flex items-center gap-2";
                const buttonStateClasses = isActive
                  ? "bg-gray-900 text-white border-gray-900 shadow-lg scale-105"
                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200 hover:border-gray-300";

                const badgeBaseClasses =
                  "ml-1 px-2 py-0.5 rounded-full text-xs";
                const badgeStateClasses = isActive
                  ? "bg-white/20 text-white"
                  : isComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500";

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`${buttonBaseClasses} ${buttonStateClasses}`}
                  >
                    {section.title}
                    <span
                      className={`${badgeBaseClasses} ${badgeStateClasses}`}
                    >
                      {answeredCount}/{totalCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Section Questions */}
            {activeSection ? (
              <div className="animate-fadeIn">
                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {activeSection.title}
                    </h3>
                    {activeSection.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {activeSection.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Progreso de Sección
                    </span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gray-900 transition-all duration-500"
                        style={{
                          width: `${
                            (activeSection.questions?.length || 0) > 0
                              ? ((activeSection.questions || []).filter(
                                  (q) => userAnswers[q.id]
                                ).length /
                                  (activeSection.questions?.length || 1)) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {activeSection.questions &&
                  activeSection.questions.length > 0 ? (
                    activeSection.questions.map((question: Question) => (
                      <QuestionDisplay
                        key={question.id}
                        question={question}
                        userAnswer={userAnswers[question.id] || null}
                        onAnswerChange={handleAnswerChange}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-400 italic">
                        No hay preguntas disponibles en esta sección.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-lg text-gray-500 italic text-center py-10">
                Seleccione una sección para comenzar.
              </p>
            )}

            {/* Submit Button Area */}
            <div className="pt-8 border-t border-gray-100 mt-10 flex justify-center">
              <button
                onClick={handlePreSubmitValidation}
                disabled={isSubmitting}
                className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gray-900 rounded-xl shadow-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    Finalizar y Enviar Examen
                    <CheckCircle className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
