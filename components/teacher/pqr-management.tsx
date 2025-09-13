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
import { getPQRsByTeacher, updatePQR } from "@/lib/pqrs";
import type { PQR } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// Tipos para PQR
type PQRStatusType = "pending" | "in_progress" | "resolved" | "closed";

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

interface PQRManagementProps {
  teacherId: string;
}

// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

const detailCardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function PQRManagement({ teacherId }: PQRManagementProps) {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPqr, setSelectedPqr] = useState<PQR | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<PQRStatusType>("in_progress");

  useEffect(() => {
    const fetchPQRs = async () => {
      setLoading(true);
      try {
        const data = await getPQRsByTeacher(teacherId || "");
        setPqrs(data);
      } catch (error) {
        console.error("Error fetching PQRs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPQRs();
  }, [teacherId]);

  const handleSelectPqr = (pqr: PQR) => {
    setSelectedPqr(pqr);
    setResponse(pqr.teacher_response || "");
    setNewStatus(pqr.status as PQRStatusType);
  };

  const handleUpdatePqr = async () => {
    if (!selectedPqr) return;

    try {
      await updatePQR(selectedPqr.id, newStatus, response);

      const updatedPqrs = pqrs.map((pqr) =>
        pqr.id === selectedPqr.id
          ? {
            ...pqr,
            status: newStatus,
            teacher_response: response,
            resolved_at: newStatus === "resolved" ? new Date().toISOString() : pqr.resolved_at,
          }
          : pqr
      );

      setPqrs(updatedPqrs);
      alert("PQR actualizado exitosamente.");
      setSelectedPqr(null);
    } catch (error) {
      console.error("Error updating PQR:", error);
      alert("Error al actualizar el PQR. Inténtalo de nuevo.");
    }
  };

  const getStatusCount = (status: PQRStatusType) => {
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
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de PQR</h2>
        <p className="text-muted-foreground">
          Revisa y responde a las peticiones, quejas y reclamos de tus estudiantes.
        </p>
      </div>

      {/* Status Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} whileTap={{ scale: 0.95 }}>
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
        </motion.div>
        <motion.div variants={itemVariants} whileTap={{ scale: 0.95 }}>
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
        </motion.div>
        <motion.div variants={itemVariants} whileTap={{ scale: 0.95 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount("resolved")}</div>
              <p className="text-xs text-muted-foreground">Con respuesta del profesor</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants} whileTap={{ scale: 0.95 }}>
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
        </motion.div>
      </motion.div>

      {/* PQR List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PQR List Table */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.5, type: "spring", stiffness: 100 } }}
        >
          <Card>
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
                    <AnimatePresence>
                      {pqrs.map((pqr) => (
                        <motion.tr
                          key={pqr.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                          whileTap={{ scale: 0.98 }} // Animación de clic
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
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PQR Detail Card */}
        <AnimatePresence mode="wait">
          {selectedPqr ? (
            <motion.div
              key="detail-card"
              variants={detailCardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="lg:col-span-1"
            >
              <Card>
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
                    <Label htmlFor="teacher-response">Tu Respuesta</Label>
                    <Textarea
                      id="teacher-response"
                      placeholder="Escribe tu respuesta aquí..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" onClick={() => setSelectedPqr(null)}>Cancelar</Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button onClick={handleUpdatePqr}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Enviar Respuesta
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              variants={detailCardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="lg:col-span-1 flex items-center justify-center p-8 text-center"
            >
              <Card>
                <CardContent className="py-8">
                  <MailQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Selecciona un PQR</h3>
                  <p className="text-muted-foreground text-sm">
                    Haz clic en una fila de la tabla para ver sus detalles.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pqrs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
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
        </motion.div>
      )}
    </motion.div>
  );
}