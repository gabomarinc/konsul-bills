import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { generateId } from "@/lib/db"

// GET - Obtener configuración de negocio
export async function GET(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    const settings = company.CompanySettings

    if (!settings) {
      return NextResponse.json({
        businessAddress: "",
        taxId: "",
        defaultCurrency: "EUR",
        defaultTaxRate: 21,
        defaultPaymentTerms: "Net 30 días"
      })
    }

    // Construir dirección completa
    const addressParts = [
      settings.addressLine1,
      settings.addressLine2,
      settings.city,
      settings.state,
      settings.zip,
      settings.country
    ].filter(Boolean)
    
    const businessAddress = addressParts.join(", ") || ""

    return NextResponse.json({
      businessAddress,
      taxId: settings.taxId || "",
      defaultCurrency: settings.defaultCurrency || "EUR",
      defaultTaxRate: settings.defaultTaxRate || 21,
      defaultPaymentTerms: "Net 30 días" // Por ahora fijo, se puede agregar al schema después
    })
  } catch (error) {
    console.error("Error fetching business settings:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración de negocio" },
      { status: 500 }
    )
  }
}

// POST - Actualizar configuración de negocio
export async function POST(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    const body = await req.json()

    const { 
      businessAddress, 
      taxId, 
      defaultCurrency, 
      defaultTaxRate, 
      defaultPaymentTerms 
    } = body

    // Parsear dirección de negocio
    // Formato esperado: "123 Business St, Suite 100, New York, NY 10001"
    // Intentamos parsear de forma simple
    let addressLine1 = ""
    let addressLine2 = ""
    let city = ""
    let state = ""
    let zip = ""
    let country = ""

    if (businessAddress) {
      const parts = businessAddress.split(',').map((p: string) => p.trim())
      
      if (parts.length >= 1) addressLine1 = parts[0]
      if (parts.length >= 2) addressLine2 = parts[1]
      if (parts.length >= 3) city = parts[2]
      
      // El último elemento puede tener estado y código postal
      if (parts.length >= 4) {
        const lastPart = parts[parts.length - 1]
        // Intentar extraer estado y zip (formato: "NY 10001" o "New York, NY 10001")
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/)
        if (stateZipMatch) {
          state = stateZipMatch[1]
          zip = stateZipMatch[2]
        } else {
          state = lastPart
        }
      }
    }

    // Preparar datos para actualizar
    const settingsData: any = {
      taxId: taxId || null,
      defaultCurrency: defaultCurrency || "EUR",
      defaultTaxRate: defaultTaxRate !== undefined && defaultTaxRate !== null ? parseFloat(defaultTaxRate) : 21,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      country: country || null
    }

    // Actualizar o crear CompanySettings
    await prisma.companySettings.upsert({
      where: { companyId: company.id },
      update: settingsData,
      create: {
        id: generateId('settings'),
        companyId: company.id,
        ...settingsData,
        locale: "es-ES",
        timezone: "Europe/Madrid",
        quotePrefix: "Q-",
        invoicePrefix: "INV-",
        numberPadding: 5
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Configuración de negocio guardada exitosamente"
    })
  } catch (error) {
    console.error("Error updating business settings:", error)
    return NextResponse.json(
      { error: "Error al guardar configuración de negocio" },
      { status: 500 }
    )
  }
}

