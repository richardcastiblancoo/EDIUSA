"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  GraduationCap,
  BarChart3,
  UserCheck,
  ClipboardList,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { getUserImage } from "@/lib/images";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "coordinator" | "teacher" | "student";
}

export default function DashboardLayout({
  children,
  userRole,
}: DashboardLayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("theme") as "light" | "dark") || "light"
      );
    }
    return "light";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role =
    userRole ??
    (user?.role as "coordinator" | "teacher" | "student" | undefined);

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user?.id) {
        const imageUrl = await getUserImage(user.id, "avatar");
        setAvatarUrl(imageUrl);
      }
    };
    loadUserAvatar();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const navigationItems = useMemo(() => {
    const baseItems = [
      {
        name: "Dashboard",
        href: role ? `/dashboard/${role}` : "/dashboard",
        icon: Home,
      },
      { name: "Perfil", href: "/profile", icon: User },
    ];

    switch (role) {
      case "coordinator":
        return [
          ...baseItems.slice(0, 1),
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
            name: "Profesores",
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
          ...baseItems.slice(1),
        ];
      case "teacher":
        return [
          ...baseItems.slice(0, 1),
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
            name: "Mis Lecciones",
            href: "/dashboard/teacher/lessons",
            icon: FileText,
          },
          {
            name: "Estudiantes",
            href: "/dashboard/teacher/students",
            icon: Users,
          },
          { name: "PQR", href: "/dashboard/teacher/pqr", icon: MessageSquare },
          ...baseItems.slice(1),
        ];
      case "student":
        return [
          ...baseItems.slice(0, 1),
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
            name: "Mis Lecciones",
            href: "/dashboard/student/lessons",
            icon: Calendar,
          },
          {
            name: "Calificaciones",
            href: "/dashboard/student/grades",
            icon: FileText,
          },
          { name: "PQR", href: "/dashboard/student/pqr", icon: MessageSquare },
          ...baseItems.slice(1),
        ];
      default:
        return baseItems;
    }
  }, [role]);

  const currentNav = navigationItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );
  const pageTitle = currentNav?.name ?? "Panel";

  const roleLabel =
    role === "coordinator"
      ? "Coordinador"
      : role === "teacher"
      ? "Profesor"
      : role === "student"
      ? "Estudiante"
      : "Usuario";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 
        ${sidebarCollapsed ? "w-20" : "w-64"} 
        bg-white dark:bg-slate-900 shadow-lg border-r border-gray-200 dark:border-slate-800 
        transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-slate-800">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center space-x-3">
              {/* Logo más grande */}
              <img
                src="/ciusa.png"
                width={70}
                height={70}
                alt="logo ciusa"
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                CIUSA
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-4
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-transparent dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-gray-100"
                      }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Perfil abajo estilo Discord (flotante con Popover) */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user?.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {roleLabel}
                    </span>
                  </div>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              side="top"
              className="w-72 p-4 rounded-xl bg-white dark:bg-slate-900 shadow-xl"
            >
              {/* Header usuario */}
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/profile">
                    <Settings className="w-4 h-4 mr-2" /> Configuración
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4 mr-2" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2" />
                  )}
                  {theme === "light" ? "Tema oscuro" : "Tema claro"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-500" />
              </Button>
              <h2 className="hidden sm:block mt-1 text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 truncate">
                {pageTitle}
              </h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
