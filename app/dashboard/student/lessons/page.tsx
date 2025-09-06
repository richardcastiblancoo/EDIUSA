"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export default function StudentLessonsPage() {
  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Lecciones</h2>
          <p className="text-muted-foreground">Información sobre dónde se darán tus clases</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Horario de clases</CardTitle>
            <CardDescription>Ubicación y horarios de tus lecciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Inglés Intermedio</CardTitle>
                    <CardDescription>Grupo A</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-sm mb-2">
                      <Calendar className="h-4 w-4 opacity-70" />
                      <span>Lunes y Miércoles</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm mb-2">
                      <Clock className="h-4 w-4 opacity-70" />
                      <span>8:00 AM - 10:00 AM</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm mb-2">
                      <MapPin className="h-4 w-4 opacity-70" />
                      <span>Edificio Central - Aula 305</span>
                    </div>
                    <div className="mt-3">
                      <Badge variant="outline">Presencial</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <p className="text-sm text-muted-foreground">Aquí se mostrarán todas tus lecciones programadas con información sobre ubicación y horarios.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}