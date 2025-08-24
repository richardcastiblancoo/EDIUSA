// src/components/ImageUpload.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, Loader2, X, Image as ImageIcon } from "lucide-react"
import { uploadImage, deleteUserImage, getUserImage } from "@/lib/images"

interface ImageUploadProps {
  userId: string
  imageType: "avatar" | "logo" | "banner"
  currentImageUrl?: string
  onImageUpdate?: (imageUrl: string | null) => void
  title: string
  description: string
}

export default function ImageUpload({
  userId,
  imageType,
  currentImageUrl,
  onImageUpdate,
  title,
  description,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchImage = async () => {
      if (!currentImageUrl) {
        const url = await getUserImage(userId, imageType);
        if (url) {
          setImageUrl(url);
          onImageUpdate?.(url);
        }
      }
    };
    fetchImage();
  }, [userId, imageType, currentImageUrl, onImageUpdate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Por favor selecciona un archivo de imagen válido." })
      return
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB
      setMessage({ type: "error", text: "El archivo es muy grande. Máximo 1MB permitido." })
      return
    }

    // Crear URL de previsualización
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    setMessage(null)

    try {
      const uploadedUrl = await uploadImage(file, userId, imageType)
      if (uploadedUrl) {
        setImageUrl(uploadedUrl)
        setPreviewUrl(null)
        setMessage({ type: "success", text: "Imagen subida exitosamente." })
        onImageUpdate?.(uploadedUrl)
      } else {
        setMessage({ type: "error", text: "Error al subir la imagen." })
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      setMessage({ type: "error", text: "Error inesperado al subir la imagen." })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (confirm("¿Estás seguro de eliminar esta imagen?")) {
      try {
        const ok = await deleteUserImage(userId, imageType)
        if (ok) {
          setImageUrl("")
          setPreviewUrl(null)
          setMessage({ type: "success", text: "Imagen eliminada exitosamente." })
          onImageUpdate?.(null)
        } else {
          setMessage({ type: "error", text: "No se pudo eliminar la imagen." })
        }
      } catch (error) {
        console.error("Error al eliminar la imagen:", error)
        setMessage({ type: "error", text: "Error inesperado al eliminar la imagen." })
      }
    }
  }

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
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          {imageType === "avatar" ? (
            <Avatar className="h-20 w-20">
              <AvatarImage src={previewUrl || imageUrl || "/placeholder.svg?height=80&width=80&text=Avatar"} />
              <AvatarFallback>
                <Camera className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {(previewUrl || imageUrl) ? (
                <img
                  src={previewUrl || imageUrl || "/placeholder.svg?height=80&width=128&text=Image"}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {imageUrl ? "Cambiar" : "Subir"} Imagen
                </>
              )}
            </Button>
            <Button onClick={() => cameraInputRef.current?.click()} disabled={uploading} variant="outline">
              <Camera className="mr-2 h-4 w-4" />
              Tomar Foto
            </Button>
            {imageUrl && (
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 bg-transparent"
              >
                <X className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" />

        <div className="text-xs text-muted-foreground">
          <p>Formatos soportados: JPG, PNG, GIF</p>
          <p>Tamaño máximo: 1MB</p>
          {imageType === "avatar" && <p>Recomendado: 400x400px</p>}
          {imageType === "logo" && <p>Recomendado: 200x100px</p>}
          {imageType === "banner" && <p>Recomendado: 1200x300px</p>}
        </div>
      </CardContent>
    </Card>
  )
}