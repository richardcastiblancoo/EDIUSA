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
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  MailQuestion,
  MessageSquare,
  Clock,
  ArrowRight,
  XCircle,
  Loader2,
  User,
  GraduationCap,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPQRsForCoordinator, updatePQRByCoordinator } from "@/lib/pqrs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
type PQRStatusType = "pending" | "in_progress" | "closed";
import type { PQR } from "@/lib/supabase";
const getStatusIcon = (status: PQRStatusType) => {
  switch (status) {
    case "pending":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "in_progress":
      return <CircleDashed className="h-4 w-4 text-blue-500 animate-spin" />;
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
  if (interval > 1) return `${Math.floor(interval)} minutos`;
  return "hace unos segundos";
};
export default function CoordinatorPQRPage() {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPqr, setSelectedPqr] = useState<PQR | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<PQRStatusType>("in_progress");
  const [isUpdating, setIsUpdating] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);
  useEffect(() => {
    const fetchPQRs = async () => {
      setLoading(true);
      try {
        const data = await getPQRsForCoordinator();
        setPqrs(data);
      } catch (error) {
        console.error("Error fetching PQRs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPQRs();
  }, []);
  const handleSelectPqr = (pqr: PQR) => {
    setSelectedPqr(pqr);
    setResponse(pqr.coordinator_response || "");
    // Asegurarse de que el estado sea uno de los nuevos tipos. Si es 'resolved', se cambia a 'closed' por defecto.
    const currentStatus = pqr.status as PQRStatusType;
    setNewStatus(currentStatus === 'resolved' ? 'closed' : currentStatus);
    setAlert(null);
  };
  const handleUpdatePqr = async () => {
    if (!selectedPqr) return;
    setIsUpdating(true);
    try {
      await updatePQRByCoordinator(selectedPqr.id, newStatus, response);

      // Actualizar la lista local
      const updatedPqrs = pqrs.map((pqr) =>
        pqr.id === selectedPqr.id
          ? {
            ...pqr,
            status: newStatus,
            coordinator_response: response,
            // MODIFICADO: Se elimina la lógica de 'resolved_at' al resolver
            resolved_at: pqr.resolved_at,
          }
          : pqr
      );
      setPqrs(updatedPqrs);
      setAlert({ message: "PQR actualizado exitosamente.", type: "success" });
      setSelectedPqr(null);
    } catch (error) {
      console.error("Error updating PQR:", error);
      setAlert({ message: "Error al actualizar el PQR. Inténtalo de nuevo.", type: "error" });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setAlert(null), 5000); // Ocultar la alerta después de 5 segundos
    }
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
      <div className="space-y-6 transition-opacity duration-500 animate-in fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de PQR</h2>
          <p className="text-muted-foreground">
            Revisa y responde a las peticiones, quejas y reclamos de los estudiantes.
          </p>
        </div>
        {/* Alerta de éxito/error */}
        {alert && (
          <div className="animate-in fade-in slide-in-from-top-4">
            <Alert variant={alert.type === "success" ? "default" : "destructive"}>
              {/* FIXED: The icon should be conditionally rendered based on alert type */}
              {alert.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertTitle>{alert.type === "success" ? "Éxito" : "Error"}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          </div>
        )}
        {/* Status Cards */}
        {/* MODIFICADO: Ajustado a 3 columnas (lg:grid-cols-3) ya que se eliminó la cuarta card */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("pending")}</div>
              <p className="text-xs text-muted-foreground">PQR sin respuesta</p>
            </CardContent>
          </Card>
          <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <CircleDashed className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("in_progress")}</div>
              <p className="text-xs text-muted-foreground">Siendo gestionadas</p>
            </CardContent>
          </Card>
          {/* ELIMINADO: La tarjeta de "Resueltas" ha sido eliminada. */}
          <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              {/* MODIFICADO: Usar el recuento de 'closed' */}
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
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pqrs.map((pqr) => (
                      <TableRow
                        key={pqr.id}
                        onClick={() => handleSelectPqr(pqr)}
                        className={`
                                                    cursor-pointer
                                                    transition-colors duration-200
                                                    hover:bg-accent/50
                                                    ${selectedPqr?.id === pqr.id ? "bg-accent scale-[1.01] shadow-lg" : ""}
                                                `}
                      >
                        <TableCell className="font-medium">{pqr.subject}</TableCell>
                        <TableCell>{pqr.courseName}</TableCell>
                        <TableCell>{pqr.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={pqr.teacher_id ? "secondary" : "default"} className="w-fit">
                            {pqr.teacher_id ? "Profesor" : "Coordinador"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(pqr.status as PQRStatusType)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getStatusIcon(pqr.status as PQRStatusType)}
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
            <Card className="lg:col-span-1 animate-in fade-in slide-in-from-right-1">
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
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {/* FIXED: Added User and GraduationCap components */}
                      <User className="h-4 w-4" />
                      <span className="font-medium">Enviado por: {selectedPqr.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Creado: {new Date(selectedPqr.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Curso: {selectedPqr.courseName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={selectedPqr.teacher_id ? "secondary" : "default"}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {selectedPqr.teacher_id ? "Enviado al Profesor" : "Enviado al Coordinador"}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm">
                    {selectedPqr.message}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  {/* MODIFICADO: Se añade un cast explícito */}
                  <Select value={newStatus} onValueChange={(value: PQRStatusType) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Proceso</SelectItem>
                      {/* ELIMINADO: SelectItem para "Resuelto" */}
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
                  <Button variant="outline" onClick={() => setSelectedPqr(null)} disabled={isUpdating}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdatePqr} disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Enviar Respuesta
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-1 flex items-center justify-center p-8 text-center animate-in fade-in slide-in-from-right-1">
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