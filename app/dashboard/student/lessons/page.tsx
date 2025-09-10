"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2, File, FileText, Music, Folder, ExternalLink, CheckCircle, ArrowRight, BookOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentLessons } from "@/lib/lessons"
import { Button } from "@/components/ui/button" // <-- Importación agregada

export default function StudentLessonsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user?.id) return
      
      try {
        const lessonsData = await getStudentLessons(user.id)
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

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Lecciones</h2>
          <p className="text-muted-foreground">Información sobre el contenido de tus cursos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lecciones disponibles</CardTitle>
            <CardDescription>Contenido y recursos de tus cursos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay lecciones disponibles en este momento.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        {lesson.courses.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                        
                        {/* Recursos disponibles */}
                        {(lesson.attachments?.length > 0 || lesson.audio_url) && (
                          <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <Folder className="h-4 w-4 text-orange-500" />
                              Recursos disponibles
                            </h4>
                            
                            {/* PDFs */}
                            {lesson.attachments?.map((attachment: string, index: number) => (
                              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border group hover:border-blue-500 transition-colors">
                                <div className="flex items-center space-x-2 text-sm">
                                  <File className="h-4 w-4 text-blue-500" />
                                  <span>Documento {index + 1}</span>
                                </div>
                                <a 
                                  href={attachment} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                                >
                                  Ver PDF
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                            
                            {/* Audio */}
                            {lesson.audio_url && (
                              <div className="bg-white p-3 rounded border space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Music className="h-4 w-4 text-purple-500" />
                                  Audio de la lección
                                </div>
                                <audio 
                                  controls 
                                  className="w-full h-8"
                                  style={{
                                    backgroundColor: 'transparent',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <source src={lesson.audio_url} type="audio/mpeg" />
                                  Tu navegador no soporta el elemento de audio.
                                </audio>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Badge 
                            variant={lesson.status === "completed" ? "secondary" : "default"}
                            className="flex items-center gap-1"
                          >
                            {lesson.status === "completed" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {lesson.status === "completed" ? "Completada" : "En progreso"}
                          </Badge>
                          
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}