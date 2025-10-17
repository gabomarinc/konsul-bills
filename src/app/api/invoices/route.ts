import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nextHumanId } from "@/lib/ids"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

function totals(items: { qty: number; price: number }[], tax: number) {
  const subtotal = items.reduce((a, it) => a + it.qty * it.price, 0)
  const taxAmount = (subtotal * tax) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  return { subtotal, taxAmount, total }
}

export async function GET(req: NextRequest) {
  try {
    const c = await getUserCompanyFromRequest(req)
    
    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100) // Máximo 100 items
    const skip = (page - 1) * limit

    // Obtener total de registros
    const total = await prisma.invoice.count({
      where: { companyId: c.id }
    })

    // Obtener registros paginados
    const invs = await prisma.invoice.findMany({
      where: { companyId: c.id },
      include: { Client: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const out = invs.map((inv) => ({
      id: inv.id,
      client: inv.Client.name,
      clientEmail: inv.Client.email,
      title: inv.title,
      issueDate: inv.issueDate.toISOString().slice(0, 10),
      dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
      currency: (inv.currency === "USD" ? "USD" : "EUR"),
      tax: inv.tax,
      total: inv.total,
      status: inv.status.toLowerCase(),
      createdAt: inv.createdAt.toISOString(),
    }))

    return NextResponse.json({
      data: out,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const c = await getUserCompanyFromRequest(req)
  const settings = await prisma.companySettings.findUnique({ where: { companyId: c.id } })
  const body = await req.json()

  // cliente (usa clientId o crea/actualiza por nombre)
  let clientId: string
  if (body.clientId) clientId = String(body.clientId)
  else {
    const name = String(body.client ?? "Cliente")
    const email = body.clientEmail ? String(body.clientEmail) : undefined
    const client = await prisma.client.upsert({
      where: { companyId_name: { companyId: c.id, name } },
      update: { email },
      create: { 
        id: `client_${nanoid(16)}`,
        companyId: c.id, 
        name, 
        email,
        updatedAt: new Date()
      },
    })
    clientId = client.id
  }

  const items = (body.items ?? []).map((it: { description?: string; qty?: number; price?: number }) => ({
    description: String(it.description ?? ""),
    qty: Number(it.qty ?? 0),
    price: Number(it.price ?? 0),
  }))
  const tax = Number(body.tax ?? settings?.defaultTaxRate ?? 21)
  const { subtotal, taxAmount, total } = totals(items, tax)

  const id = await nextHumanId({
    companyId: c.id,
    type: "INVOICE",
    prefix: settings?.invoicePrefix ?? "INV-",
    padding: settings?.numberPadding ?? 5,
  })

  const inv = await prisma.invoice.create({
    data: {
      id,
      companyId: c.id,
      clientId,
      quoteId: body.quoteId ?? null,
      title: String(body.title ?? "Invoice"),
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      currency: String(body.currency ?? settings?.defaultCurrency ?? "EUR"),
      tax,
      status: body.status?.toUpperCase() || "DRAFT",
      notes: body.notes ?? null,
      subtotal, taxAmount, total,
      balanceDue: total,
      updatedAt: new Date(),
      InvoiceItem: { create: items.map((item: { description: string; qty: number; price: number }) => ({
        id: `item_${nanoid(16)}`,
        ...item
      })) },
    },
  })

  return NextResponse.json({ id: inv.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
