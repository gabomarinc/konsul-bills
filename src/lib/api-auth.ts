import { NextRequest } from 'next/server'
import { verifyToken, SESSION_COOKIE_NAME, JWTPayload } from './jwt'
import { getUserCompany } from './company-utils'

/**
 * Obtiene el usuario autenticado desde el request
 */
export async function getAuthUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) {
    return null
  }
  
  return await verifyToken(token)
}

/**
 * Obtiene la empresa del usuario autenticado
 * Lanza error si no hay usuario autenticado
 */
export async function getUserCompanyFromRequest(req: NextRequest) {
  const user = await getAuthUserFromRequest(req)
  
  if (!user?.userId) {
    throw new Error('No authenticated user')
  }
  
  return await getUserCompany(user.userId)
}








