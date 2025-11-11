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
  BookOpen,
  Globe,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Componente para el Efecto de Nieve
const SnowfallEffect = () => {
  const snowflakes = Array.from({ length: 100 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {snowflakes.map((i) => (
        <div 
          key={i} 
          className="snowflake"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${Math.random() * 10 + 5}s`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            opacity: `${Math.random() * 0.8 + 0.2}`,
          }}
        ></div>
      ))}
    </div>
  );
};

// Componente de Estilos Globales
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
    
    @keyframes float-and-rotate {
        0%, 100% { 
            transform: translateY(0) rotate(0deg); 
        }
        50% { 
            transform: translateY(-10px) rotate(5deg); 
        }
    }
    .animate-float-and-rotate {
        animation: float-and-rotate 6s ease-in-out infinite;
    }

    .loading-blue-bg {
        background-color: #1565C0;
        background-image: linear-gradient(135deg, #1A237E 0%, #1565C0 100%);
    }

    .dark-blue-bg {
      background-color: #1a237e;
    }
    .welcome-card-bg {
      background-color: #2c3e50;
      background-image: linear-gradient(135deg, #1e3a8a 0%, #374151 100%);
    }
    @keyframes floating-element {
      0% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0); }
    }
    .animate-floating {
      animation: floating-element 4s ease-in-out infinite;
    }
    
    @keyframes snowfall {
        0% { transform: translateY(-100vh); }
        100% { transform: translateY(100vh); }
    }
    
    .snowflake {
        position: absolute;
        top: -50px;
        background-color: #ffffff;
        border-radius: 50%;
        pointer-events: none;
        animation: snowfall linear infinite;
    }

  `}</style>
);

// Componente para elementos interactivos 3D en la pantalla de carga
const DynamicLoadingElements = () => (
    <div className="absolute inset-0 z-0 opacity-20">
      <Globe 
        className="absolute top-1/4 left-1/4 h-20 w-20 text-white/50 animate-float-and-rotate"
        style={{ animationDelay: '0s', filter: 'blur(1px)' }}
      />
      <BookOpen 
        className="absolute bottom-1/4 right-1/4 h-16 w-16 text-yellow-300/60 animate-float-and-rotate"
        style={{ animationDelay: '1.5s', transform: 'rotate(-20deg)' }}
      />
      <span 
        className="absolute top-10 right-20 text-7xl font-extrabold text-red-400/70 animate-float-and-rotate"
        style={{ animationDelay: '3s', transform: 'rotate(10deg)' }}
      >
        E
      </span>
      <span 
        className="absolute bottom-10 left-20 text-7xl font-extrabold text-green-400/70 animate-float-and-rotate"
        style={{ animationDelay: '4.5s', transform: 'rotate(-15deg)' }}
      >
        A
      </span>
    </div>
);

// Componente para la Carga Dinámica de Frases
const DynamicLoadingText = ({ phrases, intervalTime = 1200 }: { phrases: string[], intervalTime?: number }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [phrases.length, intervalTime]);
  
  return (
    <div className="relative h-10 w-full flex items-center justify-center">
      {phrases.map((phrase, index) => (
        <p
          key={index}
          className={`absolute text-xl md:text-2xl font-bold text-yellow-300 text-center transition-opacity duration-500 ${
            index === currentPhraseIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {phrase}
        </p>
      ))}
    </div>
  );
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();
  
  // Frases dinámicas con formato corregido - primera letra de cada palabra en mayúscula
  const loadingPhrases = [
      "El mundo te está esperando",
      "Nosotros te preparamos",
      "El inglés en la sergio te conecta con el mundo"
  ];
  
  const phraseIntervalTime = 1000;
  const loadingDurationMs = (loadingPhrases.length * phraseIntervalTime) + 500;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, loadingDurationMs);

    const storedEmail = localStorage.getItem("rememberedEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberMe(true);
    }

    return () => clearTimeout(timer);
  }, [loadingDurationMs]);

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
  // PANTALLA DE CARGA (LOADING SCREEN)
  // -------------------------------------------------------------------
  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen loading-blue-bg relative overflow-hidden">
        <CustomStyles />
        
        <SnowfallEffect />
        
        <DynamicLoadingElements />
        
        <div className="relative z-10 flex flex-col items-center space-y-8 p-12">
          
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <img 
              src="/ciusa-2.webp" 
              alt="Logo CIUSA" 
              width={120} 
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
          
          {/* Texto Dinámico - AHORA SIN SPINNER */}
          <div className="opacity-0 [animation-delay:1.5s] animate-cinematic-fade-in w-full max-w-lg pt-4 flex items-center justify-center">
              <DynamicLoadingText phrases={loadingPhrases} intervalTime={phraseIntervalTime} />
          </div>
          
          {/* SPINNER MOVIDO AQUÍ - DEBAJO DEL TEXTO DINÁMICO */}
          <div className="opacity-0 [animation-delay:1.5s] animate-cinematic-fade-in flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-yellow-300 animate-spin" />
          </div>
          
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // PANTALLA DE LOGIN PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark-blue-bg relative overflow-hidden">
      <CustomStyles />
      
      <SnowfallEffect />
      
      <div 
        className="w-full max-w-5xl rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex transform transition-all duration-700 ease-out animate-cinematic-fade-in relative z-10"
      >
        
        <div className="hidden lg:flex w-1/2 p-12 flex-col justify-center welcome-card-bg relative">
            
            <div className="mb-10">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/ciusa-2.webp" width={100} height={70} alt="Logo CIUSA" />
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
            
            <div className="relative h-64 flex items-center justify-center">
              <div className="w-full h-full relative">
                <div className="absolute top-0 left-1/4 w-24 h-24 rounded-full bg-blue-400/30 blur-xl animate-floating" style={{ animationDelay: '0s' }}></div>
                <div className="absolute bottom-4 left-10 w-16 h-16 bg-green-400 rounded-lg shadow-xl transform rotate-3 animate-floating" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-8 right-1/4 w-4 h-32 bg-yellow-400 rounded-full shadow-xl transform -rotate-12 animate-floating" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-purple-400 rounded-full shadow-xl animate-floating" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
        </div>
        
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