"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  GraduationCap,
  BarChart3,
  UserCheck,
  ClipboardList,
  Search,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: "coordinator" | "teacher" | "student"
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const role = userRole ?? (user?.role as "coordinator" | "teacher" | "student" | undefined)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: "Inicio",
        href: role ? `/dashboard/${role}` : "/dashboard",
        icon: Home,
      },
     // {
      //  name: "Chat IA",
       // href: "/chat",
      //  icon: MessageSquare,
     // },
      {
        name: "Perfil",
        href: "/profile",
        icon: Settings,
      },
    ]

    if (role === "coordinator") {
      return [
        ...baseItems.slice(0, 2),
        {
          name: "Usuarios",
          href: "/dashboard/coordinator/users",
          icon: Users,
        },
        {
          name: "Estudiantes",
          href: "/dashboard/coordinator/students",
          icon: UserCheck,
        },
        {
          name: "Profesores", // Nuevo item para profesores
          href: "/dashboard/coordinator/teachers",
          icon: GraduationCap,
        },
        {
          name: "Cursos",
          href: "/dashboard/coordinator/courses",
          icon: BookOpen,
        },
        {
          name: "Listado de PQR",
          href: "/dashboard/coordinator/schedules",
          icon: MessageSquare,
        },
        {
          name: "Reportes",
          href: "/dashboard/coordinator/reports",
          icon: BarChart3,
        },
        ...baseItems.slice(2),
      ]
    }

    if (role === "teacher") {
      return [
        ...baseItems.slice(0, 2),
        {
          name: "Mis Cursos",
          href: "/dashboard/teacher/courses",
          icon: BookOpen,
        },
        {
          name: "Exámenes",
          href: "/dashboard/teacher/exams",
          icon: ClipboardList,
        },
        {
          name: "Estudiantes",
          href: "/dashboard/teacher/students",
          icon: Users,
        },
        ...baseItems.slice(2),
      ]
    }

    if (role === "student") {
      return [
        ...baseItems.slice(0, 2),
        {
          name: "Mis Cursos",
          href: "/dashboard/student/courses",
          icon: BookOpen,
        },
        {
          name: "Exámenes",
          href: "/dashboard/student/exams",
          icon: ClipboardList,
        },
        {
          name: "Calificaciones",
          href: "/dashboard/student/grades",
          icon: FileText,
        },
        ...baseItems.slice(2),
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  // Agrupación por secciones, según el rol
  const getGroupedNavigation = () => {
    const general = navigationItems.filter((i) => ["Inicio", "Chat IA"].includes(i.name))
    const gestionCoordinator = navigationItems.filter((i) =>
      ["Usuarios", "Estudiantes", "Profesores", "Cursos", "Listado de PQR"].includes(i.name)
    )
    const gestionTeacher = navigationItems.filter((i) =>
      ["Mis Cursos", "Exámenes", "Estudiantes"].includes(i.name)
    )
    const gestionStudent = navigationItems.filter((i) =>
      ["Mis Cursos", "Exámenes", "Calificaciones"].includes(i.name)
    )
    const reportes = navigationItems.filter((i) => ["Reportes"].includes(i.name))
    const cuenta = navigationItems.filter((i) => ["Perfil"].includes(i.name))

    if (role === "coordinator") {
      return [
        { label: "General", items: general },
        { label: "Gestión", items: gestionCoordinator },
        { label: "Reportes", items: reportes },
        { label: "Cuenta", items: cuenta },
      ]
    }
    if (role === "teacher") {
      return [
        { label: "General", items: general },
        { label: "Gestión", items: gestionTeacher },
        { label: "Cuenta", items: cuenta },
      ]
    }
    if (role === "student") {
      return [
        { label: "General", items: general },
        { label: "Gestión", items: gestionStudent },
        { label: "Cuenta", items: cuenta },
      ]
    }
    // Sin rol
    return [{ label: "General", items: navigationItems }]
  }

  const navigationGroups = getGroupedNavigation()

  // Page title y breadcrumb dinámico
  const currentNav = navigationItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
  const pageTitle = currentNav?.name ?? "Panel"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } h-screen flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <img src="/ciusa.png" width={64} height={64} alt="logo ciusa" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Centro de Idiomas</span>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto pb-24">
          <div className="space-y-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-4 ${
                          isActive
                            ? "bg-blue-50 text-blue-700 border-blue-600"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-transparent"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 ">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:block">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={role ? `/dashboard/${role}` : "/dashboard"}>Inicio</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h2 className="mt-1 text-lg font-semibold leading-tight text-gray-900 truncate">{pageTitle}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden md:flex items-center gap-2 w-72">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar en el panel..."
                    className="pl-8"
                  />
                </div>
              </div>
              {/* Perfil / menú */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}