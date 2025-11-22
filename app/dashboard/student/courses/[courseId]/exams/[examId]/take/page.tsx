"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getExamsByCourse, Exam, Question, Section } from "@/lib/exams";
import { supabase } from "@/lib/supabase";

// --- Tipos de Datos Simplificados (Asegúrate de que sean consistentes con "@/lib/exams") ---
interface ExamType extends Exam {
  structure: Section[];
}

// --- Componente de Tarjeta de Métrica (Ajustado a color) ---
const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-3 border-l-4 border-gray-900/70">
    <span className="text-2xl text-gray-700">{icon}</span>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// --- Componente de Visualización de Pregunta Mejorado (Ajustado a color) ---
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

  return (
    <div className="mb-6 p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
      <p className="font-semibold text-base text-gray-800 mb-3 flex items-start">
        <span className="inline-flex items-center justify-center w-5 h-5 mr-3 text-white bg-gray-900 rounded-full text-xs flex-shrink-0">
          {question.order_number}
        </span>
        <span className="pt-0.5">{question.question_text}</span>
      </p>

      {isMultipleChoice && question.options && (
        <div className="space-y-2 mt-4 ml-8">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-start">
              <input
                type="radio"
                id={`q-${question.id}-o-${option.id}`}
                name={`q-${question.id}`}
                value={option.id}
                className="mt-1 w-4 h-4 text-gray-800 border-gray-300 focus:ring-gray-800"
                checked={userAnswer === option.id}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
              />
              <label
                htmlFor={`q-${question.id}-o-${option.id}`}
                className="ml-3 text-sm text-gray-700 cursor-pointer"
              >
                {option.text}
              </label>
            </div>
          ))}
        </div>
      )}

      {question.question_type === "essay" && (
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md mt-4 ml-8 focus:ring-gray-700 focus:border-gray-700 transition duration-150 text-sm resize-none"
          rows={4}
          placeholder="Escribe tu respuesta detallada aquí..."
          value={userAnswer || ""}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
        ></textarea>
      )}
    </div>
  );
};

// --- Componente de Pantalla de Carga Estilizada (Ajustado a color) ---
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-xl shadow-xl">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-800">Cargando Examen...</h1>
      <p className="text-gray-500 mt-2 text-sm">Preparando la evaluación.</p>
    </div>
  </div>
);

// --- Componente de Pantalla de Error Estilizada (Ajustado a color) ---
const ErrorScreen = ({ message }: { message: string | null }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-xl shadow-xl border-l-4 border-red-700">
      <h1 className="text-2xl font-bold text-red-700 mb-2">
        🚫 Error Inesperado
      </h1>
      <p className="text-gray-600 text-sm">
        {message || "No se pudo cargar la información del examen."}
      </p>
      <p className="text-xs text-gray-400 mt-4">
        Por favor, intente recargar la página.
      </p>
    </div>
  </div>
);

// --- Componente de Advertencia de Monitoreo ---
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
      // 1. Solicitar Permiso de Cámara y Micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // 2. Solicitar Permiso de Captura de Pantalla
      // NOTA: 'getDisplayMedia' abre una ventana de selección.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // Opcional, dependiendo de si necesita audio del sistema
      });

      // Detener los streams inmediatamente después de obtener los permisos
      stream.getTracks().forEach((track) => track.stop());
      displayStream.getTracks().forEach((track) => track.stop());

      setPermissionsGranted(true);
    } catch (err: any) {
      console.error("Error al obtener permisos:", err);
      setError(
        "Se requieren permisos de Cámara, Micrófono y Captura de Pantalla para continuar. Por favor, asegúrese de permitir el acceso en la ventana emergente y en la configuración de su navegador/OS."
      );
      setPermissionsGranted(false);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-10 bg-white rounded-xl shadow-2xl max-w-lg mx-4 border-t-4 border-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🚨 Aviso de Monitoreo del Examen
        </h1>
        <p className="text-gray-600 mb-6 text-base">
          Este examen requiere **monitoreo estricto** para garantizar la
          integridad académica. Para continuar, debe otorgar acceso a:
        </p>
        <ul className="list-disc list-inside text-left text-gray-700 mb-6 space-y-2 inline-block">
          <li>Cámara (para monitoreo visual)</li>
          <li>Micrófono (para monitoreo de audio)</li>
          <li>Captura de Pantalla (para monitorear la actividad de la ventana)</li>
        </ul>
        {error && (
          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md mb-4 border border-red-200">
            {error}
          </p>
        )}
        <button
          onClick={requestPermissions}
          disabled={isRequesting || permissionsGranted}
          className="w-full mb-4 px-6 py-3 text-base font-bold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {isRequesting
            ? "Solicitando Permisos..."
            : permissionsGranted
            ? "✅ Permisos Obtenidos"
            : "1. Capturar Permisos"}
        </button>
        <button
          onClick={() => onAccept(true)}
          disabled={!permissionsGranted || isRequesting}
          className="w-full px-6 py-3 text-base font-bold text-gray-900 border border-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
        >
          2. Aceptar y Comenzar Examen
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Al hacer clic en "Aceptar y Comenzar Examen", usted acepta los términos
          de monitoreo.
        </p>
      </div>
    </div>
  );
};

