"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, Loader2, X } from "lucide-react"

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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Por favor selecciona un archivo de imagen válido" })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "El archivo es muy grande. Máximo 5MB permitido" })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // For now, we'll use a placeholder URL since Supabase Storage might not be configured
      // In a real implementation, you would upload to Supabase Storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageUrl(result)
        setMessage({ type: "success", text: "Imagen subida exitosamente" })
        onImageUpdate?.(result)
        setUploading(false)
      }
      reader.readAsDataURL(file)

      // TODO: Implement actual Supabase Storage upload
      // const uploadedUrl = await uploadImage(file, userId, imageType)
      // if (uploadedUrl) {
      //   setImageUrl(uploadedUrl)
      //   setMessage({ type: "success", text: "Imagen subida exitosamente" })
      //   onImageUpdate?.(uploadedUrl)
      // } else {
      //   setMessage({ type: "error", text: "Error al subir la imagen" })
      // }
    } catch (error) {
      setMessage({ type: "error", text: "Error inesperado al subir la imagen" })
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (confirm("¿Estás seguro de eliminar esta imagen?")) {
      setImageUrl("")
      setMessage({ type: "success", text: "Imagen eliminada exitosamente" })
      onImageUpdate?.(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
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
              <AvatarImage src={imageUrl || "/placeholder.svg?height=80&width=80&text=Avatar"} />
              <AvatarFallback>
                <Camera className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {imageUrl ? (
                <img
                  src={imageUrl || "/placeholder.svg?height=80&width=128&text=Image"}
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={triggerFileInput} disabled={uploading} variant="outline">
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

        <div className="text-xs text-muted-foreground">
          <p>Formatos soportados: JPG, PNG, GIF</p>
          <p>Tamaño máximo: 5MB</p>
          {imageType === "avatar" && <p>Recomendado: 400x400px</p>}
          {imageType === "logo" && <p>Recomendado: 200x100px</p>}
          {imageType === "banner" && <p>Recomendado: 1200x300px</p>}
        </div>

        <Alert>
          <AlertDescription>
            <strong>Nota:</strong> Las imágenes se almacenan temporalmente. Para producción, configura Supabase Storage.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
