import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByEmail } from "@/lib/db"
import { loginSchema } from "@/lib/schemas"
import { signToken, SESSION_COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/jwt"
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req)
    const rateLimit = checkRateLimit(identifier, { max: 5, windowMs: 15 * 60 * 1000 }) // 5 intentos por 15 minutos
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "Demasiados intentos de inicio de sesión. Por favor, intenta más tarde.",
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset)
          }
        }
      )
    }
    
    const body = await req.json()

    // Validar input con Zod
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Buscar el usuario por email
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Generar JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name
    })

    // Crear respuesta con cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

    // Configurar cookie httpOnly segura
    response.cookies.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS)
    
    // Agregar headers de rate limit
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit))
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset))

    return response

  } catch (error) {
    console.error("Login error:", error)
    
    return NextResponse.json(
      { error: "Error al autenticar usuario" },
      { status: 500 }
    )
  }
}


