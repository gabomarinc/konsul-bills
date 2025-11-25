import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, SESSION_COOKIE_NAME } from "./lib/jwt"

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/auth/signin', '/auth/signup', '/api/auth/login', '/api/auth/register', '/api/stripe/webhook', '/api/cron', '/api/gmail/oauth', '/api/gemini/test']

// Rutas de API que requieren autenticación
const protectedApiRoutes = ['/api/invoices', '/api/quotes', '/api/profile', '/api/ai', '/api/settings', '/api/chat']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir acceso a rutas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar autenticación
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) {
    return redirectToLogin(request, pathname)
  }

  const user = await verifyToken(token)
  
  if (!user) {
    // Si es una ruta de API, devolver 401
    if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }
    
    // Si es una página, redirigir a login
    return redirectToLogin(request, pathname)
  }

  return NextResponse.next()
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quotes/:path*", 
    "/invoices/:path*",
    "/settings/:path*",
    "/api/invoices/:path*",
    "/api/quotes/:path*",
    "/api/profile/:path*",
    "/api/ai/:path*",
    "/api/settings/:path*",
    "/api/chat/:path*"
  ]
}
