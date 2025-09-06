"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentsForTeacher, registerGrade } from "@/lib/students"

export default function TeacherGradesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string>("") 
  const [score, setScore] = useState<string>("")
  
  useEffect(() => {
    const loadStudents = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        const studentsData = await getStudentsForTeacher(user.id)
        setStudents(studentsData)
      } catch (error) {
        console.error("Error cargando estudiantes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los estudiantes",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [user?.id])

  // Filtrar estudiantes por término de búsqueda
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.documentId.includes(searchTerm)
  )

  // Manejar registro de notas
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedLesson || !score) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }
  
    try {
      // Obtener el estudiante seleccionado
      const student = students.find(s => s.id === selectedStudent)
      if (!student?.enrollmentId) {
        toast({
          title: "Error",
          description: "No se pudo encontrar la inscripción del estudiante",
          variant: "destructive"
        })
        return
      }
      
      // Generar un UUID para la lección
      const lessonUUID = crypto.randomUUID()
  
      // Guardar la relación entre el nombre de la lección y su UUID en localStorage
      const lessonMap = JSON.parse(localStorage.getItem('lessonMap') || '{}')
      lessonMap[lessonUUID] = selectedLesson
      localStorage.setItem('lessonMap', JSON.stringify(lessonMap))
      
      const result = await registerGrade(
        student.enrollmentId, // Usar el enrollment_id correcto
        lessonUUID,
        parseFloat(score)
      )
  
      if (result) {
        toast({
          title: "Éxito",
          description: "Nota registrada correctamente"
        })
        // Resetear formulario
        setScore("")
        setSelectedLesson("")
      }
    } catch (error) {
      console.error("Error registrando nota:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la nota",
        variant: "destructive"
      })
    }
  }

  return (
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registrar Notas</h2>
          <p className="text-muted-foreground">Registra las calificaciones de tus estudiantes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Estudiantes</CardTitle>
            <CardDescription>Selecciona un estudiante para registrar su calificación</CardDescription>
            <div className="mt-2">
              <Input 
                placeholder="Buscar por nombre, email o documento" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No se encontraron estudiantes con ese criterio" : "No tienes estudiantes asignados"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photoUrl} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{student.name}</span>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.documentId}</TableCell>
                      <TableCell>
                        <Button 
                          variant={selectedStudent === student.id ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setSelectedStudent(student.id)}
                        >
                          {selectedStudent === student.id ? "Seleccionado" : "Seleccionar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nota</CardTitle>
              <CardDescription>
                Registra la calificación del estudiante seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID de la Lección</label>
                  <Input 
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    placeholder="Ingresa el ID de la lección"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calificación (0-100)</label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Ingresa la calificación"
                  />
                </div>
                
                <Button type="submit">Registrar Nota</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}