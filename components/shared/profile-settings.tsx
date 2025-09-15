"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Loader2, Save, Eye, EyeOff } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)

  const [accountActivity, setAccountActivity] = useState({
    lastLogin: "Cargando...",
    device: "Cargando...",
  })

  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    document_number: (user as any).document_number || "",
  })

  const [settingsForm, setSettingsForm] = useState({
    email_notifications: true,
    push_notifications: true,
    exam_reminders: true,
    grade_notifications: true,
  })

  useEffect(() => {
    loadUserAvatar()
    loadAccountActivity()
  }, [user.id])

  const loadUserAvatar = async () => {
    const imageUrl = await getUserImage(user.id, "avatar")
    if (imageUrl) setAvatarUrl(imageUrl)
  }

  const loadAccountActivity = () => {
    const now = new Date()
    const lastLoginTime = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    const lastLoginDate = now.toLocaleDateString("es-CO", { day: "2-digit", month: "long" })
    const userAgent = navigator.userAgent
    let device = "Unknown"
    if (/Android/i.test(userAgent)) device = "Android"
    else if (/iPhone|iPad|iPod/i.test(userAgent)) device = "iOS"
    else if (/Windows/i.test(userAgent)) device = "Windows"
    else if (/Macintosh|MacIntel/i.test(userAgent)) device = "macOS"

    setAccountActivity({
      lastLogin: `${lastLoginDate}, ${lastLoginTime}`,
      device: `${navigator.platform} (${device})`,
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const updatedUser = await updateUserApi(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        document_number: profileForm.document_number || "",
      })

      if (updatedUser) {
        setMessage({ type: "success", text: "Perfil actualizado exitosamente" })
        onUserUpdate(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        updateAuthUser({ name: updatedUser.name, phone: updatedUser.phone } as Partial<UserType>)
      } else {
        setMessage({ type: "error", text: "Error al actualizar perfil" })
      }
    } catch {
      setMessage({ type: "error", text: "Error inesperado" })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpdate = async (imageUrl: string | null) => {
    try {
      setLoading(true)
      setAvatarUrl(imageUrl || "")
      const updatedUserData = { ...user, avatar_url: imageUrl || "" }
      onUserUpdate(updatedUserData)
      localStorage.setItem("user", JSON.stringify(updatedUserData))
      updateAuthUser({ avatar_url: imageUrl || "" })
      setMessage({
        type: "success",
        text: imageUrl ? "Foto de perfil actualizada" : "Foto de perfil eliminada",
      })
    } catch {
      setMessage({ type: "error", text: "Error al actualizar la foto de perfil" })
    } finally {
      setLoading(false)
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="photo">Foto</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" value={profileForm.email} disabled className="bg-gray-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                  <div>
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

        {/* Foto */}
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

        {/* Seguridad */}
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
              <div>
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <div className="relative">
                  <Input id="current_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input id="new_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input id="confirm_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Último inicio de sesión:</span>
                  <span className="text-muted-foreground">{accountActivity.lastLogin}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dispositivo:</span>
                  <span className="text-muted-foreground">{accountActivity.device}</span>
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
