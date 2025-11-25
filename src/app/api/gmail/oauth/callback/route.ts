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
    console.log('[Gmail OAuth Callback] Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens(code)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('[Gmail OAuth Callback] Tokens missing:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokens: tokens
      })
      throw new Error('Tokens no recibidos de Google')
    }

    console.log('[Gmail OAuth Callback] Tokens received, fetching user info...')

    // Obtener información del usuario de Gmail
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })

    console.log('[Gmail OAuth Callback] User info response status:', userInfoResponse.status, userInfoResponse.statusText)

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('[Gmail OAuth Callback] User info error:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        error: errorText
      })
      throw new Error(`Error obteniendo información del usuario: ${userInfoResponse.status} ${userInfoResponse.statusText}`)
    }

    const userInfo = await userInfoResponse.json()
    console.log('[Gmail OAuth Callback] User info received:', { email: userInfo.email, id: userInfo.id })
    const email = userInfo.email
    
    if (!email) {
      console.error('[Gmail OAuth Callback] Email not found in user info:', userInfo)
      throw new Error('Email no encontrado en la información del usuario')
    }

    // Calcular fecha de expiración
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600))

    // Guardar o actualizar integración en BD
    const userId = state
    console.log('[Gmail OAuth Callback] Saving integration for userId:', userId, 'email:', email)
    
    // Verificar que el userId existe en la BD antes de guardar
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })
    
    if (!userExists) {
      console.error('[Gmail OAuth Callback] User not found:', userId)
      return NextResponse.redirect(
        `${baseUrl}/settings?gmail_error=user_not_found`
      )
    }
    
    console.log('[Gmail OAuth Callback] User exists, proceeding to save integration')
    
    try {
      const integration = await prisma.gmailIntegration.upsert({
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

      console.log('[Gmail OAuth Callback] Integration saved successfully:', {
        id: integration.id,
        userId: integration.userId,
        email: integration.email,
        isActive: integration.isActive
      })
      
      // Verificar que se guardó correctamente
      const verify = await prisma.gmailIntegration.findUnique({
        where: { userId }
      })
      console.log('[Gmail OAuth Callback] Verification query result:', verify ? 'Found' : 'NOT FOUND')
      
      if (!verify) {
        console.error('[Gmail OAuth Callback] Integration was not saved correctly!')
        return NextResponse.redirect(
          `${baseUrl}/settings?gmail_error=save_failed`
        )
      }
    } catch (dbError: any) {
      console.error('[Gmail OAuth Callback] Database error:', dbError)
      console.error('[Gmail OAuth Callback] Error details:', {
        code: dbError.code,
        message: dbError.message,
        meta: dbError.meta
      })
      return NextResponse.redirect(
        `${baseUrl}/settings?gmail_error=database_error`
      )
    }

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

