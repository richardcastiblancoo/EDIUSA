"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Timer, Calendar, CheckCircle, Clock, Hash, Camera, Monitor, Mic, X, AlertTriangle } from "lucide-react"; 
import { getExamsByCourse, Exam, Question, Section } from "@/lib/exams";
import { supabase } from "@/lib/supabase";

// 1. --- Componente para el Aviso Flotante (Toast) - Sin Negritas ---
const MonitoringToast = () => {
  const [isVisible, setIsVisible] = useState(true);

  // El aviso se oculta después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-2xl flex items-center space-x-3 transition-opacity duration-500 ease-in-out border border-gray-600">
      <Monitor className="w-6 h-6 flex-shrink-0 text-blue-400" />
      <p className="font-semibold text-sm">
        Monitoreo activo: Su actividad está siendo grabada para fines de proctoring.
      </p>
      <button onClick={() => setIsVisible(false)} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// 2. --- Componente para mostrar una pregunta individual (Sin cambios) ---
const QuestionDisplay = ({ question }: { question: Question }) => {
  return (
    <div className="mb-6 p-5 border border-gray-100 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <Hash className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
        <p className="font-bold text-lg text-gray-800">
          {question.id}. {question.question_text}
        </p>
      </div>
      {question.question_type === "multiple-choice" && question.options && (
        <div className="space-y-3 mt-3">
          {question.options.map((option) => (
            <div key={option.id} className="flex items-start">
              <input
                type="radio"
                id={`question-${question.id}-option-${option.id}`}
                name={`question-${question.id}`}
                value={option.id}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                disabled
              />
              <label
                htmlFor={`question-${question.id}-option-${option.id}`}
                className="text-gray-700 cursor-pointer flex-1"
              >
                {option.text}
              </label>
            </div>
          ))}
        </div>
      )}
      {question.question_type === "essay" && (
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg mt-3 resize-none bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          rows={4}
          placeholder="Vista previa de área de respuesta..."
          disabled
        ></textarea>
      )}
      <p className="text-right text-xs text-gray-400 mt-2">
        Tipo:{" "}
        {question.question_type === "multiple-choice"
          ? "Opción Múltiple"
          : question.question_type === "essay"
          ? "Ensayo"
          : "Otro"}
      </p>
    </div>
  );
};

// 3. --- Componente Modal de Advertencia de Proctoring - Sin Negritas ---
interface ProctoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  examTitle: string;
}

const ProctoringModal = ({ isOpen, onClose, onConfirm, examTitle }: ProctoringModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 transform transition-all duration-300">
        
        <div className="text-center mb-6">
            <AlertTriangle className="w-10 h-10 text-gray-800 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900">
                Advertencia de Monitoreo (Proctoring)
            </h3>
        </div>
        
        <hr className="mb-6"/>

        <p className="text-gray-700 mb-4 text-lg">
          Está a punto de iniciar el examen: {examTitle}.
        </p>
        <p className="text-gray-600 mb-6">
          Para garantizar la integridad académica, este examen será monitoreado completamente a través de su dispositivo.
        </p>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-8">
            <div className="flex items-start text-gray-800">
                <Camera className="w-5 h-5 flex-shrink-0 mt-1 mr-3 text-blue-600" />
                <p>
                    <span className="font-semibold">Cámara:</span> Su video será capturado.
                </p>
            </div>
            <div className="flex items-start text-gray-800">
                <Monitor className="w-5 h-5 flex-shrink-0 mt-1 mr-3 text-blue-600" />
                <p>
                    <span className="font-semibold">Pantalla:</span> La actividad en su escritorio será grabada.
                </p>
            </div>
            <div className="flex items-start text-gray-800">
                <Mic className="w-5 h-5 flex-shrink-0 mt-1 mr-3 text-blue-600" />
                <p>
                    <span className="font-semibold">Audio:</span> Su audio será grabado a través del micrófono.
                </p>
            </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Al hacer clic en "Aceptar e Iniciar", usted confirma que ha leído y entendido estas condiciones, y autoriza el monitoreo.
        </p>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-base"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-white bg-gray-800 rounded-lg font-semibold shadow-md hover:bg-gray-700 transition-colors text-base"
          >
            Aceptar e Iniciar
          </button>
        </div>
      </div>
    </div>
  );
};


/**
 * Página que muestra todos los exámenes disponibles para un curso específico.
 */
