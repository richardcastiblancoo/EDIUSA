import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Obtener la cookie de autenticación
  const authUser = request.cookies.get('auth_user')?.value;
  
  // Verificar si la ruta comienza con /dashboard
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  
  // Si es una ruta del dashboard y no hay usuario autenticado, redirigir al login
  if (isDashboardRoute && !authUser) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
  
  // Si hay un usuario autenticado y está intentando acceder a la página principal, 
  // redirigirlo a su dashboard según su rol
  if (request.nextUrl.pathname === '/' && authUser) {
    try {
      const user = JSON.parse(authUser);
      let redirectPath = '/dashboard/student'; // Ruta por defecto
      
      // Redirigir según el rol del usuario
      switch (user.role) {
        case 'coordinator':
          redirectPath = '/dashboard/coordinator';
          break;
        case 'teacher':
          redirectPath = '/dashboard/teacher';
          break;
        case 'student':
          redirectPath = '/dashboard/student';
          break;
      }
      
      const url = new URL(redirectPath, request.url);
      return NextResponse.redirect(url);
    } catch (error) {
      // Si hay un error al parsear el usuario, eliminar la cookie y redirigir al login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_user');
      return response;
    }
  }
  
  return NextResponse.next();
}

// Configurar las rutas en las que se ejecutará el proxy
export const config = {
  matcher: ['/', '/dashboard/:path*'],
};