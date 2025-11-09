import { NextResponse, NextRequest } from 'next/server';

// ... (Tipos Rol y Usuario se mantienen igual)
type Rol = 'coordinador' | 'profesor' | 'estudiante' | 'anonimo_logueado';
interface Usuario {
    rol: Rol;
}

// ⚠️ NOTA DE SEGURIDAD: Función de simulación para obtener el rol (mantener seguro en prod)
const obtenerUsuarioDesdeToken = (token: string | undefined): Usuario | null => {
  if (!token) {
    return null;
  }
  
  // Simulación:
  try {
      if (token.includes('coordinador')) return { rol: 'coordinador' };
      if (token.includes('profesor')) return { rol: 'profesor' };
      if (token.includes('estudiante')) return { rol: 'estudiante' };
      return { rol: 'anonimo_logueado' }; 
  } catch (error) {
    return null; 
  }
};

// Mapeo de Roles y Rutas Permitidas (Autorización)
// Usamos el segmento principal de la URL como clave
const RUTA_ROLES: { [key: string]: Rol[] } = {
    // Rutas protegidas solo por Autenticación (cualquier rol logueado)
    '/perfil': ['coordinador', 'profesor', 'estudiante', 'anonimo_logueado'],
    '/dashboard': ['coordinador', 'profesor', 'estudiante', 'anonimo_logueado'],
    '/asistente-ia': ['coordinador', 'profesor', 'estudiante', 'anonimo_logueado'],

    // Rutas protegidas por Rol (Autorización)
    '/usuarios': ['coordinador'], // Solo Coordinador puede administrar Usuarios
    '/estudiantes': ['coordinador', 'profesor'], // Coordinador y Profesor pueden ver estudiantes
    '/profesores': ['coordinador'], // Solo Coordinador puede administrar Profesores
    '/cursos': ['coordinador', 'profesor'], // Coordinador y Profesor pueden administrar Cursos
    '/listado-pqr': ['coordinador', 'profesor'], // Solo roles administrativos o profesor
    '/reportes': ['coordinador'], // Reportes sensibles, solo Coordinador
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    const authToken = request.cookies.get('authToken')?.value;
    const usuario = obtenerUsuarioDesdeToken(authToken);

    // Identificar el segmento de la ruta para la verificación de roles
    // Aseguramos que '/dashboard/subpage' se mapee a '/dashboard'
    const rutaBase = `/${pathname.split('/')[1]}`;
    const rolesRequeridos = RUTA_ROLES[rutaBase]; 

    // 1. Comprobación de Autenticación (¿Está logueado?)
    if (rolesRequeridos && !usuario) {
        // La ruta requiere autenticación y el usuario NO está logueado
        const url = new URL('/login', request.url);
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    // 2. Comprobación de Autorización (¿Tiene el rol correcto?)
    if (rolesRequeridos && usuario && !rolesRequeridos.includes(usuario.rol)) {
        // Logueado, pero el rol NO está permitido para esta ruta
        const redirectUrl = new URL('/unauthorized', request.url);
        return NextResponse.redirect(redirectUrl);
    }
    
    // Permitir el acceso
    return NextResponse.next();
}

// Configuración del Matcher para interceptar las rutas deseadas
export const config = {
    matcher: [
        // Rutas principales (cubren sub-rutas, ej: /dashboard/settings)
        '/dashboard/:path*', 
        '/asistente-ia/:path*',
        
        // Rutas de administración y listados
        '/usuarios/:path*',
        '/estudiantes/:path*',
        '/profesores/:path*',
        '/cursos/:path*',
        
        // Rutas de reportes y soporte
        '/listado-pqr/:path*',
        '/reportes/:path*',
        
        // Perfil
        '/perfil/:path*',

        // Excluir la API y archivos estáticos
        // Si tienes rutas API que deben estar públicas, usa un patrón de exclusión aquí:
        // '/((?!api|_next/static|_next/image|favicon.ico).*)', 
    ],
};