export default function CourseExamsPage() {
  const params = useParams();
  const courseId = params?.courseId as string | undefined;
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el Modal de Proctoring
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Estado para el aviso flotante
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  useEffect(() => {
    async function fetchExams() {
      if (!courseId) return;
      setLoading(true);
      setError(null);
      try {
        const fetchedExams = await getExamsByCourse(courseId);
        setExams(fetchedExams);
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError(
          "No se pudieron cargar los exámenes. Intenta de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, [courseId]);

  // Manejador para abrir el modal
  const handleStartExamClick = (exam: Exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  // Manejador para confirmar el inicio del examen y navegar
  const handleConfirmStart = () => {
    if (selectedExam) {
      setIsModalOpen(false); // Cierra el modal
      // Nota: Idealmente, el aviso flotante se activaría en la página del examen
      // Pero lo activamos aquí para fines de demostración en este componente.
      setIsMonitoringActive(true); 
      router.push(
        `/dashboard/student/courses/${courseId}/exams/${selectedExam.id}/take`
      );
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <h1 className="text-xl font-semibold text-gray-700">
            Cargando Exámenes...
          </h1>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg mt-8">
        <h1 className="text-2xl font-bold mb-2">Error de Carga</h1>
        <p>Hubo un problema: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-2">
          Exámenes Disponibles para el Curso:{" "}
          <span className="text-blue-600">{courseId}</span>
        </h1>
      </header>

      {exams.length === 0 ? (
        <div className="text-center p-10 bg-white shadow-lg rounded-xl">
          <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">
            No hay exámenes programados para este curso.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {exams.map((exam) => (
            // --- CARD PRINCIPAL DEL EXAMEN ---
            <div
              key={exam.id}
              className="bg-white shadow-xl rounded-2xl p-6 md:p-8 border-t-4 border-blue-600 transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                {exam.title}
              </h2>
              {exam.description && (
                <p className="text-gray-600 mb-5">{exam.description}</p>
              )}

              <hr className="mb-5" />

              {/* Sección de Metadatos del Examen con Iconos */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-700 mb-6">
                <div className="flex items-center">
                  <Timer className="w-5 h-5 text-blue-500 mr-2" />
                  <p>
                    <span className="font-semibold">Duración:</span> {exam.duration_minutes} min
                  </p>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-red-500 mr-2" />
                  <p>
                    <span className="font-semibold">Límite:</span>{" "}
                    {exam.due_date
                      ? new Date(exam.due_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <p>
                    <span className="font-semibold">Intentos:</span> {exam.max_attempts}
                  </p>
                </div>

                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p>
                    <span className="font-semibold">Aprobar:</span> 3
                  </p>
                </div>

                <div className="flex items-center col-span-2 lg:col-span-1">
                  <p>
                    <span className="font-semibold">Categoría:</span> {exam.category}
                  </p>
                </div>
              </div>

              {/* Sección de Estructura/Preguntas (Plegable) */}
              {exam.structure && exam.structure.length > 0 && (
                <details className="mt-8 pt-4 border-t border-gray-100">
                  <summary className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700 flex items-center">
                    Vista Previa de la Estructura ({exam.structure.length}{" "}
                    Secciones)
                  </summary>

                  <div className="mt-4 space-y-6 pl-4 border-l-2 border-gray-200">
                    {exam.structure.map((section: Section) => (
                      <div key={section.id} className="pt-4">
                        <h4 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                          {section.title}
                        </h4>
                        {section.description && (
                          <p className="text-gray-600 italic mb-4">
                            {section.description}
                          </p>
                        )}

                        {/* Muestra las preguntas dentro de la sección */}
                        <div className="space-y-4">
                          {section.questions &&
                            section.questions.map((question: Question) => (
                              <QuestionDisplay
                                key={question.id}
                                question={question}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Botón de Acción Principal (Modificado para abrir el modal) */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleStartExamClick(exam)} // Llama a la función para abrir el modal
                  className="inline-flex items-center px-8 py-3 text-lg font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-500/50 
                            hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 
                            focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Iniciar Examen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Renderizar el Modal de Proctoring si está abierto y hay un examen seleccionado */}
      {selectedExam && (
        <ProctoringModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmStart}
          examTitle={selectedExam.title}
        />
      )}

      {/* Renderizar el Aviso Flotante (Toast) */}
      {isMonitoringActive && <MonitoringToast />}
    </div>
  );
}