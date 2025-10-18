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
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Componente de Estilos Globales para la animación tipo película (Mantenemos esta parte)
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
    
    /* Estilos para el fondo azul y elementos de la nueva página de login */
    .dark-blue-bg {
        background-color: #1a237e; /* Un azul oscuro similar al de la imagen */
    }
    .welcome-card-bg {
        background-color: #2c3e50; /* Un tono un poco más claro para la tarjeta de bienvenida */
        background-image: linear-gradient(135deg, #1e3a8a 0%, #374151 100%); /* Gradiente sutil */
    }
    /* Animación simple para los elementos de bienvenida */
    @keyframes floating-element {
        0% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0); }
    }
    .animate-floating {
        animation: floating-element 4s ease-in-out infinite;
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
            {/* Si tienes un logo para el fondo de carga, úsalo aquí. Por ejemplo: */}
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
  // PANTALLA DE LOGIN PRINCIPAL (Nuevo Diseño)
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark-blue-bg">
      <CustomStyles />
      
      {/* Contenedor Principal con Sombra Flotante */}
      <div 
        className="w-full max-w-5xl rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex transform transition-all duration-700 ease-out animate-cinematic-fade-in"
      >
        
        {/* Lado Izquierdo: Bienvenida e Ilustración (Texto Actualizado) */}
        <div className="hidden lg:flex w-1/2 p-12 flex-col justify-center welcome-card-bg relative">
            
            {/* Contenido de Bienvenida - TÍTULO Y DESCRIPCIÓN ACTUALIZADOS AQUÍ */}
            <div className="mb-10">
                <div className="flex items-center space-x-3 mb-4">
                    <img src="/ciusa.png" width={50} alt="Logo CIUSA" className="rounded-full shadow-lg" />
                    <span className="text-sm font-semibold text-white/80">
                        Escuela de Idiomas, Universidad Sergio Arboleda Caribe
                    </span>
                </div>
                <h1 className="text-5xl font-extrabold text-white leading-tight">
                    Bienvenido a la Escuela de Idiomas
                </h1>
                <p className="text-xl text-gray-300 mt-4">
                    Plataforma integral para la gestión académica y administrativa de la Universidad Sergio Arboleda Caribe.
                </p>
            </div>
            
            {/* Placeholder de Ilustración */}
            <div className="relative h-64 flex items-center justify-center">
                {/* Simulamos la ilustración con un div y elementos flotantes */}
                <div className="w-full h-full relative">
                    {/* Nube/Mundo */}
                    <div className="absolute top-0 left-1/4 w-24 h-24 rounded-full bg-blue-400/30 blur-xl animate-floating" style={{ animationDelay: '0s' }}></div>
                    {/* Libro/Mascota 1 */}
                    <div className="absolute bottom-4 left-10 w-16 h-16 bg-green-400 rounded-lg shadow-xl transform rotate-3 animate-floating" style={{ animationDelay: '0.5s' }}></div>
                    {/* Lápiz/Mascota 2 */}
                    <div className="absolute bottom-8 right-1/4 w-4 h-32 bg-yellow-400 rounded-full shadow-xl transform -rotate-12 animate-floating" style={{ animationDelay: '1s' }}></div>
                    {/* Búho/Mascota 3 */}
                    <div className="absolute top-10 right-10 w-20 h-20 bg-purple-400 rounded-full shadow-xl animate-floating" style={{ animationDelay: '1.5s' }}></div>
                </div>
            </div>
        </div>
        
        {/* Lado Derecho: Formulario de Login */}
        <Card className="w-full lg:w-1/2 p-8 shadow-none border-0 rounded-l-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              Acceder a tu Plataforma
            </CardTitle>
            <CardDescription className="text-center text-lg text-gray-500">
              Por favor, ingresa tu email y contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              autoComplete="on"
            >
              {/* Campo Correo Electrónico */}
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
                    className="pl-10 h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600 text-lg rounded-xl"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              
              {/* Campo Contraseña */}
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
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600 text-lg rounded-xl"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Recordarme - Sin Olvidaste Contraseña */}
              <div className="flex items-center justify-start">
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
              
              {/* Botón de Iniciar Sesión */}
              <Button
                type="submit"
                className="w-full py-3 text-xl font-semibold bg-blue-600 hover:bg-blue-700 transition-all rounded-xl shadow-lg hover:shadow-xl"
                disabled={formIsLoading}
              >
                {formIsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              
              {/* Alerta de Error */}
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
  );
}