
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nanoid } from "nanoid"

export const dynamic = "force-dynamic"

// GET /api/invoices/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const company = await getUserCompanyFromRequest(req)
  
  // ✅ SEGURIDAD: Usar findFirst para filtrar por companyId
  const invoice = await prisma.invoice.findFirst({
    where: { 
      id: id,
      companyId: company.id // ← Filtrado de seguridad
    },
    include: { Client: true, InvoiceItem: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  return NextResponse.json(invoice)
}

// PUT /api/invoices/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const company = await getUserCompanyFromRequest(req)
    const body = await req.json()

    // ✅ SEGURIDAD: Usar findFirst para verificar ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: { 
        id: id,
        companyId: company.id // ← Filtrado de seguridad
      },
      include: { Client: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Actualizar o crear el cliente si es necesario
    let clientId = existingInvoice.clientId
    if (body.client && body.client !== existingInvoice.Client.name) {
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

    // Calcular totales
    const subtotal = body.items.reduce((acc: number, item: { qty: number; price: number }) => acc + (item.qty * item.price), 0)
    const taxAmount = (subtotal * body.tax) / 100
    const total = Math.round((subtotal + taxAmount) * 100) / 100
    const balanceDue = body.status === "paid" ? 0 : total

    // Actualizar usando transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Actualizar la factura
      const inv = await tx.invoice.update({
        where: { id: id },
        data: {
          clientId,
          title: body.title,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          currency: body.currency,
          tax: body.tax,
          status: body.status.toUpperCase(),
          notes: body.notes,
          subtotal,
          taxAmount,
          total,
          balanceDue,
          updatedAt: new Date(),
        },
      })

      // Actualizar items (eliminar existentes y crear nuevos)
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      })

      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          await tx.invoiceItem.create({
            data: {
              id: `item_${nanoid(16)}`,
              invoiceId: id,
              description: item.description,
              qty: item.qty,
              price: item.price,
            }
          })
        }
      }

      return inv
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ 
      error: "Failed to update invoice",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const company = await getUserCompanyFromRequest(req)

  // ✅ SEGURIDAD: Usar findFirst para verificar ownership
  const existingInvoice = await prisma.invoice.findFirst({
    where: { 
      id: id,
      companyId: company.id // ← Filtrado de seguridad
    },
  })

  if (!existingInvoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  // Eliminar la factura (los items se eliminan en cascada)
  await prisma.invoice.delete({
    where: { id: id },
  })

  return NextResponse.json({ success: true })
}

// PATCH /api/invoices/[id] - Para actualizaciones rápidas del estado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const company = await getUserCompanyFromRequest(req)
    const body = await req.json()

    // ✅ SEGURIDAD: Usar findFirst para verificar ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: { 
        id: id,
        companyId: company.id // ← Filtrado de seguridad
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Solo permitir actualización del estado para PATCH
    if (body.status) {
      const newStatus = body.status.toUpperCase()

      const updatedInvoice = await prisma.invoice.update({
        where: { id: id },
        data: {
          status: newStatus,
          balanceDue: newStatus === "PAID" ? 0 : existingInvoice.total,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json(updatedInvoice)
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  } catch (error) {
    console.error("PATCH /api/invoices/[id] failed:", error)
    return NextResponse.json({ 
      error: "Failed to update invoice status",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
