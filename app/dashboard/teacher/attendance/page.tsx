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
import { getStudentsForTeacher, registerAttendance, AttendanceStatus, getStudentGrades, getStudentAttendance, AttendanceRecord } from "@/lib/students"
import { supabase } from "@/lib/supabase"

export default function TeacherAttendancePage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
    const [selectedLesson, setSelectedLesson] = useState<string>("")
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | "">("")
    const [studentGrades, setStudentGrades] = useState<any[]>([])
    const [loadingGrades, setLoadingGrades] = useState(false)

    // Declaraciones de estado para la asistencia, movidas al lugar correcto
    const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([])
    const [loadingAttendance, setLoadingAttendance] = useState(false)

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

    // Cargar calificaciones cuando se selecciona un estudiante
    useEffect(() => {
        const loadGrades = async () => {
            if (!selectedStudent) {
                setStudentGrades([])
                return
            }

            try {
                setLoadingGrades(true)
                const grades = await getStudentGrades(selectedStudent)
                setStudentGrades(grades)
            } catch (error) {
                console.error("Error cargando calificaciones:", error)
            } finally {
                setLoadingGrades(false)
            }
        }

        loadGrades()
    }, [selectedStudent])

    // Cargar asistencia cuando se selecciona un estudiante, también movido al lugar correcto
    useEffect(() => {
      const loadAttendance = async () => {
        if (!selectedStudent) {
          setStudentAttendance([])
          return
        }

        try {
          setLoadingAttendance(true)
          const student = students.find(s => s.id === selectedStudent)
          if (student?.enrollmentId) {
            const attendance = await getStudentAttendance(student.enrollmentId)
            setStudentAttendance(attendance)
          }
        } catch (error) {
          console.error("Error cargando asistencia:", error)
        } finally {
          setLoadingAttendance(false)
        }
      }

      loadAttendance()
    }, [selectedStudent, students])

    // Filtrar estudiantes por término de búsqueda
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.documentId.includes(searchTerm)
    )

    // Manejar registro de asistencia
    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudent || !selectedLesson || !attendanceStatus) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos",
                variant: "destructive"
            })
            return
        }

        try {
            // En una implementación real, necesitaríamos obtener el enrollment_id correcto
            const enrollmentId = selectedStudent 

            // Generar un UUID para la lección
            const lessonUUID = crypto.randomUUID()

            // Guardar la relación entre el nombre de la lección y su UUID en localStorage
            const lessonMap = JSON.parse(localStorage.getItem('lessonMap') || '{}')
            lessonMap[lessonUUID] = selectedLesson
            localStorage.setItem('lessonMap', JSON.stringify(lessonMap))

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
            
            const result = await registerAttendance(
              student.enrollmentId,
              lessonUUID,
              attendanceStatus
            )

            if (result) {
                toast({
                    title: "Éxito",
                    description: "Asistencia registrada correctamente"
                })
                // Resetear formulario
                setAttendanceStatus("")
                setSelectedLesson("")

                // Actualizar calificaciones y asistencia
                const updatedGrades = await getStudentGrades(selectedStudent)
                setStudentGrades(updatedGrades)
                const updatedAttendance = await getStudentAttendance(student.enrollmentId)
                setStudentAttendance(updatedAttendance)
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

    return (
        <DashboardLayout userRole="teacher">
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Registrar Asistencia</h2>
                    <p className="text-muted-foreground">Registra la asistencia de tus estudiantes</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Estudiantes</CardTitle>
                        <CardDescription>Selecciona un estudiante para registrar su asistencia</CardDescription>
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
                    <div className="space-y-6">
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
                                        <label className="text-sm font-medium">Nombre de la lección</label>
                                        <Input
                                            value={selectedLesson}
                                            onChange={(e) => setSelectedLesson(e.target.value)}
                                            placeholder="Ingresa el nombre de la lección"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Estado</label>
                                        <Select
                                            value={attendanceStatus}
                                            onValueChange={(value) => setAttendanceStatus(value as AttendanceStatus)}
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

                        {/* Mostrar calificaciones del estudiante */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Calificaciones del Estudiante</CardTitle>
                                <CardDescription>
                                    Historial de calificaciones del estudiante seleccionado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingGrades ? (
                                    <p className="text-sm text-muted-foreground">Cargando calificaciones...</p>
                                ) : studentGrades.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Este estudiante aún no tiene calificaciones registradas.
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lección</TableHead>
                                                <TableHead>Calificación</TableHead>
                                                <TableHead>Fecha</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentGrades.map((grade) => {
                                                const lessonMap = JSON.parse(localStorage.getItem('lessonMap') || '{}')
                                                const lessonName = lessonMap[grade.lesson_id] || grade.lesson_id

                                                return (
                                                    <TableRow key={grade.id}>
                                                        <TableCell>{lessonName}</TableCell>
                                                        <TableCell>{grade.score}</TableCell>
                                                        <TableCell>
                                                            {new Date(grade.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                         
                        {/* Tabla de asistencia del estudiante */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Asistencia del Estudiante</CardTitle>
                            <CardDescription>
                              Historial de asistencia del estudiante seleccionado
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {loadingAttendance ? (
                              <p className="text-sm text-muted-foreground">Cargando asistencia...</p>
                            ) : studentAttendance.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Este estudiante aún no tiene registros de asistencia.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Lección</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {studentAttendance.map((record) => {
                                    const lessonMap = JSON.parse(localStorage.getItem('lessonMap') || '{}')
                                    const lessonName = lessonMap[record.lesson_id] || record.lesson_id
                                
                                    return (
                                      <TableRow key={record.id}>
                                        <TableCell>{lessonName}</TableCell>
                                        <TableCell>{record.status}</TableCell>
                                        <TableCell>
                                          {new Date(record.created_at!).toLocaleDateString()}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            )}
                          </CardContent>
                        </Card>

                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}