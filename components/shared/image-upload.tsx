"use client";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importado AlertTitle
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
  Upload,
  Camera,
  Loader2,
  X,
  Image as ImageIcon,
  Save,
  Trash2,
} from "lucide-react";
import { uploadImage, deleteUserImage } from "@/lib/images";
import { createClient } from "@supabase/supabase-js";
interface ImageUploadProps {
  userId: string;
  imageType: "avatar" | "logo" | "banner";
  currentImageUrl?: string;
  onImageUpdate?: (imageUrl: string | null) => void;
  title: string;
  description: string;
}
export default function ImageUpload({
  userId,
  imageType,
  currentImageUrl,
  onImageUpdate,
  title,
  description,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const fetchImage = async () => {
      if (!currentImageUrl) {
        const url = await getUserImage(userId, imageType);
        if (url) {
          setImageUrl(url);
          onImageUpdate?.(url);
        }
      } else {
        setImageUrl(currentImageUrl);
      }
    };
    fetchImage();
  }, [userId, imageType, currentImageUrl, onImageUpdate]);
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Por favor selecciona un archivo de imagen válido.",
      });
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "El archivo es muy grande. Máximo 1MB permitido.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
    setMessage(null);
  };
  const handleSaveImage = async () => {
    if (!selectedFile) {
      setMessage({
        type: "error",
        text: "No hay imagen seleccionada para guardar.",
      });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const uploadedUrl = await uploadImage(selectedFile, userId, imageType);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        setPreviewUrl(null); // Limpiar preview después de subir exitosamente
        setSelectedFile(null); // Limpiar archivo seleccionado
        setMessage({ type: "success", text: "Imagen guardada exitosamente." });
        onImageUpdate?.(uploadedUrl);
      } else {
        setMessage({ type: "error", text: "Error al guardar la imagen." });
      }
    } catch (error) {
      console.error("Error al guardar la imagen:", error);
      setMessage({
        type: "error",
        text: "Error inesperado al guardar la imagen.",
      });
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveImageConfirmed = async () => {
    setShowConfirmDialog(false);
    try {
      const ok = await deleteUserImage(userId, imageType);
      if (ok) {
        setImageUrl("");
        setPreviewUrl(null);
        setSelectedFile(null);
        setMessage({ type: "success", text: "Imagen eliminada exitosamente." });
        onImageUpdate?.(null);
      } else {
        setMessage({ type: "error", text: "No se pudo eliminar la imagen." });
      }
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      setMessage({
        type: "error",
        text: "Error inesperado al eliminar la imagen.",
      });
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {/* Usar AlertTitle si es relevante, si no solo AlertDescription */}
            {message.type === "error" && <AlertTitle>Error</AlertTitle>}
            {message.type === "success" && <AlertTitle>Éxito</AlertTitle>}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center gap-4">
          {imageType === "avatar" ? (
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={
                  previewUrl ||
                  imageUrl ||
                  "https://api.dicebear.com/7.x/notionists/svg?seed=image"
                }
              />
              <AvatarFallback>
                <Camera className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {previewUrl || imageUrl ? (
                <img
                  src={
                    previewUrl ||
                    imageUrl ||
                    "/placeholder.svg?height=80&width=128&text=Image"
                  }
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Imagen
            </Button>
            {(imageUrl || selectedFile) && (
              // Usamos AlertDialogTrigger para abrir el diálogo
              <AlertDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    disabled={uploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-lg">
                      <Trash2 className="mr-2 h-5 w-5 text-red-500" />
                      ¿Estás absolutamente seguro?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará
                      permanentemente la imagen de tu perfil/entidad de nuestros
                      servidores.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveImageConfirmed}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Sí, eliminar imagen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        {/* Botón de Guardar Cambios movido al final, como en el original, para coherencia */}
        <div className="flex justify-end space-x-2 mt-4">
          {selectedFile && (
            <Button
              onClick={handleSaveImage}
              disabled={uploading}
              variant="default"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
        {/* Hidden input for file selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-xs text-muted-foreground">
          <p>Formatos soportados: JPG, PNG, GIF</p>
          <p>Tamaño máximo: 1MB</p>
          {imageType === "avatar" && <p>Recomendado: 400x400px</p>}
          {imageType === "logo" && <p>Recomendado: 200x100px</p>}
          {imageType === "banner" && <p>Recomendado: 1200x300px</p>}
        </div>
      </CardContent>
    </Card>
  );
}

import { supabase } from "@/lib/supabase";

export async function getUserImage(
  userId: string,
  imageType: "avatar" | "logo" | "banner"
): Promise<string | null> {
  try {
    // Aseguramos que se incluyan los headers correctos
    const headers = {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    const { data, error } = await supabase
      .from("user_images")
      .select("image_url")
      .eq("user_id", userId)
      .eq("image_type", imageType)
      .eq("is_active", true)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        console.info(`No active ${imageType} image found for user ${userId}.`);
        return null;
      }
      console.error(
        `Error fetching user ${imageType} image for user ${userId}:`,
        error
      );
      return null;
    }
    if (!data) return null;
    return data.image_url;
  } catch (error) {
    console.error("Get user image (unexpected) error:", error);
    return null;
  }
}
