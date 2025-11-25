import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, encryptToken } from "@/lib/gmail-oauth"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    // Si hay error de Google
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?gmail_error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?gmail_error=missing_params`
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

    // Redirigir a settings con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?gmail_connected=true`
    )
  } catch (error) {
    console.error("Error en OAuth callback:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?gmail_error=callback_failed`
    )
  }
}

