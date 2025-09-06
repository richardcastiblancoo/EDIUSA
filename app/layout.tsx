import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import PWAInstaller from "@/components/pwa-installer";
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

// Aquí se configura el Open Graph.
// La imagen en la propiedad 'images' será usada como la vista previa.
export const metadata: Metadata = {
  title: "Centro de Idiomas Universidad Sergio Arboleda",
  openGraph: {
    title: "Centro de Idiomas Universidad Sergio Arboleda",
    description:
      "Sistema de gestión académica para el Centro de Idiomas de la Universidad Sergio Arboleda. Plataforma integral para la gestión académica y administrativa del Centro de Idiomas de la Universidad Sergio Arboleda. Gestión de estudiantes y profesores Administración de cursos y exámenes Seguimiento académico integral",
    url: "https://centro-de-idiomas-universidad-sergi.vercel.app/",
    siteName: "Centro de Idiomas Universidad Sergio Arboleda",
    images: [
      {
        url: "/ciusa.png", // ✅ Esta línea ya apunta a tu imagen.
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
        <meta name="theme-color" content="#f9efd4" />
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