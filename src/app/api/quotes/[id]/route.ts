import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

// Tipos mínimos (independientes de versión)
type DbQuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
type ItemInput = { description: string; qty: number; price: number }

function calc(items: ItemInput[], tax: number) {
  const subtotal = items.reduce((a, it) => a + it.qty * it.price, 0)
  const taxAmount = (subtotal * tax) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100
  return { subtotal, taxAmount, total }
}

function parseDateInput(v: unknown): Date | undefined | null {
  if (v === undefined) return undefined
  if (v === null || v === "") return null
  const s = String(v).trim()
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`)
  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number)
    return new Date(Date.UTC(y, m - 1, d))
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? undefined : d
}

function normCurrency(v: unknown): "EUR" | "USD" {
  const s = String(v ?? "EUR").toUpperCase()
  if (s.startsWith("USD")) return "USD"
  return "EUR"
}

// ---------- GET ----------
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getUserCompanyFromRequest(req)
  
  // ✅ SEGURIDAD: Solo permitir acceso a quotes de la empresa del usuario
  const q = await prisma.quote.findFirst({
    where: { 
      id: id,
      companyId: company.id // ← Filtrado de seguridad
    },
    include: { Client: true, QuoteItem: true },
  })
  
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(q)
}

// ---------- PUT ----------
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const company = await getUserCompanyFromRequest(req)

    // ✅ SEGURIDAD: Verificar que la quote pertenece a la empresa del usuario
    const existingQuote = await prisma.quote.findFirst({
      where: { 
        id: id,
        companyId: company.id // ← Filtrado de seguridad
      },
      include: { Client: true },
    })

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    // Actualizar o crear el cliente si es necesario
    let clientId = existingQuote.clientId
    if (body.client && body.client !== existingQuote.Client.name) {
      const client = await prisma.client.upsert({
        where: { companyId_name: { companyId: company.id, name: body.client } },
        update: { email: body.clientEmail },
        create: { 
          id: `client_${nanoid(16)}`,
          companyId: company.id, 
          name: body.client, 
          email: body.clientEmail,
          updatedAt: new Date()
        },
      })
      clientId = client.id
    }

    const items: ItemInput[] = (body.items ?? []).map((i: { description?: string; qty?: number; price?: number }) => ({
      description: String(i.description ?? ""),
      qty: Number(i.qty ?? 0),
      price: Number(i.price ?? 0),
    }))

    const tax = Number(body.tax ?? 21)
    const { subtotal, taxAmount, total } = calc(items, tax)
    const status: DbQuoteStatus = String(body.status ?? "DRAFT").toUpperCase() as DbQuoteStatus

    const issueDate = parseDateInput(body.issueDate)
    const dueDate = parseDateInput(body.dueDate)
    const currency = normCurrency(body.currency)

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.quote.update({
        where: { id: id },
        data: {
          clientId,
          title: String(body.title ?? ""),
          issueDate: issueDate === undefined ? undefined : (issueDate as Date),
          dueDate: dueDate === undefined ? undefined : (dueDate as Date | null),
          currency,
          tax,
          status,
          notes: body.notes ?? null,
          subtotal,
          taxAmount,
          total,
          updatedAt: new Date(),
        },
      })

      // Reemplazo de líneas: borro todas y creo nuevamente
      await tx.quoteItem.deleteMany({ where: { quoteId: id } })
      if (items.length > 0) {
        for (const it of items) {
          await tx.quoteItem.create({
            data: {
              id: `item_${nanoid(16)}`,
              ...it,
              quoteId: id
            },
          })
        }
      }
      return up
    })

    return NextResponse.json({ id: updated.id }, { status: 200 })
  } catch (err: unknown) {
    console.error("PUT /api/quotes/[id] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save quote" },
      { status: 500 }
    )
  }
}

// ---------- DELETE ----------
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getUserCompanyFromRequest(req)
  
  // ✅ SEGURIDAD: Verificar que la quote pertenece a la empresa del usuario
  const existingQuote = await prisma.quote.findFirst({
    where: { 
      id: id,
      companyId: company.id // ← Filtrado de seguridad
    },
  })
  
  if (!existingQuote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 })
  }
  
  await prisma.quote.delete({ where: { id: id } })
  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const company = await getUserCompanyFromRequest(req)
    const body = await req.json().catch(() => ({}))
    const raw = String(body.status ?? "").toUpperCase()

    const allowed = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"]
    if (!allowed.includes(raw)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // ✅ SEGURIDAD: Verificar que la quote pertenece a la empresa del usuario
    const existingQuote = await prisma.quote.findFirst({
      where: { 
        id: id,
        companyId: company.id // ← Filtrado de seguridad
      },
    })
    
    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    const updated = await prisma.quote.update({
      where: { id: id },
      data: { 
        status: raw as DbQuoteStatus,
        updatedAt: new Date()
      },
      select: { id: true, status: true },
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status.toLowerCase(),
    })
  } catch (e: unknown) {
    console.error("PATCH /api/quotes/[id] failed:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