// --- Componente Principal de la Página ---
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

  const filteredSections = useMemo(() => {
    return exam?.structure?.filter((section: Section) =>
      ["Listening", "Reading", "Use of Language", "Writing", "General"].includes(
        section.title
      )
    ) || [];
  }, [exam]);

  // Establecer la sección activa al cargar
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

  const handleSubmitExam = async () => {
    if (!exam || !courseId || !examId) return;

    // Validación mínima: ¿Están todas las preguntas de selección múltiple respondidas?
    const allQuestions = filteredSections.flatMap(
      (section) => section.questions || []
    );
    const unansweredRequiredQuestions = allQuestions.filter(
      (q) => q.question_type !== "essay" && !userAnswers[q.id]
    );

    if (unansweredRequiredQuestions.length > 0) {
      alert(
        `⚠️ Faltan ${unansweredRequiredQuestions.length} preguntas de selección múltiple por responder. ¡Por favor, complete todas las respuestas requeridas antes de enviar!`
      );
      return;
    }

    if (!window.confirm("¿Está seguro que desea finalizar y enviar el examen? No podrá volver a editar sus respuestas.")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Reemplazar con el ID de usuario real de la sesión
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

      alert("✅ Examen enviado con éxito! Redirigiendo a resultados...");
      router.push(
        `/dashboard/student/courses/${courseId}/exams/${examId}/results`
      );
    } catch (err: any) {
      console.error("Error al enviar el examen:", err);
      setError(`Error al enviar el examen: ${err.message || err.toString()}`);
      alert(`⚠️ Error al enviar el examen: ${err.message || err.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
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
          setExam(currentExam as ExamType);
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!exam) {
    return <ErrorScreen message="Examen no disponible o no encontrado." />;
  }

  if (!monitoringAccepted) {
    return <ProcteringWarning onAccept={setMonitoringAccepted} />;
  }

  const activeSection = filteredSections.find(
    (s) => s.id === activeSectionId
  );

  return (
    // Contenedor principal con fondo suave
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Encabezado del Examen */}
        <header className="mb-8 p-6 bg-white rounded-xl shadow-lg border-t-4 border-gray-900">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {exam.title}
          </h1>
          <p className="text-sm text-gray-500">{exam.description}</p>
          {exam.instructions && (
            <p className="text-xs text-gray-600 mt-4 border-l-2 pl-3 italic bg-gray-50 rounded-r-sm py-2">
              <strong>Instrucciones:</strong> {exam.instructions}
            </p>
          )}
        </header>

        {/* Métrica Clave */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon="⏱️"
            label="Duración"
            value={`${exam.duration_minutes} min`}
          />
          <MetricCard icon="📚" label="Categoría" value={exam.category} />
          <MetricCard
            icon="❓"
            label="Preguntas"
            value={`${exam.total_questions}`}
          />
          <MetricCard
            icon="💯"
            label="Puntaje Max"
            value="5.0"
          />
        </div>

        {/* Sección de Preguntas y Navegación */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-6">
            Navegación por Secciones
          </h2>

          {/* Navegación por Pestañas/Botones */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
            {filteredSections.map((section) => {
              const isActive = section.id === activeSectionId;
              const answeredCount = (section.questions || []).filter(
                (q) => !!userAnswers[q.id]
              ).length;
              const totalCount = section.questions?.length || 0;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                  }`}
                >
                  {section.title}{" "}
                  <span
                    className={`ml-1 text-xs font-normal ${
                      isActive ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    ({answeredCount}/{totalCount})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contenido de la Sección Activa */}
          {activeSection ? (
            <div className="animate-fadeIn">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
                  {activeSection.title}
                </h3>
                {activeSection.description && (
                  <p className="text-gray-600 text-sm italic">
                    {activeSection.description}
                  </p>
                )}
              </div>

              {activeSection.questions && activeSection.questions.length > 0 ? (
                activeSection.questions.map((question: Question) => (
                  <QuestionDisplay
                    key={question.id}
                    question={question}
                    userAnswer={userAnswers[question.id] || null}
                    onAnswerChange={handleAnswerChange}
                  />
                ))
              ) : (
                <p className="text-lg text-gray-500 italic">
                  No hay preguntas en esta sección.
                </p>
              )}
            </div>
          ) : (
            <p className="text-lg text-gray-500 italic">
              Seleccione una sección para comenzar.
            </p>
          )}

          {/* Botón de Envío */}
          <div className="pt-6 border-t border-gray-200 mt-8 text-center">
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-8 py-3 text-lg font-extrabold text-white bg-gray-900 rounded-lg shadow-xl hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-600 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Enviando...
                </>
              ) : (
                "Finalizar y Enviar Examen"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}