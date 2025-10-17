import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Tipo para el usuario
type User = {
  id: string
  email: string
  name: string
  password: string
  company: {
    id: string
    name: string
  }
}

// Simulación de base de datos en memoria (temporal)
const users: User[] = []

export async function POST(req: NextRequest) {
  console.log("🚀 Simple Registration API called")
  
  try {
    const body = await req.json()
    console.log("📝 Request body:", { ...body, password: "[HIDDEN]" })

    const { email, password, name } = body

    // Validaciones básicas
    if (!email || !password || !name) {
      console.log("❌ Validation failed:", { hasEmail: !!email, hasPassword: !!password, hasName: !!name })
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log("❌ Password too short:", password.length)
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    console.log("✅ Validation passed, checking existing user...")

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      console.log("❌ User already exists:", email)
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    console.log("✅ User doesn't exist, hashing password...")

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("✅ Password hashed, creating user...")

    // Crear el usuario (simulado)
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      password: hashedPassword,
      company: {
        id: `company_${Date.now()}`,
        name: `${name}'s Company`
      }
    }

    users.push(user)

    console.log(`✅ User registered: ${user.email} with company: ${user.company.name}`)

    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      company: {
        id: user.company.id,
        name: user.company.name
      }
    }

    console.log("📤 Sending response:", response)
    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Registration error:", error)
    
    return NextResponse.json(
      { error: "Failed to register user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



