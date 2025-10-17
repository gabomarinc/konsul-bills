import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { 
  findUserByEmail, 
  createUser, 
  createCompany, 
  createMembership, 
  createCompanySettings, 
  createSequences 
} from "@/lib/db"
import { registerSchema } from "@/lib/schemas"
import { signToken, SESSION_COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/jwt"
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req)
    const rateLimit = checkRateLimit(identifier, { max: 3, windowMs: 60 * 60 * 1000 }) // 3 registros por hora
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "Demasiados intentos de registro. Por favor, intenta más tarde.",
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
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario
    const userId = await createUser(email, name, hashedPassword)

    // Crear empresa para el usuario
    const companyName = `${name}'s Company`
    const companyId = await createCompany(companyName)

    // Crear membresía
    await createMembership(userId, companyId, 'OWNER')

    // Crear configuración de empresa
    await createCompanySettings(companyId)

    // Crear secuencias
    await createSequences(companyId)

    // Generar JWT token
    const token = await signToken({
      userId,
      email,
      name,
      companyId
    })

    // Crear respuesta con cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name
      },
      company: {
        id: companyId,
        name: companyName
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
    console.error("Registration error:", error)
    
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
