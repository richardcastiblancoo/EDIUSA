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
  Globe,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Componente de Estilos Globales para la animación tipo película
// NOTA: Estas keyframes deben estar disponibles en tu CSS global (ej: globals.css)
// o en un archivo de estilos inyectado (como este componente lo hace con <style jsx global>)
const CustomStyles = () => (
  <style jsx global>{`
    @keyframes cinematic-fade-in {
      0% {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      50% {
        opacity: 0.8;
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-cinematic-fade-in {
      animation: cinematic-fade-in 1.5s ease-out forwards;
    }
  `}</style>
);

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
    // La animación de carga se muestra por 2 segundos.
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

  // -------------------------------------------------------------------
  // PANTALLA DE CARGA (LOADING SCREEN - Fondo Negro Cinematográfico)
  // -------------------------------------------------------------------
  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <CustomStyles />
        <div className="flex flex-col items-center space-y-8 p-12">
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <img 
              src="/ciusa.png" 
              alt="Logo CIUSA" 
              width={120} 
              // Animación cinematográfica
              className="relative z-10 opacity-0 animate-cinematic-fade-in" 
            />
            <div className="text-center opacity-0 [animation-delay:0.5s] animate-cinematic-fade-in">
                <p className="text-4xl font-extrabold text-white">
                  Escuela de Idiomas
                </p>
                <p className="text-lg text-gray-300 mt-1">
                  Universidad Sergio Arboleda Caribe
                </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 opacity-0 [animation-delay:1.5s] animate-cinematic-fade-in">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              <span className="text-base text-gray-400 font-medium">Cargando la experiencia...</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // PANTALLA DE LOGIN PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gray-50">
      {/* Fondo animado con gradiente azul/púrpura */}
      <div className="absolute inset-0 z-0 opacity-30 bg-gradient-to-r from-blue-100 via-white to-purple-100 bg-[length:400%_400%] animate-animated-gradient"></div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-2">
              <img src="/ciusa.png" width={80} alt="Logo CIUSA" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 animate-fade-in-up">
                  Escuela de Idiomas
                </h1>
                <p className="text-base text-gray-600 animate-fade-in-up delay-150">
                  Universidad Sergio Arboleda Caribe
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Contenido Principal: Centrado Horizontal y Vertical */}
      <div className="flex items-center justify-center flex-grow py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-xl space-y-8">
          
          {/* SECCIÓN DE BIENVENIDA CENTRADA SOBRE EL LOGIN */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
              Bienvenido a la Escuela de Idiomas
            </h2>
            <p className="text-xl text-gray-600 mb-6 max-w-lg mx-auto">
              Plataforma integral para la gestión académica y administrativa
              de la Universidad Sergio Arboleda Caribe.
            </p>
          </div>
          
          {/* CARD DE LOGIN */}
          <Card className="shadow-2xl border-0 mx-auto max-w-md">
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
                  className="w-full py-3 text-xl font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={formIsLoading}
                >
                  {formIsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
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
  );
}