"use client";

// Importa los módulos y componentes necesarios.
import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  GraduationCap,
  Globe,
  Users,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginForm() {
  // Estados para manejar los datos del formulario y la UI.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Estado para la casilla de "Recordarme".
  const [rememberMe, setRememberMe] = useState(false); 

  const { signIn } = useAuth();
  const router = useRouter();

  /**
   * Hook de efecto para cargar el correo electrónico si fue guardado previamente.
   * Se ejecuta solo una vez al montar el componente.
   */
  useEffect(() => {
    // Intenta obtener el correo guardado en el almacenamiento local del navegador.
    const storedEmail = localStorage.getItem('rememberedEmail');
    if (storedEmail) {
      // Si existe un correo guardado, actualiza el estado 'email' y marca la casilla.
      setEmail(storedEmail);
      setRememberMe(true);
    }
  }, []);

  /**
   * Manejador del envío del formulario.
   * Realiza la autenticación y gestiona el estado de "Recordarme".
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Guarda o elimina el correo electrónico en el almacenamiento local según la elección del usuario.
    if (rememberMe) {
      // Si la casilla está marcada, guarda el correo.
      localStorage.setItem('rememberedEmail', email);
    } else {
      // Si no, elimina cualquier correo guardado anteriormente.
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        // La redirección es manejada por el contexto de autenticación o el componente padre.
      } else {
        setError(
          result.error ||
          "Credenciales inválidas. Por favor, verifica tu email y contraseña."
        );
      }
    } catch (error) {
      setError("Error al iniciar sesión. Por favor, intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Sección del encabezado del sitio */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
<<<<<<< HEAD
              <img src="ciusa.png" width={100} alt="" />

=======
              <img src="ciusa.png" width={100} alt="Logo CIUSA" />
>>>>>>> supabase
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Centro de Idiomas
                </h1>
                <p className="text-sm text-gray-600">
                  Universidad Sergio Arboleda
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Sección izquierda - Información de la plataforma */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bienvenido al Centro de Idiomas
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Plataforma integral para la gestión académica y administrativa
                del Centro de Idiomas de la Universidad Sergio Arboleda.
              </p>
            </div>

            {/* Lista de características */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-gray-700">
                  Gestión de estudiantes y profesores
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-gray-700">
                  Administración de cursos y exámenes
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-gray-700">
                  Seguimiento académico integral
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección derecha - Formulario de inicio de sesión */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-white lg:bg-gray-50">
          <div className="max-w-md w-full">
            <Card className="shadow-xl border-0">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-center">
                  Ingresa tus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Atributo 'autoComplete' en el formulario para habilitar la función del navegador */}
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu.email@usa.edu.co"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        // Atributo 'autoComplete' para el nombre de usuario
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                        // Atributo 'autoComplete' para la contraseña actual
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Casilla de "Recordarme" */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Recordarme
                      </label>
                    </div>
<<<<<<< HEAD
                   
=======
>>>>>>> supabase
                  </div>

                  {/* Botón de envío del formulario */}
                  <Button
                    type="submit"
                    className="w-full py-3 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>

                  {/* Mensaje de error si la autenticación falla */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}