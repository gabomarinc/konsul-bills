import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import crypto from "crypto"

// Función para encriptar la Secret Key de Stripe
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32', 'utf8').slice(0, 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

// Función para desencriptar la Secret Key de Stripe
function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32', 'utf8').slice(0, 32)
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encrypted = parts.join(':')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// GET - Obtener configuración de Stripe
export async function GET(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    
    const settings = await prisma.companySettings.findUnique({
      where: { companyId: company.id }
    })

    if (!settings) {
      return NextResponse.json({ 
        enabled: false,
        secretKey: "",
        publishableKey: ""
      })
    }

    // Desencriptar la secret key si existe
    const secretKey = settings.stripeSecretKey 
      ? decrypt(settings.stripeSecretKey)
      : ""

    return NextResponse.json({
      enabled: settings.stripeEnabled || false,
      secretKey,
      publishableKey: settings.stripePublishableKey || ""
    })
  } catch (error) {
    console.error("Error fetching Stripe config:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración de Stripe" },
      { status: 500 }
    )
  }
}

// POST - Guardar configuración de Stripe
export async function POST(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    const body = await req.json()

    const { secretKey, publishableKey, enabled } = body

    // Validar que las keys tengan el formato correcto
    if (secretKey && !secretKey.startsWith('sk_')) {
      return NextResponse.json(
        { error: "Secret Key debe comenzar con 'sk_'" },
        { status: 400 }
      )
    }

    if (publishableKey && !publishableKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: "Publishable Key debe comenzar con 'pk_'" },
        { status: 400 }
      )
    }

    // Encriptar la secret key
    const encryptedSecretKey = secretKey ? encrypt(secretKey) : null

    // Actualizar o crear la configuración
    await prisma.companySettings.update({
      where: { companyId: company.id },
      data: {
        stripeEnabled: enabled || false,
        stripeSecretKey: encryptedSecretKey,
        stripePublishableKey: publishableKey || null
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Configuración de Stripe guardada exitosamente"
    })
  } catch (error) {
    console.error("Error saving Stripe config:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración de Stripe" },
      { status: 500 }
    )
  }
}





