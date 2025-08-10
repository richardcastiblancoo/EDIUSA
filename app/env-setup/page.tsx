"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, Database, Key, ExternalLink } from "lucide-react"

export default function EnvSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Base de Datos</h1>
          <p className="text-gray-600">Configura Supabase para el Centro de Idiomas</p>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Necesitas configurar las variables de entorno para conectar con Supabase.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Variables de Entorno
              </CardTitle>
              <CardDescription>Agrega estas variables a tu archivo .env.local</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <code className="text-sm">
                  NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
                  <br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuración de Supabase
              </CardTitle>
              <CardDescription>Pasos para configurar tu proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Crea una cuenta en{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Supabase <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Crea un nuevo proyecto</li>
                <li>Ve a Settings → API</li>
                <li>Copia la URL y la clave anónima</li>
                <li>Ejecuta los scripts SQL en el editor SQL</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Scripts SQL a Ejecutar
            </CardTitle>
            <CardDescription>Ejecuta estos scripts en el editor SQL de Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Crear Tablas (01-create-tables.sql)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Este script crea todas las tablas necesarias para el sistema.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Datos Iniciales (02-seed-data.sql)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Este script inserta los usuarios y datos de prueba.
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  Los scripts están disponibles en la carpeta <code>/scripts</code> del proyecto. Cópialos y pégalos en
                  el editor SQL de Supabase.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios de Prueba</CardTitle>
            <CardDescription>Una vez ejecutados los scripts, podrás usar estos usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border rounded-lg p-3">
                <h4 className="font-medium">Coordinador</h4>
                <p className="text-sm text-muted-foreground">coordinador@usa.edu.co</p>
                <p className="text-sm text-muted-foreground">Contraseña: 123456</p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium">Profesor</h4>
                <p className="text-sm text-muted-foreground">profesor@usa.edu.co</p>
                <p className="text-sm text-muted-foreground">Contraseña: 123456</p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="font-medium">Estudiante</h4>
                <p className="text-sm text-muted-foreground">estudiante@usa.edu.co</p>
                <p className="text-sm text-muted-foreground">Contraseña: 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
