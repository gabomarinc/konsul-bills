import { NextRequest } from 'next/server'
import { verifyToken, SESSION_COOKIE_NAME, JWTPayload } from './jwt'

/**
 * Obtiene el usuario autenticado desde las cookies
 */
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) {
    return null
  }
  
  return await verifyToken(token)
}

/**
 * Verifica si el request está autenticado
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const user = await getAuthUser(req)
  return user !== null
}

/**
 * Middleware helper para proteger rutas que requieren autenticación
 */
export async function requireAuth(req: NextRequest): Promise<{ 
  authenticated: true
  user: JWTPayload 
} | { 
  authenticated: false
  user: null 
}> {
  const user = await getAuthUser(req)
  
  if (!user) {
    return { authenticated: false, user: null }
  }
  
  return { authenticated: true, user }
}

