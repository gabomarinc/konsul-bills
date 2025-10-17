import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/jwt"

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada exitosamente"
  })

  // Eliminar la cookie de sesión
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}


