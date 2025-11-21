import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { getUserCompany } from "@/lib/company-utils"
import { generateId } from "@/lib/db"

// GET - Obtener datos del perfil
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    
    if (!authUser?.userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Obtener empresa y configuración
    const company = await getUserCompany(authUser.userId)
    const settings = company?.CompanySettings

    // Separar nombre en firstName y lastName si existe
    const nameParts = user.name?.split(' ') || []
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(' ') || ""

    return NextResponse.json({
      firstName,
      lastName,
      email: user.email,
      companyName: company?.name || "",
      phone: settings?.phone || "",
      timezone: settings?.timezone || "Europe/Madrid"
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del perfil" },
      { status: 500 }
    )
  }
}

// POST - Actualizar perfil
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    
    if (!authUser?.userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { firstName, lastName, email, companyName, phone, timezone } = body

    // Validaciones básicas
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      )
    }

    // Combinar firstName y lastName
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || null

    // Obtener empresa del usuario
    const company = await getUserCompany(authUser.userId)
    
    if (!company) {
      return NextResponse.json(
        { error: "No se pudo obtener la empresa del usuario" },
        { status: 500 }
      )
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        name: fullName,
        email: email,
        updatedAt: new Date()
      }
    })

    // Actualizar nombre de la empresa si se proporciona
    if (companyName) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          name: companyName,
          updatedAt: new Date()
        }
      })
    }

    // Actualizar o crear CompanySettings
    const settingsData: any = {
      updatedAt: new Date()
    }

    if (phone !== undefined) {
      settingsData.phone = phone || null
    }

    if (timezone !== undefined) {
      settingsData.timezone = timezone || "Europe/Madrid"
    }

    await prisma.companySettings.upsert({
      where: { companyId: company.id },
      update: settingsData,
      create: {
        id: generateId('settings'),
        companyId: company.id,
        phone: phone || null,
        timezone: timezone || "Europe/Madrid",
        defaultCurrency: "EUR",
        defaultTaxRate: 21,
        locale: "es-ES",
        quotePrefix: "Q-",
        invoicePrefix: "INV-",
        numberPadding: 5
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Perfil actualizado exitosamente"
    })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    })
    
    // Manejar error de email duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: "Este email ya está en uso" },
        { status: 400 }
      )
    }

    // Retornar mensaje de error más específico si está disponible
    const errorMessage = error.message || "Error al actualizar perfil"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

