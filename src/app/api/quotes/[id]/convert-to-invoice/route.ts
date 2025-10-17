import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nextHumanId } from "@/lib/ids"
import { nanoid } from "nanoid"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: quoteId } = await context.params

    // Obtener la cotización
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, companyId: company.id },
      include: { QuoteItem: true, Client: true },
    })

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    // Verificar que la cotización esté aceptada
    if (quote.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Quote must be accepted before converting to invoice" },
        { status: 400 }
      )
    }

    // Obtener los settings de la compañía para el prefix y padding
    const settings = await prisma.companySettings.findUnique({
      where: { companyId: company.id },
    })

    // Generar ID legible para humanos
    const invoiceId = await nextHumanId({
      companyId: company.id,
      type: "INVOICE",
      prefix: settings?.invoicePrefix ?? "INV-",
      padding: settings?.numberPadding ?? 5,
    })

    // Crear la factura basada en la cotización
    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        companyId: company.id,
        clientId: quote.clientId,
        quoteId: quote.id,
        title: quote.title,
        issueDate: quote.issueDate,
        dueDate: quote.dueDate || new Date(),
        currency: quote.currency,
        tax: quote.tax,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        total: quote.total,
        balanceDue: quote.total,
        notes: quote.notes,
        status: "DRAFT",
        updatedAt: new Date(),
        InvoiceItem: {
          create: quote.QuoteItem.map((item) => ({
            id: `item_${nanoid(16)}`,
            description: item.description,
            qty: item.qty,
            price: item.price,
          })),
        },
      },
    })

    // Opcional: Actualizar el estado de la cotización o agregar una referencia
    // await prisma.quote.update({
    //   where: { id: quoteId },
    //   data: { /* agregar campo invoiceId si existe */ }
    // })

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      message: "Quote successfully converted to invoice",
    })
  } catch (error) {
    console.error("Error converting quote to invoice:", error)
    return NextResponse.json(
      { error: "Failed to convert quote to invoice" },
      { status: 500 }
    )
  }
}

