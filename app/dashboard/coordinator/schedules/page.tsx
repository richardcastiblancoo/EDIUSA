"use client"

import React from "react"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { getAllCourses, getCourseSchedules } from "@/lib/courses"
import type { Course, Schedule } from "@/lib/courses"

export default function CoordinatorSchedulesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    const coursesData = await getAllCourses()
    setCourses(coursesData)

    // Load schedules for each course
    const schedulesData: Record<string, Schedule[]> = {}
    for (const course of coursesData) {
      const courseSchedules = await getCourseSchedules(course.id)
      schedulesData[course.id] = courseSchedules
    }
    setSchedules(schedulesData)
    setLoading(false)
  }

  const getDayName = (dayNumber: number) => {
    const days = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return days[dayNumber] || ""
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
    return slots
  }

  const getDaysOfWeek = () => [
    { number: 1, name: "Lunes" },
    { number: 2, name: "Martes" },
    { number: 3, name: "Miércoles" },
    { number: 4, name: "Jueves" },
    { number: 5, name: "Viernes" },
    { number: 6, name: "Sábado" },
  ]

  const getScheduleForTimeSlot = (day: number, timeSlot: string) => {
    const allSchedules = Object.values(schedules).flat()
    return allSchedules.find(
      (schedule) => schedule.day_of_week === day && schedule.start_time <= timeSlot && schedule.end_time > timeSlot,
    )
  }

  const getCourseForSchedule = (schedule: Schedule) => {
    return courses.find((course) => course.id === schedule.course_id)
  }

  if (loading) {
    return (
      <DashboardLayout userRole="coordinator">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="coordinator">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Horarios</h2>
          <p className="text-muted-foreground">Visualiza y gestiona los horarios de todos los cursos</p>
        </div>

        {/* Weekly Schedule Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horario Semanal
            </CardTitle>
            <CardDescription>Vista general de todos los horarios de clases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 min-w-[800px]">
                {/* Header */}
                <div className="font-semibold text-center p-2">Hora</div>
                {getDaysOfWeek().map((day) => (
                  <div key={day.number} className="font-semibold text-center p-2">
                    {day.name}
                  </div>
                ))}

                {/* Time slots */}
                {getTimeSlots().map((timeSlot) => (
                  <React.Fragment key={timeSlot}>
                    <div className="text-sm text-muted-foreground text-center p-2 border-r">{formatTime(timeSlot)}</div>
                    {getDaysOfWeek().map((day) => {
                      const schedule = getScheduleForTimeSlot(day.number, timeSlot)
                      const course = schedule ? getCourseForSchedule(schedule) : null

                      return (
                        <div key={`${day.number}-${timeSlot}`} className="p-1 border border-gray-200 min-h-[60px]">
                          {schedule && course && (
                            <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs">
                              <div className="font-medium truncate">{course.name}</div>
                              <div className="text-muted-foreground">{course.teacher?.name}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{schedule.classroom}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Details */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.course_code}</CardDescription>
                  </div>
                  <Badge variant="outline">{course.language}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.teacher?.name || "Sin profesor asignado"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {course.enrolled_count || 0}/{course.capacity} estudiantes
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Horarios:</span>
                    </div>
                    {schedules[course.id]?.length > 0 ? (
                      <div className="space-y-1">
                        {schedules[course.id].map((schedule) => (
                          <div key={schedule.id} className="text-sm bg-gray-50 rounded p-2">
                            <div className="font-medium">
                              {getDayName(schedule.day_of_week)} {formatTime(schedule.start_time)} -{" "}
                              {formatTime(schedule.end_time)}
                            </div>
                            {schedule.classroom && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {schedule.classroom}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sin horarios asignados</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay cursos disponibles</h3>
              <p className="text-muted-foreground mb-4">Crea algunos cursos para ver sus horarios aquí</p>
              <Button>Crear Primer Curso</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
