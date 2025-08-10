import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import PWAInstaller from "@/components/pwa-installer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Universidad Sergio Arboleda Centro de Idiomas",
  description: "Sistema de gestión académica para el Centro de Idiomas de la Universidad Sergio Arboleda",
  manifest: "/manifest.json",
  themeColor: "#031c30",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/graduacion.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Centro de Idiomas USA" />
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
  )
}
