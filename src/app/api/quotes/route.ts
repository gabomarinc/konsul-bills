import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nextHumanId } from "@/lib/ids"
import { nanoid } from "nanoid"

// Tipos mínimos agnósticos de Prisma
type DbQuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"

type QuoteWithClient = {
  id: string
  title: string
  issueDate: Date
  currency: string
  tax: number
  total: number
  status: DbQuoteStatus
  createdAt: Date
  Client: { name: string; email: string | null }
}

type QuoteListItem = {
  id: string
  client: string
  clientEmail?: string | null
  title: string
  issueDate: string
  dueDate: string | null
  currency: "EUR" | "USD"
  tax: number
  total: number
  status: "draft" | "sent" | "accepted" | "rejected"
  createdAt: string
}

export const dynamic = "force-dynamic"

const toUiStatus = (s: DbQuoteStatus): QuoteListItem["status"] =>
  s === "ACCEPTED" ? "accepted" :
  s === "REJECTED" ? "rejected" :
  s === "SENT"     ? "sent"     : "draft"

function totales(items: { qty: number; price: number }[], tax: number) {
  const subtotal = items.reduce((a, it) => a + it.qty * it.price, 0)
  const taxAmount = (subtotal * tax) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  return { subtotal, taxAmount, total }
}

// GET /api/quotes
export async function GET(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
  
  // Obtener parámetros de paginación
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100) // Máximo 100 items
  const skip = (page - 1) * limit

  // Obtener total de registros
  const total = await prisma.quote.count({
    where: { companyId: company.id }
  })

  // Obtener registros paginados
  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    include: { Client: true },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  }) as unknown as QuoteWithClient[]

  const out: QuoteListItem[] = quotes.map((q) => ({
    id: q.id,
    client: q.Client.name,
    clientEmail: q.Client.email,
    title: q.title,
    issueDate: q.issueDate.toISOString().slice(0, 10),
    dueDate: q.dueDate ? q.dueDate.toISOString().slice(0, 10) : null,
    currency: (q.currency === "USD" ? "USD" : "EUR"),
    tax: q.tax,
    total: q.total,
    status: toUiStatus(q.status),
    createdAt: q.createdAt.toISOString(),
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
    console.error("Error fetching quotes:", error)
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
  }
}

// POST /api/quotes
export async function POST(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    const settings = await prisma.companySettings.findUnique({ where: { companyId: company.id } })
    const body = await req.json()

    // Cliente
    let clientId: string
    if (body.clientId) {
      clientId = String(body.clientId)
    } else {
      const name = String(body.client ?? body.clientName ?? "Cliente")
      const email = body.clientEmail ? String(body.clientEmail) : undefined
      
      const client = await prisma.client.upsert({
        where: { companyId_name: { companyId: company.id, name } },
        update: { email },
        create: { 
          id: `client_${nanoid(16)}`,
          companyId: company.id, 
          name, 
          email,
          updatedAt: new Date()
        },
      })
      clientId = client.id
    }

    const items = (body.items ?? []).map((it: { description: string; qty: number; price: number }) => ({
      description: String(it.description ?? ""),
      qty: Number(it.qty ?? 0),
      price: Number(it.price ?? 0),
    }))
    
    const tax = Number(body.tax ?? settings?.defaultTaxRate ?? 21)
    const { subtotal, taxAmount, total } = totales(items, tax)

    const id = await nextHumanId({
      companyId: company.id,
      type: "QUOTE",
      prefix: settings?.quotePrefix ?? "Q-",
      padding: settings?.numberPadding ?? 5,
    })

    const statusDb: DbQuoteStatus = String(body.status ?? "DRAFT").toUpperCase() as DbQuoteStatus

    const q = await prisma.quote.create({
      data: {
        id,
        companyId: company.id,
        clientId,
        title: String(body.title ?? "Quote"),
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        currency: String(body.currency ?? settings?.defaultCurrency ?? "EUR"),
        tax,
        status: statusDb,
        notes: body.notes ?? null,
        subtotal, taxAmount, total,
        updatedAt: new Date(),
      },
      include: { Client: true },
    })

    // Crear los items de la cotización
    if (items.length > 0) {
      for (const item of items) {
        await prisma.quoteItem.create({
          data: {
            id: `item_${nanoid(16)}`,
            quoteId: q.id,
            description: item.description,
            qty: item.qty,
            price: item.price,
          },
        })
      }
    }

    return NextResponse.json({ id: q.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating quote:", error)
    return NextResponse.json(
      { error: "Error al crear cotización" },
      { status: 500 }
    )
  }
}
