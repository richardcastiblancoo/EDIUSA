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
  Bot, // Usaremos el icono de Bot (o MessageSquare) para el asistente IA
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { getUserImage } from "@/lib/images";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// --- Nuevos Tipos para la Navegación por Categorías ---
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  isBeta?: boolean; // Nueva propiedad para la etiqueta Beta
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

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

  // 1. Aplica y guarda el tema
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 2. Limpieza al desmontar (SOLUCIÓN para el modo oscuro persistente)
  useEffect(() => {
    // Esta función de limpieza se ejecuta cuando el componente se desmonta (ej. al hacer log out)
    return () => {
        // Asegura que al salir del layout, el body vuelve a 'light'
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    };
  }, []);

  useEffect(() => {
    const loadUserAvatar = async () => {
      if (user?.id) {
        const imageUrl = await getUserImage(user.id, "avatar");
        setAvatarUrl(imageUrl);
      }
    };
    loadUserAvatar();
  }, [user?.id]);

  // 3. Resetear el localStorage en handleSignOut (SOLUCIÓN para el modo oscuro persistente)
  const handleSignOut = async () => {
    // Asegura que la próxima vez que se cargue la página de login (o cualquier otra),
    // el tema por defecto sea 'light'
    localStorage.setItem("theme", "light");
    
    await signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // --- Navegación Agrupada por Secciones (useMemo modificado) ---
  const navigationSections: NavigationSection[] = useMemo(() => {
    // Items base para todos los roles
    const baseItems: NavigationItem[] = [
      {
        name: "Dashboard",
        href: role ? `/dashboard/${role}` : "/dashboard",
        icon: Home,
      },
      { name: "Perfil", href: "/profile", icon: User },
      // Nuevo elemento de IA con etiqueta Beta
      { 
        name: "Asistente IA", 
        href: "/dashboard/ai-assistant",
        icon: Bot,
        isBeta: true,
      },
    ];
    
    // Dividir los items base para las secciones
    const dashboardItem = baseItems[0];
    const profileItem = baseItems[1];
    const aiAssistantItem = baseItems[2];


    switch (role) {
      case "coordinator":
        return [
          {
            title: "General",
            items: [dashboardItem, aiAssistantItem],
          },
          {
            title: "Administración",
            items: [
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
            ],
          },
          {
            title: "Reportes y Soporte",
            items: [
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
              profileItem,
            ],
          },
        ];
      case "teacher":
        return [
          {
            title: "General",
            items: [dashboardItem, aiAssistantItem],
          },
          {
            title: "Académico",
            items: [
              {
                name: "Mis Cursos",
                href: "/dashboard/teacher/courses",
                icon: BookOpen,
              },
            ],
          },
          {
            title: "Gestión de Contenido",
            items: [
              { name: "PQR", href: "/dashboard/teacher/pqr", icon: MessageSquare },
              profileItem,
            ],
          },
        ];
      case "student":
        return [
          {
            title: "General",
            items: [dashboardItem, aiAssistantItem],
          },
          {
            title: "Mi Progreso",
            items: [
              {
                name: "Mis Cursos",
                href: "/dashboard/student/courses",
                icon: BookOpen,
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
            ],
          },
          {
            title: "Evaluación y Soporte",
            items: [
              {
                name: "Exámenes",
                href: "/dashboard/student/exams",
                icon: ClipboardList,
              },
              { name: "PQR", href: "/dashboard/student/pqr", icon: MessageSquare },
              profileItem,
            ],
          },
        ];
      default:
        // Caso por defecto: solo dashboard, perfil, y IA.
        return [{ title: "General", items: baseItems }];
    }
  }, [role]);

  // Aplanar la navegación para el cálculo del título de la página
  const navigationItems = navigationSections.flatMap((section) => section.items);

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
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ease-in-out
        ${sidebarCollapsed ? "w-20" : "w-64"} 
        bg-white dark:bg-slate-900 shadow-xl border-r border-gray-200 dark:border-slate-800 
        transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo + toggle - MODIFICADO AQUÍ */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-slate-800 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center space-x-3 transition-opacity duration-300">
              {/* Logo más grande */}
              <img
                src="/ciusa.png" 
                width={70}
                height={70}
                alt="logo ediusa"
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                EDIUSA
              </span>
            </Link>
          )}
          
          {/* El logo pequeño fue ELIMINADO para ocultarlo totalmente cuando está colapsado */}
          
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-slate-800"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed
                ? "Expandir barra lateral"
                : "Colapsar barra lateral"
            }
          >
            <ChevronLeft 
                className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                    sidebarCollapsed ? "rotate-180" : "rotate-0"
                }`} 
            />
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

        {/* Navigation - CON SECCIONES Y EFECTOS */}
        <nav className="mt-4 px-2 flex-1 overflow-y-auto custom-scrollbar">
          {navigationSections.map((section, index) => (
            <div key={section.title} className="mb-4">
              {/* Título de la sección solo cuando NO está colapsado */}
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 transition-opacity duration-300">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center ${
                          sidebarCollapsed ? "justify-center" : "px-3"
                        } py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                          ${
                            isActive
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800/70"
                          }
                          ${sidebarCollapsed ? "w-full" : "w-auto"}`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        {/* Icono con efecto de escala al pasar el cursor (solo si no está activo) */}
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-transform duration-200 
                            ${!sidebarCollapsed ? "mr-3" : ""}`}
                            style={item.isBeta ? { color: '#8b5cf6' } : {}} // Color morado para el icono IA
                        />
                        {/* Texto con animación de opacidad */}
                        {!sidebarCollapsed && (
                            <span className={`transition-opacity duration-300 flex items-center justify-between w-full`}>
                              <span>{item.name}</span>
                              {/* Etiqueta BETA */}
                              {item.isBeta && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500 text-white dark:bg-purple-700/70 dark:text-purple-300 border border-purple-600/50 shadow-sm animate-pulse-slow">
                                  BETA
                                </span>
                              )}
                            </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Perfil abajo con animaciones */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:shadow-md
                ${sidebarCollapsed ? "justify-center" : "justify-start"}`}
              >
                <Avatar className="h-9 w-9 ring-2 ring-blue-400 dark:ring-blue-600 transition-all duration-300">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col overflow-hidden text-left transition-opacity duration-300">
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

            {/* El Popover usa animaciones internas de Shadcn/Radix */}
            <PopoverContent
              align="start"
              side="top"
              className="w-72 p-4 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-800"
            >
              {/* Contenido del popover sin cambios */}
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
                  className="w-full justify-start transition-transform duration-150 hover:scale-[1.02]"
                  asChild
                >
                  <Link href="/profile">
                    <Settings className="w-4 h-4 mr-2" /> Configuración
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start transition-transform duration-150 hover:scale-[1.02]"
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
                  className="w-full justify-start transition-transform duration-150 hover:scale-[1.02]"
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
        className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Top bar (Sticky) */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-md border-b border-gray-200 dark:border-slate-800">
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
              <h2 className="hidden sm:block mt-1 text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 truncate">
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