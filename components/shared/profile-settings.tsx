"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Palette, Loader2, Save, Eye, EyeOff } from "lucide-react"
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
  const [currentLanguage, setCurrentLanguage] = useState("es")

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
    theme: "light",
  })

  useEffect(() => {
    loadUserAvatar()
    loadAccountActivity()
  }, [user.id])

  const loadUserAvatar = async () => {
    const imageUrl = await getUserImage(user.id, "avatar")
    if (imageUrl) {
      setAvatarUrl(imageUrl)
    }
  }

  const loadAccountActivity = () => {
    const now = new Date()
    const lastLoginTime = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    const lastLoginDate = now.toLocaleDateString("es-CO", { day: "2-digit", month: "long" })
    const lastLoginFormatted = `${lastLoginDate}, ${lastLoginTime}`

    const userAgent = navigator.userAgent
    let device = "Unknown"
    if (/Android/i.test(userAgent)) {
      device = "Android"
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      device = "iOS"
    } else if (/Windows/i.test(userAgent)) {
      device = "Windows"
    } else if (/Macintosh|MacIntel/i.test(userAgent)) {
      device = "macOS"
    }

    setAccountActivity({
      lastLogin: lastLoginFormatted,
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
        document_number: profileForm.document_number || "" as unknown as string,
      })

      if (updatedUser) {
        setMessage({ type: "success", text: currentLanguage === "es" ? "Perfil actualizado exitosamente" : "Profile updated successfully" })
        onUserUpdate(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        updateAuthUser({ name: updatedUser.name, phone: updatedUser.phone } as Partial<UserType>)
      } else {
        setMessage({ type: "error", text: currentLanguage === "es" ? "Error al actualizar perfil" : "Error updating profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: currentLanguage === "es" ? "Error inesperado" : "Unexpected error" })
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
        updateAuthUser({ avatar: updated.avatar })
        setMessage({
          type: "success",
          text: imageUrl ? (currentLanguage === "es" ? "Foto de perfil actualizada" : "Profile picture updated") : (currentLanguage === "es" ? "Foto de perfil eliminada" : "Profile picture removed"),
        })
      } else {
        setMessage({ type: "error", text: currentLanguage === "es" ? "No se pudo actualizar la foto de perfil" : "Failed to update profile picture" })
      }
    } catch {
      setMessage({ type: "error", text: currentLanguage === "es" ? "Error al actualizar la foto de perfil" : "Error updating profile picture" })
    } finally {
      setLoading(false)
    }
  }

  const getRoleSpecificFields = () => {
    if (currentLanguage === "es") {
      switch (user.role) {
        case "student":
          return (
            <>
              <div className="space-y-2">
                <Label htmlFor="student_id">Código Estudiantil</Label>
                <Input
                  id="student_id"
                  placeholder="2024001234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_level">Nivel Académico</Label>
                <Select>
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
                  placeholder="Nombre y teléfono"
                />
              </div>
            </>
          )
        default:
          return null
      }
    } else {
      switch (user.role) {
        case "student":
          return (
            <>
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  placeholder="2024001234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_level">Academic Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your academic level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  placeholder="Name and phone"
                />
              </div>
            </>
          )
        default:
          return null
      }
    }
  }

  const getRoleSpecificSettings = () => {
    if (currentLanguage === "es") {
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
    } else {
      switch (user.role) {
        case "coordinator":
          return (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive system alerts and reports</p>
                </div>
                <Switch
                  checked={settingsForm.push_notifications}
                  onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, push_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly reports by email</p>
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
                  <Label>Exam Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alerts when students complete exams</p>
                </div>
                <Switch
                  checked={settingsForm.exam_reminders}
                  onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, exam_reminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Class Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders 30 minutes before each class</p>
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
                  <Label>Exam Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders 24h and 1h before exams</p>
                </div>
                <Switch
                  checked={settingsForm.exam_reminders}
                  onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, exam_reminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Grade Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alerts when new grades are published</p>
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
  }

  const handleLanguageToggle = () => {
    setCurrentLanguage(currentLanguage === "es" ? "en" : "es")
  }

  const translations = {
    es: {
      profileAndSettings: "Perfil y Configuración",
      manageInfo: "Gestiona tu información personal y preferencias",
      profile: "Perfil",
      photo: "Foto",
      settings: "Configuración",
      security: "Seguridad",
      personalInfo: "Información Personal",
      updateInfo: "Actualiza tu información personal y profesional",
      fullName: "Nombre Completo",
      email: "Correo Electrónico",
      emailNote: "El email no se puede modificar",
      phone: "Teléfono",
      documentNumber: "Número de Documento",
      saveChanges: "Guardar Cambios",
      profilePicture: "Foto de Perfil",
      uploadPhoto: "Sube o cambia tu foto de perfil",
      notifications: "Notificaciones",
      configureNotifications: "Configura cómo y cuándo recibir notificaciones",
      emailNotifications: "Notificaciones por Email",
      receiveEmailNotifications: "Recibir notificaciones importantes por correo",
      appearance: "Apariencia",
      customizeAppearance: "Personaliza la apariencia de la aplicación",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      language: "Idioma",
      security: "Seguridad",
      manageSecurity: "Gestiona la seguridad de tu cuenta",
      currentPassword: "Contraseña Actual",
      newPassword: "Nueva Contraseña",
      confirmPassword: "Confirmar Nueva Contraseña",
      accountActivity: "Actividad de la Cuenta",
      lastLogin: "Último inicio de sesión:",
      device: "Dispositivo:",
      changePassword: "Cambiar Contraseña",
    },
    en: {
      profileAndSettings: "Profile and Settings",
      manageInfo: "Manage your personal information and preferences",
      profile: "Profile",
      photo: "Photo",
      settings: "Settings",
      security: "Security",
      personalInfo: "Personal Information",
      updateInfo: "Update your personal and professional information",
      fullName: "Full Name",
      email: "Email Address",
      emailNote: "Email cannot be changed",
      phone: "Phone",
      documentNumber: "Document Number",
      saveChanges: "Save Changes",
      profilePicture: "Profile Picture",
      uploadPhoto: "Upload or change your profile picture",
      notifications: "Notifications",
      configureNotifications: "Configure how and when to receive notifications",
      emailNotifications: "Email Notifications",
      receiveEmailNotifications: "Receive important notifications by email",
      appearance: "Appearance",
      customizeAppearance: "Personalize the application's appearance",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      language: "Language",
      security: "Security",
      manageSecurity: "Manage your account security",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      accountActivity: "Account Activity",
      lastLogin: "Last login:",
      device: "Device:",
      changePassword: "Change Password",
    },
  }

  const t = translations[currentLanguage as keyof typeof translations]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t.profileAndSettings}</h2>
        <p className="text-muted-foreground">{t.manageInfo}</p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">{t.profile}</TabsTrigger>
          <TabsTrigger value="photo">{t.photo}</TabsTrigger>
          <TabsTrigger value="settings">{t.settings}</TabsTrigger>
          <TabsTrigger value="security">{t.security}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.personalInfo}
              </CardTitle>
              <CardDescription>{t.updateInfo}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.fullName}</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input id="email" value={profileForm.email} disabled className="bg-gray-50" />
                    <p className="text-xs text-muted-foreground">{t.emailNote}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.phone}</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+57 300 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document">{t.documentNumber}</Label>
                    <Input
                      id="document"
                      value={profileForm.document_number}
                      onChange={(e) => setProfileForm({ ...profileForm, document_number: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                </div>

                {getRoleSpecificFields()}

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {t.saveChanges}
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
              title={t.profilePicture}
              description={t.uploadPhoto}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t.notifications}
                </CardTitle>
                <CardDescription>{t.configureNotifications}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.emailNotifications}</Label>
                    <p className="text-sm text-muted-foreground">{t.receiveEmailNotifications}</p>
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
                  {t.appearance}
                </CardTitle>
                <CardDescription>{t.customizeAppearance}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">{t.theme}</Label>
                    <Select
                      value={settingsForm.theme}
                      onValueChange={(value) => setSettingsForm({ ...settingsForm, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t.light}</SelectItem>
                        <SelectItem value="dark">{t.dark}</SelectItem>
                        <SelectItem value="system">{t.system}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">{t.language}</Label>
                    <Button onClick={handleLanguageToggle} className="w-full">
                      {currentLanguage === "es" ? "English" : "Español"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t.saveChanges}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t.security}
              </CardTitle>
              <CardDescription>{t.manageSecurity}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">{t.currentPassword}</Label>
                <div className="relative">
                  <Input id="current_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">{t.newPassword}</Label>
                <div className="relative">
                  <Input id="new_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">{t.confirmPassword}</Label>
                <div className="relative">
                  <Input id="confirm_password" type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">{t.accountActivity}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t.lastLogin}</span>
                    <span className="text-muted-foreground">{accountActivity.lastLogin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.device}</span>
                    <span className="text-muted-foreground">{accountActivity.device}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  {t.changePassword}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}