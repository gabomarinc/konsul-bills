import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { getUserCompany } from "@/lib/company-utils"
import { generateId } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser?.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const pending = await prisma.pendingQuote.findFirst({
      where: { id, userId: authUser.userId }
    })

    if (!pending) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    if (pending.status !== "pending") {
      return NextResponse.json(
        { error: "Esta cotización ya fue procesada" },
        { status: 400 }
      )
    }

    const company = await getUserCompany(authUser.userId)
    if (!company) {
      return NextResponse.json(
        { error: "No se pudo obtener la empresa" },
        { status: 400 }
      )
    }

    const clientName = pending.clientName || pending.emailFrom || "Cliente Gmail"
    const client = await prisma.client.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: clientName
        }
      },
      update: {
        email: pending.clientEmail ?? undefined,
        updatedAt: new Date()
      },
      create: {
        id: generateId("client"),
        companyId: company.id,
        name: clientName,
        email: pending.clientEmail,
        updatedAt: new Date()
      }
    })

    const amount = pending.amount ?? 0
    const tax = pending.tax ?? 0
    const taxAmount = (amount * tax) / 100
    const total = amount + taxAmount
    const issueDate = pending.issueDate ? new Date(pending.issueDate) : new Date()
    const dueDate = pending.dueDate ? new Date(pending.dueDate) : null

    const quote = await prisma.quote.create({
      data: {
        id: generateId("quote"),
        companyId: company.id,
        clientId: client.id,
        title: pending.title || pending.emailSubject || "Cotización detectada",
        issueDate,
        dueDate,
        currency: pending.currency || "EUR",
        tax,
        status: "DRAFT",
        notes: pending.description,
        subtotal: amount,
        taxAmount,
        total,
        createdById: authUser.userId,
        updatedAt: new Date()
      }
    })

    await prisma.pendingQuote.update({
      where: { id: pending.id },
      data: {
        status: "approved",
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, quoteId: quote.id })
  } catch (error) {
    console.error("Error aprobando cotización detectada:", error)
    return NextResponse.json(
      { error: "No se pudo crear la cotización" },
      { status: 500 }
    )
  }
}

