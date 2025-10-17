import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '86400', 10) // 24 horas por defecto

// Convertir el secret a Uint8Array para jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  name: string
  companyId?: string
  iat?: number
  exp?: number
}

/**
 * Genera un token JWT para un usuario
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey())
  
  return token
}

/**
 * Verifica y decodifica un token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256']
    })
    return payload as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Obtiene el nombre de la cookie de sesión
 */
export const SESSION_COOKIE_NAME = 'konsul_session'

/**
 * Opciones para la cookie de sesión
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE,
  path: '/',
}

