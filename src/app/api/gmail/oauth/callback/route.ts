import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, encryptToken } from "@/lib/gmail-oauth"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/db"

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'https://konsul-bills.vercel.app'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    const baseUrl = getBaseUrl()

    console.log('[Gmail OAuth Callback]', { code: code ? 'present' : 'missing', state, error })

    // Si hay error de Google
    if (error) {
      console.error('[Gmail OAuth Callback] Error from Google:', error)
      return NextResponse.redirect(
        `${baseUrl}/settings?gmail_error=${error}`
      )
    }

    if (!code || !state) {
      console.error('[Gmail OAuth Callback] Missing params:', { code: !!code, state: !!state })
      return NextResponse.redirect(
        `${baseUrl}/settings?gmail_error=missing_params`
      )
    }

    // Intercambiar código por tokens
    const tokens = await exchangeCodeForTokens(code)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Tokens no recibidos de Google')
    }

    // Obtener información del usuario de Gmail
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })

    if (!userInfoResponse.ok) {
      throw new Error('Error obteniendo información del usuario')
    }

    const userInfo = await userInfoResponse.json()
    const email = userInfo.email

    // Calcular fecha de expiración
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600))

    // Guardar o actualizar integración en BD
    const userId = state
    console.log('[Gmail OAuth Callback] Saving integration for userId:', userId)
    
    await prisma.gmailIntegration.upsert({
      where: { userId },
      update: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt,
        email,
        isActive: true,
        lastSyncAt: null,
        updatedAt: new Date()
      },
      create: {
        id: generateId('gmail'),
        userId,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt,
        email,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('[Gmail OAuth Callback] Integration saved successfully for userId:', userId)

    // Redirigir a settings con éxito
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?gmail_connected=true`
    )
  } catch (error) {
    console.error("Error en OAuth callback:", error)
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?gmail_error=callback_failed`
    )
  }
}

