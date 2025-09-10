"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentLessons } from "@/lib/lessons"

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
                  <Card key={lesson.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{lesson.title}</CardTitle>
                      <CardDescription>{lesson.courses.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                        {lesson.media_url && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 opacity-70" />
                            <span>Recurso multimedia disponible</span>
                          </div>
                        )}
                        <div className="mt-3">
                          <Badge variant="outline">
                            {lesson.status === "completed" ? "Completada" : "En progreso"}
                          </Badge>
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