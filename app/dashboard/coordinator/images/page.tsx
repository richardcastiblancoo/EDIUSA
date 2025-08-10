"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ImageUpload from "@/components/shared/image-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Monitor } from "lucide-react"

export default function CoordinatorImagesPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <DashboardLayout userRole="coordinator">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Imágenes</h2>
          <p className="text-muted-foreground">Administra las imágenes del sistema y perfiles</p>
        </div>

        <Tabs defaultValue="system" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system">Imágenes del Sistema</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ImageUpload
                userId={user.id}
                imageType="logo"
                title="Logo Institucional"
                description="Logo principal de la Universidad Sergio Arboleda"
              />

              <ImageUpload
                userId={user.id}
                imageType="banner"
                title="Banner del Sistema"
                description="Banner principal para el Centro de Idiomas"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Configuración de Imágenes
                </CardTitle>
                <CardDescription>Configuraciones adicionales para las imágenes del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Compresión Automática</h4>
                      <p className="text-sm text-muted-foreground">
                        Las imágenes se comprimen automáticamente para optimizar el rendimiento
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Activo</div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Respaldo en la Nube</h4>
                      <p className="text-sm text-muted-foreground">
                        Todas las imágenes se respaldan automáticamente en Supabase Storage
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">Activo</div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Validación de Formato</h4>
                      <p className="text-sm text-muted-foreground">Solo se permiten formatos JPG, PNG y GIF</p>
                    </div>
                    <div className="text-green-600 font-medium">Activo</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="max-w-md">
              <ImageUpload
                userId={user.id}
                imageType="avatar"
                title="Foto de Perfil"
                description="Tu foto de perfil personal"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Consejos para Fotos de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Usa una imagen clara y profesional</p>
                  <p>• Asegúrate de que tu rostro sea visible</p>
                  <p>• Evita fondos distractivos</p>
                  <p>• La imagen debe ser cuadrada (1:1) para mejores resultados</p>
                  <p>• Tamaño recomendado: 400x400 píxeles</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
