"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getStudentsForTeacher, registerAttendance, registerGrade, AttendanceStatus } from "@/lib/students"

export default function TeacherStudentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  
  // Estado para el formulario de asistencia y notas
  const [attendanceForm, setAttendanceForm] = useState({
    lessonId: "",
    status: "" as AttendanceStatus
  })
  
  const [gradeForm, setGradeForm] = useState({
    lessonId: "",
    score: ""
  })

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

  // Manejar registro de asistencia
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !attendanceForm.lessonId || !attendanceForm.status) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    try {
      // Aquí necesitaríamos el enrollment_id, que tendríamos que obtener
      // En una implementación real, necesitaríamos obtener el enrollment_id correcto
      const enrollmentId = selectedStudent // Esto es una simplificación
      
      const result = await registerAttendance(
        enrollmentId,
        attendanceForm.lessonId,
        attendanceForm.status
      )

      if (result) {
        toast({
          title: "Éxito",
          description: "Asistencia registrada correctamente"
        })
        // Resetear formulario
        setAttendanceForm({ lessonId: "", status: "" as AttendanceStatus })
      }
    } catch (error) {
      console.error("Error registrando asistencia:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia",
        variant: "destructive"
      })
    }
  }

  // Manejar registro de notas
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !gradeForm.lessonId || !gradeForm.score) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    try {
      // Aquí necesitaríamos el enrollment_id, que tendríamos que obtener
      // En una implementación real, necesitaríamos obtener el enrollment_id correcto
      const enrollmentId = selectedStudent // Esto es una simplificación
      
      const result = await registerGrade(
        enrollmentId,
        gradeForm.lessonId,
        parseFloat(gradeForm.score)
      )

      if (result) {
        toast({
          title: "Éxito",
          description: "Nota registrada correctamente"
        })
        // Resetear formulario
        setGradeForm({ lessonId: "", score: "" })
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
          <h2 className="text-3xl font-bold tracking-tight">Estudiantes</h2>
          <p className="text-muted-foreground">Gestiona y revisa el progreso de tus estudiantes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Estudiantes de tus cursos</CardDescription>
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
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedStudent(student.id)}
                        >
                          Seleccionar
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Formulario de Asistencia */}
            <Card>
              <CardHeader>
                <CardTitle>Registrar Asistencia</CardTitle>
                <CardDescription>
                  Registra la asistencia del estudiante seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID de la Lección</label>
                    <Input 
                      value={attendanceForm.lessonId}
                      onChange={(e) => setAttendanceForm({...attendanceForm, lessonId: e.target.value})}
                      placeholder="Ingresa el ID de la lección"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select 
                      value={attendanceForm.status}
                      onValueChange={(value) => setAttendanceForm({...attendanceForm, status: value as AttendanceStatus})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Presente">Presente</SelectItem>
                        <SelectItem value="Ausente">Ausente</SelectItem>
                        <SelectItem value="Tarde">Tarde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="submit">Registrar Asistencia</Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Formulario de Notas */}
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nota</CardTitle>
                <CardDescription>
                  Registra la nota del estudiante seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGradeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ID de la Lección</label>
                    <Input 
                      value={gradeForm.lessonId}
                      onChange={(e) => setGradeForm({...gradeForm, lessonId: e.target.value})}
                      placeholder="Ingresa el ID de la lección"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Calificación (0-100)</label>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                      placeholder="Ingresa la calificación"
                    />
                  </div>
                  
                  <Button type="submit">Registrar Nota</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
