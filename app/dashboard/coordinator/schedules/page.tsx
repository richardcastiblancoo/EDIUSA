"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, CircleDashed, MailQuestion, MessageSquare, Clock, ArrowRight, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Remove unused import since PQRStatus is not being used in this file

// Mock data and API functions
// In a real application, these would be fetched from your API
type PQRStatusType = "pending" | "in_progress" | "resolved" | "closed";

interface PQR {
  id: string;
  courseId: string;
  courseName: string;
  studentName: string;
  subject: string;
  message: string;
  createdAt: string;
  status: PQRStatusType;
  coordinatorResponse?: string;
  resolvedAt?: string;
}

const mockPqrs: PQR[] = [
  {
    id: "pqr-001",
    courseId: "course-001",
    courseName: "Introducción a la Programación",
    studentName: "Juan Pérez",
    subject: "Consulta sobre nota final",
    message: "Hola, ¿podrían revisar mi nota del examen final? Creo que hubo un error en la calificación de una pregunta.",
    createdAt: "2025-08-20T10:00:00Z",
    status: "pending",
  },
  {
    id: "pqr-002",
    courseId: "course-002",
    courseName: "Bases de Datos Avanzadas",
    studentName: "Ana Gómez",
    subject: "Reclamo por horario de clase",
    message: "El horario de la clase de los miércoles se superpone con otra clase obligatoria. ¿Hay posibilidad de un cambio o de recibir la grabación?",
    createdAt: "2025-08-19T15:30:00Z",
    status: "in_progress",
    coordinatorResponse: "Estamos revisando su petición con el profesor del curso y la oficina de admisiones. Le informaremos tan pronto tengamos una solución.",
  },
  {
    id: "pqr-003",
    courseId: "course-001",
    courseName: "Introducción a la Programación",
    studentName: "Pedro Ramírez",
    subject: "Queja sobre material de estudio",
    message: "El material de lectura de la semana 5 está desactualizado y no coincide con el contenido de las clases. Sugiero que lo revisen.",
    createdAt: "2025-08-18T09:15:00Z",
    status: "resolved",
    coordinatorResponse: "Gracias por tu retroalimentación. Hemos actualizado el material de estudio y lo hemos subido a la plataforma. Puedes acceder a la nueva versión ahora.",
    resolvedAt: "2025-08-18T14:00:00Z",
  },
];

const getStatusIcon = (status: PQRStatusType) => {
  switch (status) {
    case "pending":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "in_progress":
      return <CircleDashed className="h-4 w-4 text-blue-500 animate-spin" />;
    case "resolved":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "closed":
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <MailQuestion className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeVariant = (status: PQRStatusType) => {
  switch (status) {
    case "pending":
      return "destructive";
    case "in_progress":
      return "secondary";
    case "resolved":
      return "default";
    case "closed":
        return "outline";
    default:
      return "outline";
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutos`;
  return "hace unos segundos";
};

export default function CoordinatorPQRPage() {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPqr, setSelectedPqr] = useState<PQR | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<PQRStatusType>("in_progress");

  useEffect(() => {
    // Simulating API call
    setLoading(true);
    setTimeout(() => {
      setPqrs(mockPqrs);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSelectPqr = (pqr: PQR) => {
    setSelectedPqr(pqr);
    setResponse(pqr.coordinatorResponse || "");
    setNewStatus(pqr.status);
  };

  const handleUpdatePqr = () => {
    if (!selectedPqr) return;

    // Simulating API call to update PQR
    const updatedPqrs = pqrs.map((pqr) =>
      pqr.id === selectedPqr.id
        ? {
            ...pqr,
            status: newStatus,
            coordinatorResponse: response,
            resolvedAt: newStatus === "resolved" ? new Date().toISOString() : pqr.resolvedAt,
          }
        : pqr
    );
    setPqrs(updatedPqrs);
    alert("PQR actualizado exitosamente.");
    setSelectedPqr(null);
  };

  const getStatusCount = (status: PQRStatusType) => {
    return pqrs.filter((pqr) => pqr.status === status).length;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="coordinator">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="coordinator">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de PQR</h2>
          <p className="text-muted-foreground">
            Revisa y responde a las peticiones, quejas y reclamos de los estudiantes.
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
              <p className="text-xs text-muted-foreground">PQR sin respuesta</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <CircleDashed className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("in_progress")}</div>
              <p className="text-xs text-muted-foreground">Siendo gestionadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("resolved")}</div>
              <p className="text-xs text-muted-foreground">Con respuesta del coordinador</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("closed")}</div>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* PQR List and Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PQR List Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Listado de PQR
              </CardTitle>
              <CardDescription>
                Selecciona un PQR de la lista para ver los detalles y responder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Estudiante</TableHead>
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
                        <TableCell>{pqr.courseName}</TableCell>
                        <TableCell>{pqr.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(pqr.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(pqr.status)}
                            {pqr.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatTimeAgo(pqr.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* PQR Detail Card */}
          {selectedPqr ? (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailQuestion className="h-5 w-5" />
                  Detalles del PQR
                </CardTitle>
                <CardDescription>
                  Revisa el mensaje del estudiante y envía tu respuesta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">{selectedPqr.subject}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Creado: {new Date(selectedPqr.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Curso: {selectedPqr.courseName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Estudiante: {selectedPqr.studentName}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm">
                    {selectedPqr.message}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={newStatus} onValueChange={(value: PQRStatusType) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordinator-response">Tu Respuesta</Label>
                  <Textarea
                    id="coordinator-response"
                    placeholder="Escribe tu respuesta aquí..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedPqr(null)}>Cancelar</Button>
                  <Button onClick={handleUpdatePqr}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Enviar Respuesta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-1 flex items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <MailQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">Selecciona un PQR</h3>
                <p className="text-muted-foreground text-sm">
                  Haz clic en una fila de la tabla para ver sus detalles.
                </p>
              </div>
            </Card>
          )}
        </div>

        {pqrs.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MailQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay PQR registrados
              </h3>
              <p className="text-muted-foreground mb-4">
                Parece que todo está en orden.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}