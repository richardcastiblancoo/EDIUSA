"use client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000);

    const storedEmail = localStorage.getItem("rememberedEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
    }

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormIsLoading(true);
    setError("");

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Redirection handled elsewhere
      } else {
        setError(
          result.error ||
            "Credenciales inválidas. Por favor, verifica tu email y contraseña."
        );
      }
    } catch (error) {
      setError("Error al iniciar sesión. Por favor, intenta nuevamente.");
    } finally {
      setFormIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="flex flex-col items-center animate-pulse">
          <img src="/ciusa.png" alt="Logo CIUSA" width={150} />
          <p className="mt-4 text-2xl font-semibold text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    // Fondo animado: Se usa un div absoluto para el gradiente
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-50">
      <div className="absolute inset-0 z-0 opacity-30 bg-gradient-to-r from-blue-100 via-white to-purple-100 bg-[length:400%_400%] animate-animated-gradient"></div>

      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-2">
              <img src="/ciusa.png" width={80} alt="Logo CIUSA" />
              <div>
                {/* Título animado */}
                <h1 className="text-2xl font-bold text-gray-900 animate-fade-in-up">
                  Centro de Idiomas
                </h1>
                {/* Subtítulo animado con retraso */}
                <p className="text-base text-gray-600 animate-fade-in-up delay-150">
                  Universidad Sergio Arboleda
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden relative z-10">
        <div className="lg:w-1/2 flex items-center justify-center py-4 lg:p-8">
          <div className="max-w-md w-full space-y-6 px-4 lg:px-0">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido al Centro de Idiomas
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Plataforma integral para la gestión académica y administrativa
                del Centro de Idiomas de la Universidad Sergio Arboleda.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-base text-gray-700">
                  Gestión de estudiantes y profesores
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-base text-gray-700">
                  Administración de cursos y exámenes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-base text-gray-700">
                  Seguimiento académico integral
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 flex items-center justify-center py-4 lg:p-8 overflow-hidden relative">
          <div className="max-w-md w-full">
            <Card className="shadow-2xl border-0">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-3xl font-bold text-center">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Ingresa tus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  autoComplete="on"
                >
                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-base font-medium text-gray-700"
                    >
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu.email@usa.edu.co"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="password"
                      className="text-base font-medium text-gray-700"
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
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
                        className="ml-2 block text-base text-gray-900"
                      >
                        Recordarme
                      </label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-3 text-xl font-semibold"
                    disabled={formIsLoading}
                  >
                    {formIsLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
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