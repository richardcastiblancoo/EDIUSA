"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Users, GraduationCap, BookOpen, Loader2 } from "lucide-react"
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/auth"
import type { User } from "@/lib/supabase"

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "coordinator" | "teacher" | "student",
    phone: "",
    document_number: "",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const userData = await getAllUsers()
    setUsers(userData)
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "student",
      phone: "",
      document_number: "",
    })
    setEditingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      if (editingUser) {
        // Update existing user
        const updated = await updateUser(editingUser.id, formData)
        if (updated) {
          setMessage({ type: "success", text: "Usuario actualizado exitosamente" })
          loadUsers()
        } else {
          setMessage({ type: "error", text: "Error al actualizar usuario" })
        }
      } else {
        // Create new user
        const newUser = await createUser(formData)
        if (newUser) {
          setMessage({ type: "success", text: "Usuario creado exitosamente" })
          loadUsers()
        } else {
          setMessage({ type: "error", text: "Error al crear usuario. Verifique que el email no esté en uso." })
        }
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      setMessage({ type: "error", text: "Error inesperado" })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      phone: user.phone || "",
      document_number: user.document_number || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      const success = await deleteUser(user.id)
      if (success) {
        setMessage({ type: "success", text: "Usuario eliminado exitosamente" })
        loadUsers()
      } else {
        setMessage({ type: "error", text: "Error al eliminar usuario" })
      }
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      coordinator: "default",
      teacher: "secondary",
      student: "outline",
    } as const

    const labels = {
      coordinator: "Coordinador",
      teacher: "Profesor",
      student: "Estudiante",
    }

    return <Badge variant={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>
  }

  const filterUsersByRole = (role: string) => {
    return users.filter((user) => user.role === role)
  }

  const UserTable = ({ users: filteredUsers }: { users: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone || "N/A"}</TableCell>
            <TableCell>{user.document_number || "N/A"}</TableCell>
            <TableCell>{getRoleBadge(user.role)}</TableCell>
            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra profesores y estudiantes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Completa los datos para crear un nuevo usuario"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Estudiante</SelectItem>
                      <SelectItem value="teacher">Profesor</SelectItem>
                      <SelectItem value="coordinator">Coordinador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? "Actualizar" : "Crear Usuario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coordinadores</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterUsersByRole("coordinator").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profesores</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterUsersByRole("teacher").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filterUsersByRole("student").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Tables */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
          <TabsTrigger value="coordinators">Coordinadores ({filterUsersByRole("coordinator").length})</TabsTrigger>
          <TabsTrigger value="teachers">Profesores ({filterUsersByRole("teacher").length})</TabsTrigger>
          <TabsTrigger value="students">Estudiantes ({filterUsersByRole("student").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Usuarios</CardTitle>
              <CardDescription>Lista completa de usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={users} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators">
          <Card>
            <CardHeader>
              <CardTitle>Coordinadores</CardTitle>
              <CardDescription>Usuarios con rol de coordinador</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={filterUsersByRole("coordinator")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Profesores</CardTitle>
              <CardDescription>Usuarios con rol de profesor</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={filterUsersByRole("teacher")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes</CardTitle>
              <CardDescription>Usuarios con rol de estudiante</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable users={filterUsersByRole("student")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
