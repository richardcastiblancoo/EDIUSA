import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import PWAInstaller from "@/components/pwa-installer";
import type { Metadata, Viewport } from "next";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Escuela de Idiomas Universidad Sergio Arboleda Caribe",
  metadataBase: new URL("https://ciusa.vercel.app"),
  openGraph: {
    title: "Escuela de Idiomas Universidad Sergio Arboleda Caribe",
    description:
      "Sistema de gestión académica para el Centro de Idiomas de la Universidad Sergio Arboleda. Plataforma integral para la gestión académica y administrativa del Centro de Idiomas de la Universidad Sergio Arboleda. Gestión de estudiantes y profesores Administración de cursos y exámenes Seguimiento académico integral",
    url: "https://ciusa.vercel.app/",
    siteName: "Centro de Idiomas Universidad Sergio Arboleda",
    images: [
      {
        url: "/ciusa.png",
        width: 1200,
        height: 630,
        alt: "Centro de Idiomas Universidad Sergio Arboleda",
      },
    ],
    locale: "es",
    type: "website",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/ciusa.png" />
        <meta
          name="description"
          content="Sistema de gestión académica para el Centro de Idiomas de la Universidad Sergio Arboleda. Plataforma integral para la gestión académica y administrativa del Centro de Idiomas de la Universidad Sergio Arboleda. Gestión de estudiantes y profesores Administración de cursos y exámenes Seguimiento académico integral."
        />
        <meta name="author" content="Ciusa" />
        <meta name="robots" content="index, follow" />
        <meta
          name="publisher"
          content="Centro de Idiomas Universidad Sergio Arboleda"
        />
        <meta
          name="keywords"
          content="Centro de Idiomas Universidad Sergio Arboleda, Centro de Idiomas, Universidad Sergio Arboleda, Gestión académica, Gestión administrativa, Gestión de estudiantes, Gestión de profesores, Gestión de cursos, Gestión de exámenes, Seguimiento académico, Plataforma de gestión académica, Centro de Idiomas Universidad Sergio Arboleda"
        />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Centro de Idiomas Universidad Sergio Arboleda"
        />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <PWAInstaller />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
