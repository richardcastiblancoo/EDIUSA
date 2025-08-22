"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Palette, Loader2, Save } from "lucide-react"
import ImageUpload from "@/components/shared/image-upload"
import { updateUser as updateUserApi } from "@/lib/auth"
import { getUserImage } from "@/lib/images"
import { useAuth } from "@/lib/auth-context"
import type { User as UserType } from "@/lib/supabase"

interface ProfileSettingsProps {
  user: UserType
  onUserUpdate: (user: UserType) => void
}

export default function ProfileSettings({ user, onUserUpdate }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const { updateUser: updateAuthUser } = useAuth()

  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    document_number: (user as any).document_number || "",
    // Campos eliminados
  })

  const [settingsForm, setSettingsForm] = useState({
    email_notifications: true,
    push_notifications: true,
    exam_reminders: true,
    grade_notifications: true,
    theme: "light",
    language: "es",
    timezone: "America/Bogota",
  })

  useEffect(() => {
    loadUserAvatar()
  }, [user.id])

  const loadUserAvatar = async () => {
    const imageUrl = await getUserImage(user.id, "avatar")
    if (imageUrl) {
      setAvatarUrl(imageUrl)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const updatedUser = await updateUserApi(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        document_number: profileForm.document_number || "" as unknown as string,
      })

      if (updatedUser) {
        setMessage({ type: "success", text: "Perfil actualizado exitosamente" })
        onUserUpdate(updatedUser)
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser))
        // Sincronizar con el contexto de auth
        updateAuthUser({ name: updatedUser.name, phone: updatedUser.phone } as Partial<UserType>)
      } else {
        setMessage({ type: "error", text: "Error al actualizar perfil" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error inesperado" })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpdate = async (imageUrl: string | null) => {
    try {
      setLoading(true)
      const updated = await updateUserApi(user.id, { avatar: imageUrl ?? "" })
      if (updated) {
        setAvatarUrl(imageUrl || "")
        onUserUpdate(updated)
        localStorage.setItem("user", JSON.stringify(updated))
        // Sincronizar avatar en el contexto de auth para reflejarse en el topbar
        updateAuthUser({ avatar: updated.avatar })
        setMessage({ type: "success", text: imageUrl ? "Foto de perfil actualizada" : "Foto de perfil eliminada" })
      } else {
        setMessage({ type: "error", text: "No se pudo actualizar la foto de perfil" })
      }
    } catch {
      setMessage({ type: "error", text: "Error al actualizar la foto de perfil" })
    } finally {
      setLoading(false)
    }
  }

  const getRoleSpecificFields = () => {
    switch (user.role) {
      case "student":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="student_id">Código Estudiantil</Label>
              <Input
                id="student_id"
                value={profileForm.student_id}
                onChange={(e) => setProfileForm({ ...profileForm, student_id: e.target.value })}
                placeholder="2024001234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_level">Nivel Académico</Label>
              <Select
                value={profileForm.academic_level}
                onValueChange={(value) => setProfileForm({ ...profileForm, academic_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu nivel académico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pregrado">Pregrado</SelectItem>
                  <SelectItem value="posgrado">Posgrado</SelectItem>
                  <SelectItem value="maestria">Maestría</SelectItem>
                  <SelectItem value="doctorado">Doctorado</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Contacto de Emergencia</Label>
              <Input
                id="emergency_contact"
                value={profileForm.emergency_contact}
                onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                placeholder="Nombre y teléfono"
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getRoleSpecificSettings = () => {
    switch (user.role) {
      case "coordinator":
        return (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones de Sistema</Label>
                <p className="text-sm text-muted-foreground">Recibir alertas del sistema y reportes</p>
              </div>
              <Switch
                checked={settingsForm.push_notifications}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, push_notifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reportes Automáticos</Label>
                <p className="text-sm text-muted-foreground">Recibir reportes semanales por email</p>
              </div>
              <Switch
                checked={settingsForm.grade_notifications}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, grade_notifications: checked })}
              />
            </div>
          </>
        )

      case "teacher":
        return (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones de Exámenes</Label>
                <p className="text-sm text-muted-foreground">Alertas cuando estudiantes completen exámenes</p>
              </div>
              <Switch
                checked={settingsForm.exam_reminders}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, exam_reminders: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Clases</Label>
                <p className="text-sm text-muted-foreground">Recordatorios 30 minutos antes de cada clase</p>
              </div>
              <Switch
                checked={settingsForm.push_notifications}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, push_notifications: checked })}
              />
            </div>
          </>
        )

      case "student":
        return (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Exámenes</Label>
                <p className="text-sm text-muted-foreground">Recordatorios 24h y 1h antes de exámenes</p>
              </div>
              <Switch
                checked={settingsForm.exam_reminders}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, exam_reminders: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones de Calificaciones</Label>
                <p className="text-sm text-muted-foreground">Alertas cuando se publiquen nuevas calificaciones</p>
              </div>
              <Switch
                checked={settingsForm.grade_notifications}
                onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, grade_notifications: checked })}
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Perfil y Configuración</h2>
        <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="photo">Foto</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Actualiza tu información personal y profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" value={profileForm.email} disabled className="bg-gray-50" />
                    <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document">Número de Documento</Label>
                    <Input
                      id="document"
                      value={profileForm.document_number}
                      onChange={(e) => setProfileForm({ ...profileForm, document_number: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                </div>

               

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photo">
          <div className="max-w-md">
            <ImageUpload
              userId={user.id}
              imageType="avatar"
              currentImageUrl={avatarUrl}
              onImageUpdate={handleAvatarUpdate}
              title="Foto de Perfil"
              description="Sube o cambia tu foto de perfil"
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>Configura cómo y cuándo recibir notificaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones importantes por correo</p>
                  </div>
                  <Switch
                    checked={settingsForm.email_notifications}
                    onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, email_notifications: checked })}
                  />
                </div>

                {getRoleSpecificSettings()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apariencia
                </CardTitle>
                <CardDescription>Personaliza la apariencia de la aplicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={settingsForm.theme}
                      onValueChange={(value) => setSettingsForm({ ...settingsForm, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={settingsForm.language}
                      onValueChange={(value) => setSettingsForm({ ...settingsForm, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={settingsForm.timezone}
                    onValueChange={(value) => setSettingsForm({ ...settingsForm, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <Input id="current_password" type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input id="new_password" type="password" placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input id="confirm_password" type="password" placeholder="••••••••" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Actividad de la Cuenta</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Último inicio de sesión:</span>
                    <span className="text-muted-foreground">Hoy, 10:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispositivo:</span>
                    <span className="text-muted-foreground">Chrome en Windows</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ubicación:</span>
                    <span className="text-muted-foreground">Bogotá, Colombia</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}