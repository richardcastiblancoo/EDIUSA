"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, CircleDashed, MailQuestion, MessageSquare, Clock, Send, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createPQR, getPQRsByStudent } from "@/lib/pqrs";
import { getStudentCourses } from "@/lib/courses";
import type { PQR } from "@/lib/supabase";
import type { CourseWithTeacher } from "@/lib/courses";

interface PQRFormProps {
  studentId: string;
}

export default function PQRForm({ studentId }: PQRFormProps) {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    courseId: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPqr, setSelectedPqr] = useState<PQR | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pqrsData, coursesData] = await Promise.all([
          getPQRsByStudent(studentId),
          getStudentCourses(studentId),
        ]);
        setPqrs(pqrsData);
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      courseId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.subject || !formData.message) {
      alert("Por favor completa todos los campos");
      return;
    }

    setSubmitting(true);
    try {
      const selectedCourse = courses.find(course => course.id === formData.courseId);
      if (!selectedCourse || !selectedCourse.teacher_id) {
        throw new Error("No se pudo encontrar el profesor del curso seleccionado");
      }

      await createPQR(
        studentId,
        formData.courseId,
        selectedCourse.teacher_id,
        formData.subject,
        formData.message
      );

      // Resetear el formulario
      setFormData({
        courseId: "",
        subject: "",
        message: "",
      });

      // Recargar los PQRs
      const updatedPqrs = await getPQRsByStudent(studentId);
      setPqrs(updatedPqrs);

      alert("PQR enviado exitosamente");
    } catch (error) {
      console.error("Error al enviar PQR:", error);
      alert("Error al enviar el PQR. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPqr = (pqr: PQR) => {
    setSelectedPqr(pqr);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_progress":
        return "default";
      case "resolved":
        return "success";
      case "closed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-3 w-3" />;
      case "in_progress":
        return <CircleDashed className="h-3 w-3" />;
      case "resolved":
        return <CheckCircle2 className="h-3 w-3" />;
      case "closed":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusCount = (status: string) => {
    return pqrs.filter((pqr) => pqr.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Peticiones, Quejas y Reclamos</h2>
        <p className="text-muted-foreground">
          Envía tus inquietudes a coordinadores y profesores.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("pending")}</div>
            <p className="text-xs text-muted-foreground">Sin respuesta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <CircleDashed className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("in_progress")}</div>
            <p className="text-xs text-muted-foreground">Siendo gestionados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("resolved")}</div>
            <p className="text-xs text-muted-foreground">Con respuesta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount("closed")}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* PQR Form and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PQR Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nuevo PQR
            </CardTitle>
            <CardDescription>
              Completa el formulario para enviar tu solicitud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Select value={formData.courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} - {course.teachers?.name || "Sin profesor"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Escribe un asunto breve"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe tu petición, queja o reclamo"
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Enviando..." : "Enviar PQR"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* PQR List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mis PQRs
            </CardTitle>
            <CardDescription>
              Historial de tus peticiones, quejas y reclamos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pqrs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pqrs.map((pqr) => (
                      <TableRow
                        key={pqr.id}
                        onClick={() => handleSelectPqr(pqr)}
                        className={`cursor-pointer ${selectedPqr?.id === pqr.id ? "bg-accent" : ""}`}
                      >
                        <TableCell className="font-medium">{pqr.subject}</TableCell>
                        <TableCell>{pqr.courses?.name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(pqr.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(pqr.status)}
                            {pqr.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatTimeAgo(pqr.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <MailQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No has enviado ningún PQR
                </h3>
                <p className="text-muted-foreground mb-4">
                  Utiliza el formulario para enviar tu primera solicitud.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PQR Detail */}
        {selectedPqr && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailQuestion className="h-5 w-5" />
                Detalles del PQR
              </CardTitle>
              <CardDescription>
                Información completa de tu solicitud.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">{selectedPqr.subject}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Creado: {new Date(selectedPqr.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Curso: {selectedPqr.courses?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>Profesor: {selectedPqr.teachers?.name}</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm">
                  {selectedPqr.message}
                </div>
              </div>

              {selectedPqr.teacher_response && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Respuesta del profesor:</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm">
                    {selectedPqr.teacher_response}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPqr(null)}>Cerrar</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}