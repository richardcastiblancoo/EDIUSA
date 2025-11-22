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
  Pencil,
  Notebook,
  GraduationCap,
  Languages,
  Star,
  Trophy,
  Heart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Componente para animación letra por letra infinita
const AnimatedWord = ({ word }: { word: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isForward, setIsForward] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isForward) {
        if (currentIndex < word.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsForward(false);
        }
      } else {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        } else {
          setIsForward(true);
        }
      }
    }, 200); // Velocidad de la animación

    return () => clearInterval(interval);
  }, [currentIndex, isForward, word.length]);

  return (
    <span className="inline-block">
      {word.split("").map((letter, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-200 ${
            index <= currentIndex
              ? "text-#fce414 animate-rubber-band"
              : "text-white opacity-50"
          }`}
          style={{
            color: index <= currentIndex ? "#fce414" : "#ffffff",
            animationDelay: `${index * 50}ms`,
          }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
};

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
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-10px) rotate(5deg);
      }
    }
    .animate-float-and-rotate {
      animation: float-and-rotate 6s ease-in-out infinite;
    }

    @keyframes bounce-gentle {
      0%,
      100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
    .animate-bounce-gentle {
      animation: bounce-gentle 3s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    .animate-pulse-glow {
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes wiggle {
      0%,
      100% {
        transform: rotate(-3deg);
      }
      50% {
        transform: rotate(3deg);
      }
    }
    .animate-wiggle {
      animation: wiggle 4s ease-in-out infinite;
    }

    @keyframes rubberBand {
      0% {
        transform: scale3d(1, 1, 1);
      }
      30% {
        transform: scale3d(1.25, 0.75, 1);
      }
      40% {
        transform: scale3d(0.75, 1.25, 1);
      }
      50% {
        transform: scale3d(1.15, 0.85, 1);
      }
      65% {
        transform: scale3d(0.95, 1.05, 1);
      }
      75% {
        transform: scale3d(1.05, 0.95, 1);
      }
      100% {
        transform: scale3d(1, 1, 1);
      }
    }
    .animate-rubber-band {
      animation: rubberBand 0.8s both;
    }

    .loading-gradient-bg {
      background: linear-gradient(135deg, #044bab 0%, #92a74e 100%);
    }

    .main-gradient-bg {
      background: linear-gradient(
        135deg,
        #044bab 0%,
        #92a74e 50%,
        #92a74e 100%
      );
    }

    .welcome-card-gradient {
      background: linear-gradient(135deg, #044bab 0%, #92a74e 100%);
    }

    @keyframes floating-element {
      0% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-15px) rotate(5deg);
      }
      100% {
        transform: translateY(0) rotate(0deg);
      }
    }
    .animate-floating {
      animation: floating-element 5s ease-in-out infinite;
    }

    @keyframes snowfall {
      0% {
        transform: translateY(-100vh) rotate(0deg);
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
      }
    }

    .snowflake {
      position: absolute;
      top: -50px;
      background-color: #fce414;
      border-radius: 50%;
      pointer-events: none;
      animation: snowfall linear infinite;
    }

    .sparkle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #fce414;
      border-radius: 50%;
      animation: sparkle 2s linear infinite;
    }

    @keyframes sparkle {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        opacity: 1;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(0);
      }
    }

    .card-glow {
      box-shadow: 0 0 50px rgba(4, 75, 171, 0.3);
    }

    .btn-glow {
      box-shadow: 0 4px 15px rgba(252, 228, 20, 0.4);
      transition: all 0.3s ease;
    }

    .btn-glow:hover {
      box-shadow: 0 6px 20px rgba(252, 228, 20, 0.6);
      transform: translateY(-2px);
    }
  `}</style>
);

// Componente para elementos educativos flotantes (sin Globe)
const EducationalFloatingElements = () => (
  <div className="absolute inset-0 z-0 opacity-40">
    {/* Lápiz animado */}
    <Pencil
      className="absolute top-1/4 left-1/4 h-16 w-16 text-#fce414 animate-float-and-rotate"
      style={{ animationDelay: "0s", color: "#fce414" }}
    />

    {/* Cuaderno */}
    <Notebook
      className="absolute bottom-1/4 right-1/4 h-20 w-20 text-#fdef7c animate-float-and-rotate"
      style={{
        animationDelay: "1s",
        transform: "rotate(-15deg)",
        color: "#fdef7c",
      }}
    />

    {/* Gorro de graduación */}
    <GraduationCap
      className="absolute top-10 right-20 h-14 w-14 text-#92a74e animate-bounce-gentle"
      style={{ animationDelay: "2s", color: "#92a74e" }}
    />

    {/* Icono de idiomas */}
    <Languages
      className="absolute bottom-20 left-10 h-18 w-18 text-#978701 animate-wiggle"
      style={{ animationDelay: "3s", color: "#978701" }}
    />

    {/* Estrellas decorativas */}
    <Star
      className="absolute top-32 right-32 h-8 w-8 text-#fce414 animate-pulse-glow"
      style={{ animationDelay: "0.5s", color: "#fce414" }}
    />
    <Star
      className="absolute bottom-32 left-32 h-6 w-6 text-#fdef7c animate-pulse-glow"
      style={{ animationDelay: "1.5s", color: "#fdef7c" }}
    />
    <Star
      className="absolute top-40 left-40 h-10 w-10 text-#fce414 animate-pulse-glow"
      style={{ animationDelay: "2.5s", color: "#fce414" }}
    />

    {/* Trofeo */}
    <Trophy
      className="absolute top-3/4 left-1/3 h-12 w-12 text-#fce414 animate-float-and-rotate"
      style={{ animationDelay: "3.5s", color: "#fce414" }}
    />

    {/* Corazón */}
    <Heart
      className="absolute top-1/3 right-1/3 h-10 w-10 text-#fce414 animate-pulse-glow"
      style={{
        animationDelay: "4s",
        animationDuration: "1.5s",
        color: "#fce414",
      }}
    />
  </div>
);

// Componente para efectos de brillo
const SparkleEffect = () => {
  const sparkles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {sparkles.map((i) => (
        <div
          key={i}
          className="sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        ></div>
      ))}
    </div>
  );
};

// Componente para la Carga Dinámica de Frases (sin iconos)
const DynamicLoadingText = ({
  phrases,
  intervalTime = 1200,
}: {
  phrases: string[];
  intervalTime?: number;
}) => {
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
          className={`absolute text-xl md:text-2xl font-bold text-#fce414 text-center transition-all duration-500 ${
            index === currentPhraseIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-90"
          }`}
          style={{ color: "#fce414" }}
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
  const [showPassword, setShowPassword] = useState(false);
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const { signIn } = useAuth();
  const router = useRouter();

  // Frases dinámicas mejoradas (sin iconos)
  const loadingPhrases = [
    "El mundo te está esperando",
    "Nosotros te preparamos",
    "El inglés en la sergio te conecta con el mundo",
    "Aprende, practica, domina",
    "Tu viaje lingüístico comienza aquí",
  ];

  const phraseIntervalTime = 1200;
  const loadingDurationMs = loadingPhrases.length * phraseIntervalTime + 500;

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
      <div className="flex items-center justify-center min-h-screen loading-gradient-bg relative overflow-hidden">
        <CustomStyles />

        <SnowfallEffect />
        <SparkleEffect />

        <EducationalFloatingElements />

        <div className="relative z-10 flex flex-col items-center space-y-8 p-12">
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <img
                src="/ciusa-2.webp"
                alt="Logo CIUSA"
                width={140}
                className="relative z-10 opacity-0 animate-cinematic-fade-in drop-shadow-lg"
              />
              <Sparkles
                className="absolute -top-2 -right-2 h-6 w-6 text-#fce414 animate-pulse-glow"
                style={{ color: "#fce414" }}
              />
            </div>
            <div className="text-center opacity-0 [animation-delay:0.5s] animate-cinematic-fade-in">
              <p className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                Ediusa
              </p>
              <p className="text-xl text-white/90 font-semibold mt-1">
                Universidad Sergio Arboleda Caribe
              </p>
            </div>
          </div>

          {/* Texto Dinámico */}
          <div className="opacity-0 [animation-delay:1.5s] animate-cinematic-fade-in w-full max-w-lg pt-4 flex items-center justify-center">
            <DynamicLoadingText
              phrases={loadingPhrases}
              intervalTime={phraseIntervalTime}
            />
          </div>

          {/* Spinner decorado */}
          <div className="opacity-0 [animation-delay:1.5s] animate-cinematic-fade-in flex items-center justify-center relative">
            <div className="relative">
              <Loader2
                className="h-10 w-10 text-#fce414 animate-spin"
                style={{ color: "#fce414" }}
              />
              <div
                className="absolute inset-0 border-2 border-#fce414/30 rounded-full animate-ping"
                style={{ borderColor: "#fce414" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // PANTALLA DE LOGIN PRINCIPAL
  // -------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center p-4 main-gradient-bg relative overflow-hidden">
      <CustomStyles />

      <SnowfallEffect />
      <SparkleEffect />
      <EducationalFloatingElements />

      <div className="w-full max-w-6xl rounded-3xl shadow-2xl card-glow overflow-hidden flex transform transition-all duration-700 ease-out animate-cinematic-fade-in relative z-10 border-2 border-white/20">
        {/* Lado izquierdo - Bienvenida mejorada */}
        <div className="hidden lg:flex w-1/2 p-12 flex-col justify-center welcome-card-gradient relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-10 left-10 w-32 h-32 bg-#fce414 rounded-full"
              style={{ backgroundColor: "#fce414" }}
            ></div>
            <div
              className="absolute bottom-10 right-10 w-24 h-24 bg-#fdef7c rounded-lg transform rotate-45"
              style={{ backgroundColor: "#fdef7c" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 w-40 h-40 bg-#92a74e rounded-full"
              style={{ backgroundColor: "#92a74e" }}
            ></div>
          </div>

          <div className="relative z-10 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <img
                  src="/ciusa-2.webp"
                  width={100}
                  height={70}
                  alt="Logo CIUSA"
                  className="drop-shadow-lg"
                />
                <Star
                  className="absolute -top-1 -right-1 h-4 w-4 text-#fce414 fill-current"
                  style={{ color: "#fce414" }}
                />
              </div>
              <h1 className="text-sm font-bold text-white/90  px-3 py-1 rounded-full">
                Escuela de Idiomas, Universidad Sergio Arboleda Caribe
              </h1>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
              ¡Bienvenido a tu{" "}
              <span className="text-#fce414" style={{ color: "#fce414" }}>
                <AnimatedWord word="aventura" />
              </span>{" "}
              lingüística!
            </h1>
            <p className="text-xl text-white/90 font-medium">
              Plataforma integral para la gestión académica y administrativa de
              la Universidad Sergio Arboleda Caribe.
            </p>
          </div>

          {/* Elementos educativos animados */}
          
        </div>

        {/* Lado derecho - Formulario de login mejorado */}
        <Card className="w-full lg:w-1/2 p-10 shadow-none border-0 rounded-l-none bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center justify-center mb-4">
              <CardTitle
                className="text-4xl font-black bg-gradient-to-r from-#044bab to-#92a74e bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #044bab, #92a74e)",
                }}
              >
                Acceder a tu Plataforma
              </CardTitle>
            </div>
            <CardDescription className="text-center text-lg text-gray-600 font-medium">
              Por favor, ingresa tu email y contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              autoComplete="on"
            >
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-base font-semibold text-gray-700 flex items-center"
                >
                  <User
                    className="h-4 w-4 mr-2 text-#044bab"
                    style={{ color: "#044bab" }}
                  />
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu.email@usa.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 focus:border-#044bab focus:ring-2 focus:ring-#044bab/20 text-lg rounded-2xl transition-all duration-300"
                    style={
                      {
                        borderColor: "rgb(229 231 235)",
                        "--tw-border-opacity": "1",
                        "--tw-ring-color": "rgba(4, 75, 171, 0.2)",
                      } as any
                    }
                    required
                    autoComplete="username"
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-base font-semibold text-gray-700 flex items-center"
                >
                  <Lock
                    className="h-4 w-4 mr-2 text-#044bab"
                    style={{ color: "#044bab" }}
                  />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 focus:border-#044bab focus:ring-2 focus:ring-#044bab/20 text-lg rounded-2xl transition-all duration-300"
                    style={
                      {
                        borderColor: "rgb(229 231 235)",
                        "--tw-border-opacity": "1",
                        "--tw-ring-color": "rgba(4, 75, 171, 0.2)",
                      } as any
                    }
                    required
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-#044bab transition-colors duration-300"
                    style={{ "--tw-text-opacity": "1" } as any}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 text-#044bab focus:ring-#044bab border-gray-300 rounded transition duration-300"
                  style={
                    { color: "#044bab", "--tw-ring-color": "#044bab" } as any
                  }
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-3 block text-base font-medium text-gray-900"
                >
                  Recordar mi cuenta
                </label>
              </div>

              <Button
                type="submit"
                className="w-full py-4 text-xl font-bold bg-gradient-to-r from-#fce414 to-#fdef7c hover:from-#fce414 hover:to-#fce414 transition-all duration-300 rounded-2xl btn-glow transform hover:scale-[1.02] text-#044bab"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #fce414, #fdef7c)",
                  color: "#044bab",
                }}
                disabled={formIsLoading}
              >
                {formIsLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              {error && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
