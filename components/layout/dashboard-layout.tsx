"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Laptop,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { getUserImage } from "@/lib/images";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "coordinator" | "teacher" | "student";
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  // Inicializa el tema leyendo de localStorage o usa 'light' por defecto
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = userRole ?? (user?.role as "coordinator" | "teacher" | "student" | undefined);

  // Sincroniza la clase 'dark' en el body y guarda el tema en localStorage
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Efecto para cargar el avatar
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
      { name: "Inicio", href: role ? `/dashboard/${role}` : "/dashboard", icon: Home },
      { name: "Perfil", href: "/profile", icon: Settings },
    ];

    switch (role) {
      case "coordinator":
        return [
          ...baseItems.slice(0, 1),
          { name: "Usuarios", href: "/dashboard/coordinator/users", icon: Users },
          { name: "Estudiantes", href: "/dashboard/coordinator/students", icon: UserCheck },
          { name: "Profesores", href: "/dashboard/coordinator/teachers", icon: GraduationCap },
          { name: "Cursos", href: "/dashboard/coordinator/courses", icon: BookOpen },
          { name: "Listado de PQR", href: "/dashboard/coordinator/schedules", icon: MessageSquare },
          { name: "Reportes", href: "/dashboard/coordinator/reports", icon: BarChart3 },
          ...baseItems.slice(1),
        ];
      case "teacher":
        return [
          ...baseItems.slice(0, 1),
          { name: "Mis Cursos", href: "/dashboard/teacher/courses", icon: BookOpen },
          { name: "Exámenes", href: "/dashboard/teacher/exams", icon: ClipboardList },
          { name: "Mis Lecciones", href: "/dashboard/teacher/lessons", icon: FileText },
          { name: "Estudiantes", href: "/dashboard/teacher/students", icon: Users },
          { name: "PQR", href: "/dashboard/teacher/pqr", icon: MessageSquare },
          ...baseItems.slice(1),
        ];
      case "student":
        return [
          ...baseItems.slice(0, 1),
          { name: "Mis Cursos", href: "/dashboard/student/courses", icon: BookOpen },
          { name: "Exámenes", href: "/dashboard/student/exams", icon: ClipboardList },
          { name: "Mis Lecciones", href: "/dashboard/student/lessons", icon: Calendar },
          { name: "Calificaciones", href: "/dashboard/student/grades", icon: FileText },
          { name: "PQR", href: "/dashboard/student/pqr", icon: MessageSquare },
          ...baseItems.slice(1),
        ];
      default:
        return baseItems;
    }
  }, [role]);

  const getGroupedNavigation = useMemo(() => {
    const general = navigationItems.filter((i) => i.name === "Inicio");
    const gestion = navigationItems.filter((i) =>
      ["Usuarios", "Estudiantes", "Profesores", "Cursos", "Listado de PQR", "Mis Cursos", "Exámenes", "Mis Lecciones", "Estudiantes", "Calificaciones", "PQR"].includes(i.name)
    );
    const reportes = navigationItems.filter((i) => i.name === "Reportes");
    const cuenta = navigationItems.filter((i) => i.name === "Perfil");

    const groups = [];
    if (general.length > 0) groups.push({ label: "General", items: general });
    if (gestion.length > 0) groups.push({ label: "Gestión", items: gestion });
    if (reportes.length > 0) groups.push({ label: "Reportes", items: reportes });
    if (cuenta.length > 0) groups.push({ label: "Cuenta", items: cuenta });

    return groups;
  }, [navigationItems]);

  const navigationGroups = getGroupedNavigation;
  const currentNav = navigationItems.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const pageTitle = currentNav?.name ?? "Panel";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-slate-800">
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center">
              <img src="/ciusa.png" width={64} height={64} alt="logo ciusa" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Centro de Idiomas</span>
          </Link>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 dark:text-gray-400" />
          </Button>
        </div>

        <nav className="mt-4 px-3 flex-1 overflow-y-auto pb-4">
          <div className="space-y-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-4 ${isActive
                          ? "bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-transparent dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-gray-100"
                          }`}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5 dark:text-gray-400" />
              </Button>
              <div className="hidden sm:block">
                <h2 className="mt-1 text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 truncate">{pageTitle}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 dark:bg-slate-800 dark:border-slate-700" align="end" forceMount>
                  <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground dark:text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2 dark:bg-slate-700" />
                  <DropdownMenuItem asChild className="hover:bg-gray-100 cursor-pointer dark:hover:bg-slate-700">
                    <Link href="/profile" className="flex items-center space-x-2 w-full p-2">
                      <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme} className="hover:bg-gray-100 cursor-pointer dark:hover:bg-slate-700">
                    <div className="flex items-center space-x-2 w-full p-2">
                      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span>{theme === "light" ? "Tema: Oscuro" : "Tema: Claro"}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 dark:bg-slate-700" />
                  <DropdownMenuItem onClick={handleSignOut} className="hover:bg-gray-100 cursor-pointer dark:hover:bg-slate-700">
                    <div className="flex items-center space-x-2 w-full p-2">
                      <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>Cerrar sesión</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">{children}</main>
      </div>
    </div>
  );
}