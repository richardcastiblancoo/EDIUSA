"use client"

import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Asume que tu cliente de Supabase está configurado de esta forma
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fptbvhzxodzlwhcqshkm.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwdGJ2aHp4b2R6bHdoY3FzaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDM3ODgsImV4cCI6MjA3MDQxOTc4OH0.x1TfIG7-qUZ0x3sC9h0valKqOgQqhXokYfFkoVgPUFw"
const supabase = createClient(supabaseUrl, supabaseAnonKey)


export default function CoordinatorReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportType, setReportType] = useState<string | null>(null)
  const [reportSubType, setReportSubType] = useState<string | null>(null)
  const [reportOptions, setReportOptions] = useState<any>({
    courseName: "",
    studentName: "",
  })
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      // Usando el cliente de Supabase que configuraste
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoadingUser(false)
    }
    fetchUser()
  }, [supabase])

  const handleGenerateReport = async () => {
    if (!reportType || !reportSubType) return

    setLoadingReport(true)
    setReportData(null)

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: reportType,
        reportSubType: reportSubType,
        options: reportOptions,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      setReportData(data)
    } else {
      console.error('Error al generar el reporte:', response.statusText)
      // Opcional: mostrar un mensaje de error al usuario
    }
    setLoadingReport(false)
  }

  const renderReportContent = () => {
    if (loadingReport) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Generando reporte...</span>
        </div>
      )
    }

    if (!reportData) {
      return (
        <div className="text-center text-muted-foreground p-8">
          <p>Selecciona las opciones y haz clic en "Generar Reporte".</p>
        </div>
      )
    }

    return (
      <CardContent>
        <CardTitle>{reportData.title}</CardTitle>
        <CardDescription className="mt-1">
          Reporte generado el {new Date().toLocaleDateString()}
        </CardDescription>
        <div className="mt-4 space-y-2">
          {reportData.data.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center border-b pb-2">
              {reportType === "course" && (
                <>
                  <span>Estudiante: {item.student_name}</span>
                  <span>
                    {reportSubType === "grades" ? `Nota: ${item.grade}` : `Asistencia: ${item.attendance_percentage}%`}
                  </span>
                </>
              )}
              {reportType === "student" && (
                <>
                  <span>Curso: {item.course_name}</span>
                  <span>
                    {reportSubType === "grades" ? `Nota: ${item.grade}` : `Asistencia: ${item.attendance_percentage}%`}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    )
  }

  if (loadingUser) {
    return (
      <DashboardLayout userRole="coordinator">
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout userRole="coordinator">
        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
          <p>Debes iniciar sesión para ver los reportes.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="coordinator">
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Generador de Reportes</h2>
            <p className="text-muted-foreground">Crea reportes personalizados según tus necesidades</p>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select onValueChange={(value) => { setReportType(value); setReportData(null); }}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="student">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType && (
              <div className="space-y-2">
                <Label htmlFor="report-subtype">Sub-tipo de Reporte</Label>
                <Select onValueChange={(value) => { setReportSubType(value); setReportData(null); }}>
                  <SelectTrigger id="report-subtype">
                    <SelectValue placeholder="Selecciona un sub-tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grades">Notas</SelectItem>
                    <SelectItem value="attendance">Asistencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "course" && (
              <div className="space-y-2">
                <Label htmlFor="course-name">Nombre del Curso</Label>
                <Input
                  id="course-name"
                  placeholder="Ej: Inglés B1"
                  value={reportOptions.courseName}
                  onChange={(e) => setReportOptions({ ...reportOptions, courseName: e.target.value })}
                />
              </div>
            )}

            {reportType === "student" && (
              <div className="space-y-2">
                <Label htmlFor="student-name">Nombre del Estudiante</Label>
                <Input
                  id="student-name"
                  placeholder="Ej: Ana Poveda"
                  value={reportOptions.studentName}
                  onChange={(e) => setReportOptions({ ...reportOptions, studentName: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleGenerateReport} disabled={loadingReport || !reportType || !reportSubType}>
              {loadingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Reporte</CardTitle>
          </CardHeader>
          {renderReportContent()}
        </Card>
      </div>
    </DashboardLayout>
  )
}