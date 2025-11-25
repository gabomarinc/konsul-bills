import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { getGmailOAuthUrl } from "@/lib/gmail-oauth"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    
    if (!authUser?.userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Generar URL de OAuth
    const state = authUser.userId // Usar userId como state para seguridad
    const authUrl = getGmailOAuthUrl(state)

    // Redirigir a Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Error en OAuth connect:", error)
    return NextResponse.json(
      { error: "Error al iniciar conexión con Gmail" },
      { status: 500 }
    )
  }
}

