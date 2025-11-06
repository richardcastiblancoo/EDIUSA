"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { deletePQR, createPQR, getPQRsByStudent } from "@/lib/pqrs";
import { getStudentCourses } from "@/lib/courses";
import type { PQR } from "@/lib/supabase";
import type { CourseWithTeacher } from "@/lib/courses";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  MailQuestion,
  MessageSquare,
  Clock,
  Send,
  XCircle,
  CheckCircle,
  Terminal,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface PQRFormProps {
  studentId: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const detailCardVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, x: 100, transition: { duration: 0.3, ease: "easeIn" } },
};

export default function PQRForm({ studentId }: PQRFormProps) {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    courseId: "",
    subject: "",
    message: "",
    recipient: "teacher",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPqr, setSelectedPqr] = useState<PQR | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [studentName, setStudentName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pqrsPerPage = 6;
  const totalPages = Math.ceil(pqrs.length / pqrsPerPage);

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

        if (pqrsData.length > 0 && pqrsData[0].students?.name) {
          setStudentName(pqrsData[0].students.name);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, [studentId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleRecipientChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      recipient: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!formData.courseId || !formData.subject || !formData.message) {
      setAlert({
        message: "Por favor completa todos los campos requeridos.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const selectedCourse = courses.find(
        (course) => course.id === formData.courseId
      );
      if (!selectedCourse) {
        throw new Error("No se pudo encontrar el curso seleccionado");
      }

      const teacherId =
        formData.recipient === "teacher" ? selectedCourse.teacher_id : null;

      if (formData.recipient === "teacher" && !teacherId) {
        throw new Error("Este curso no tiene un profesor asignado");
      }

      const isCoordinator = formData.recipient === "coordinator";

      await createPQR(
        studentId,
        formData.courseId,
        teacherId,
        formData.subject,
        formData.message,
        isCoordinator
      );

      setFormData({
        courseId: "",
        subject: "",
        message: "",
        recipient: "teacher",
      });

      const updatedPqrs = await getPQRsByStudent(studentId);
      setPqrs(updatedPqrs);
      setAlert({ message: "¡PQR enviado exitosamente!", type: "success" });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Nuevo PQR", {
          body: `Se ha enviado un nuevo PQR: ${formData.subject}`,
          icon: "/placeholder-logo.png",
        });
      }
    } catch (error: any) {
      console.error("Error al enviar PQR:", error);
      setAlert({
        message: error.message || "Error al enviar el PQR. Inténtalo de nuevo.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPqr = (pqr: PQR) => {
    setSelectedPqr(pqr);
  };

  const handleDelete = async () => {
    if (!selectedPqr) return;

    try {
      if (
        selectedPqr.status !== "pending" &&
        selectedPqr.status !== "in_progress"
      ) {
        setAlert({
          message: "Solo se pueden eliminar PQRs pendientes o en progreso.",
          type: "error",
        });
        setIsDeleteAlertOpen(false);
        return;
      }

      const success = await deletePQR(selectedPqr.id);
      if (success) {
        const updatedPqrs = await getPQRsByStudent(studentId);
        setPqrs(updatedPqrs);
        setSelectedPqr(null);
        setAlert({ message: "PQR eliminado exitosamente", type: "success" });
      } else {
        setAlert({ message: "Error al eliminar el PQR", type: "error" });
      }
    } catch (error) {
      console.error("Error al eliminar PQR:", error);
      setAlert({ message: "Error al eliminar el PQR", type: "error" });
    } finally {
      setIsDeleteAlertOpen(false);
    }
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

  const getRecipientName = (pqr: PQR) => {
    // Si no hay teacher_id, el destinatario es el coordinador
    return pqr.teacher_id ? (pqr.teachers?.name || "Profesor") : "Coordinador";
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
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusCount = (status: string) => {
    return pqrs.filter((pqr) => pqr.status === status).length;
  };

  const indexOfLastPqr = currentPage * pqrsPerPage;
  const indexOfFirstPqr = indexOfLastPqr - pqrsPerPage;
  const currentPqrs = pqrs.slice(indexOfFirstPqr, indexOfLastPqr);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Peticiones, Quejas y Reclamos
          </h2>
          <p className="text-muted-foreground">
            Envía tus inquietudes a coordinadores y profesores.
          </p>
        </div>
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                variant={alert.type === "success" ? "default" : "destructive"}
                className={alert.type === "success" ? "border-green-500" : ""}
              >
                {alert.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Terminal className="h-4 w-4" />
                )}
                <AlertTitle className="ml-2">
                  {alert.type === "success" ? "¡Éxito!" : "¡Error!"}
                </AlertTitle>
                <AlertDescription className="ml-2">
                  {alert.message}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" /* Modificado de lg:grid-cols-4 a lg:grid-cols-3 */
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendientes
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getStatusCount("pending")}
                </div>
                <p className="text-xs text-muted-foreground">Sin respuesta</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  En Proceso
                </CardTitle>
                <CircleDashed className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getStatusCount("in_progress")}
                </div>
                <p className="text-xs text-muted-foreground">
                  Siendo gestionados
                </p>
              </CardContent>
            </Card>
          </motion.div>
          {/* Tarjeta "Resueltos" ELIMINADA */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
                <XCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getStatusCount("closed")}
                </div>
                <p className="text-xs text-muted-foreground">Finalizados</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-1"
          >
            <Card>
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
                    <Select
                      value={formData.courseId}
                      onValueChange={handleCourseChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} -{" "}
                            {course.teachers?.name || "Sin profesor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.courseId && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Curso seleccionado:{" "}
                        {courses.find((c) => c.id === formData.courseId)
                          ?.name || ""}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student">Estudiante</Label>
                    <p className="text-sm font-medium">
                      {studentName || "Cargando nombre..."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirigido a</Label>
                    <RadioGroup
                      value={formData.recipient}
                      onValueChange={handleRecipientChange}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher">Profesor del curso</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="coordinator" id="coordinator" />
                        <Label htmlFor="coordinator">Coordinador</Label>
                      </div>
                    </RadioGroup>
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Enviando..." : "Enviar PQR"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="lg:col-span-2"
          >
            <Card>
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
                          <TableHead>Destinatario</TableHead>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPqrs.map((pqr) => (
                          <TableRow
                            key={pqr.id}
                            onClick={() => handleSelectPqr(pqr)}
                            className={`cursor-pointer ${
                              selectedPqr?.id === pqr.id ? "bg-accent" : ""
                            }`}
                          >
                            <TableCell className="font-medium">
                              {pqr.subject}
                            </TableCell>
                            <TableCell>{pqr.courses?.name || "N/A"}</TableCell>
                            <TableCell>{getRecipientName(pqr)}</TableCell>
                            <TableCell>{pqr.students?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getStatusIcon(pqr.status)}
                                <span className="capitalize">{pqr.status.replace("_", " ")}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {new Date(pqr.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {pqrs.length > pqrsPerPage && (
                      <div className="flex justify-end items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={prevPage}
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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
          </motion.div>
        </div>
        <AnimatePresence>
          {selectedPqr && (
            <motion.div
              key="pqr-detail-card"
              variants={{
                hidden: { opacity: 0, x: 100 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
                exit: { opacity: 0, x: 100, transition: { duration: 0.3, ease: "easeIn" } },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="lg:col-span-3"
            >
              <Card>
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
                    <h4 className="font-semibold text-lg">
                      {selectedPqr.subject}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Creado:{" "}
                        {new Date(selectedPqr.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        <strong>Enviado por:</strong>{" "}
                        {selectedPqr.students?.name || "No disponible"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>Curso: {selectedPqr.courses?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>Destinatario: {getRecipientName(selectedPqr)}</span>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm">
                      {selectedPqr.message}
                    </div>
                  </div>

                  {selectedPqr.teacher_response && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Respuesta:</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm">
                        {selectedPqr.teacher_response}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    {selectedPqr.status !== "closed" && (
                      <AlertDialog
                        open={isDeleteAlertOpen}
                        onOpenChange={setIsDeleteAlertOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Estás absolutamente seguro?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará
                              permanentemente tu PQR de nuestros servidores.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Continuar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPqr(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}