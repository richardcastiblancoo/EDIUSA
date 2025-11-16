"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2, File, FileText, Music, Folder, ExternalLink, CheckCircle, ArrowRight, BookOpen, PlayCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentLessons } from "@/lib/lessons"
import { Button } from "@/components/ui/button"

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  courses: {
    name: string;
    language: string;
    level: string;
  };
}

export default function StudentLessonsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return
      
      try {
        console.log("Cargando lecciones para estudiante:", user.id)
        const lessonsData = await getStudentLessons(user.id)
        console.log("Lecciones obtenidas:", lessonsData)
        setLessons(lessonsData)
      } catch (error) {
        console.error("Error cargando lecciones:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las lecciones"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [user?.id, toast])

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Función para obtener el tipo de archivo
  const getFileType = (url: string) => {
    if (url.includes('.pdf')) return 'PDF'
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a')) return 'Audio'
    return 'Archivo'
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Lecciones</h2>
          <p className="text-muted-foreground">
            Contenido y recursos de todos tus cursos activos
          </p>
        </div>

        {/* Estadísticas rápidas */}
        {!loading && lessons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{lessons.length}</p>
                    <p className="text-sm text-muted-foreground">Lecciones totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lessons.filter(lesson => lesson.pdf_url).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Con material PDF</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Music className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {lessons.filter(lesson => lesson.audio_url).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Con audio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lecciones Disponibles</CardTitle>
            <CardDescription>
              {loading ? "Cargando..." : `${lessons.length} lección${lessons.length !== 1 ? 'es' : ''} disponible${lessons.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Cargando lecciones...</p>
                </div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay lecciones disponibles</h3>
                <p className="text-muted-foreground mb-4">
                  {user ? "No tienes lecciones publicadas en tus cursos activos." : "Inicia sesión para ver tus lecciones."}
                </p>
                {!user && (
                  <Button>
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="flex flex-col hover:shadow-lg transition-all duration-200 border-2">
                    <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="mb-2">
                          {lesson.courses?.level || "Curso"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Orden {lesson.order_index}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg flex items-start gap-2">
                        <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                        <span className="line-clamp-2">{lesson.title}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{lesson.courses?.name || "Curso"}</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-4 flex-grow flex flex-col">
                      <div className="space-y-4 flex-grow">
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {lesson.description}
                          </p>
                        )}
                        
                        {/* Información del curso */}
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Idioma:</span>
                            <Badge variant="outline" className="text-xs">
                              {lesson.courses?.language || "Español"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Publicada:</span>
                            <span className="font-medium">{formatDate(lesson.created_at)}</span>
                          </div>
                        </div>

                        {/* Recursos disponibles */}
                        {(lesson.pdf_url || lesson.audio_url) && (
                          <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-sm flex items-center gap-2 text-blue-700">
                              <Folder className="h-4 w-4" />
                              Recursos de la lección
                            </h4>
                            
                            {/* PDF */}
                            {lesson.pdf_url && (
                              <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200 group hover:border-blue-500 transition-colors">
                                <div className="flex items-center space-x-2 text-sm">
                                  <File className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <p className="font-medium">Material de estudio</p>
                                    <p className="text-xs text-muted-foreground">PDF</p>
                                  </div>
                                </div>
                                <a 
                                  href={lesson.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                >
                                  Abrir
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            
                            {/* Audio */}
                            {lesson.audio_url && (
                              <div className="bg-white p-3 rounded border border-purple-200 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                                  <Music className="h-4 w-4" />
                                  Audio de la lección
                                </div>
                                <div className="flex items-center gap-2">
                                  <audio 
                                    controls 
                                    className="flex-1 h-8"
                                    style={{
                                      backgroundColor: 'transparent',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    <source src={lesson.audio_url} type="audio/mpeg" />
                                    Tu navegador no soporta el elemento de audio.
                                  </audio>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(lesson.audio_url!, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Estado de la lección */}
                        <div className="flex items-center justify-between pt-3 border-t mt-auto">
                          <Badge 
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Disponible
                          </Badge>
                          
                          <div className="flex gap-1">
                            {lesson.pdf_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={lesson.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {lesson.audio_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={lesson.audio_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensaje de ayuda */}
        {!loading && lessons.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">¿Cómo usar las lecciones?</h4>
                  <p className="text-sm text-blue-700">
                    • Descarga los materiales PDF para estudiar offline<br/>
                    • Escucha los audios para practicar comprensión oral<br/>
                    • Completa las lecciones en orden recomendado<br/>
                    • Contacta a tu profesor si tienes dudas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}