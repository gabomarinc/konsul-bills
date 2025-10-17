import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nanoid } from "nanoid"

/**
 * GET /api/recurring-invoices/[id]
 * Obtiene una factura recurrente específica
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const recurringInvoice = await prisma.recurringInvoice.findUnique({
      where: { id, companyId: company.id },
      include: {
        Client: true,
        RecurringItem: true,
      },
    })

    if (!recurringInvoice) {
      return NextResponse.json(
        { error: "Recurring invoice not found" },
        { status: 404 }
      )
    }

    const data = {
      id: recurringInvoice.id,
      clientId: recurringInvoice.clientId,
      clientName: recurringInvoice.Client.name,
      clientEmail: recurringInvoice.Client.email,
      title: recurringInvoice.title,
      description: recurringInvoice.description,
      frequency: recurringInvoice.frequency,
      intervalValue: recurringInvoice.intervalValue,
      dayOfMonth: recurringInvoice.dayOfMonth,
      dayOfWeek: recurringInvoice.dayOfWeek,
      startDate: recurringInvoice.startDate.toISOString().slice(0, 10),
      endDate: recurringInvoice.endDate ? recurringInvoice.endDate.toISOString().slice(0, 10) : null,
      nextRunDate: recurringInvoice.nextRunDate.toISOString().slice(0, 10),
      lastRunDate: recurringInvoice.lastRunDate ? recurringInvoice.lastRunDate.toISOString().slice(0, 10) : null,
      currency: recurringInvoice.currency,
      tax: recurringInvoice.tax,
      subtotal: recurringInvoice.subtotal,
      total: recurringInvoice.total,
      dueInDays: recurringInvoice.dueInDays,
      isActive: recurringInvoice.isActive,
      notes: recurringInvoice.notes,
      items: recurringInvoice.RecurringItem.map(item => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        price: item.price,
      })),
      createdAt: recurringInvoice.createdAt.toISOString(),
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching recurring invoice:", error)
    return NextResponse.json(
      { error: "Failed to fetch recurring invoice" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/recurring-invoices/[id]
 * Actualiza una factura recurrente
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    // Verificar que existe y pertenece a la compañía
    const existing = await prisma.recurringInvoice.findUnique({
      where: { id, companyId: company.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Recurring invoice not found" },
        { status: 404 }
      )
    }

    // Si solo se envía isActive (toggle pause/resume)
    if (Object.keys(body).length === 1 && 'isActive' in body) {
      await prisma.recurringInvoice.update({
        where: { id },
        data: {
          isActive: body.isActive,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({
        success: true,
        message: "Recurring invoice updated successfully",
      })
    }

    // Actualización completa
    const {
      clientId,
      title,
      description,
      frequency,
      intervalValue,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
      currency,
      tax,
      dueInDays,
      items,
      notes,
      isActive,
    } = body

    // Calcular subtotal, taxAmount y total
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
    const taxAmount = (subtotal * tax) / 100
    const total = subtotal + taxAmount

    // Actualizar la factura recurrente
    await prisma.recurringInvoice.update({
      where: { id },
      data: {
        clientId,
        title,
        description: description || null,
        frequency,
        intervalValue: intervalValue || 1,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        currency: currency || 'EUR',
        tax: tax || 21,
        subtotal,
        taxAmount,
        total,
        dueInDays: dueInDays || 30,
        notes: notes || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    })

    // Eliminar items antiguos y crear nuevos
    await prisma.recurringInvoiceItem.deleteMany({
      where: { recurringInvoiceId: id },
    })

    await prisma.recurringInvoiceItem.createMany({
      data: items.map((item: any) => ({
        id: `recitem_${nanoid(16)}`,
        recurringInvoiceId: id,
        description: item.description,
        qty: item.qty,
        price: item.price,
      })),
    })

    return NextResponse.json({
      success: true,
      message: "Recurring invoice updated successfully",
    })
  } catch (error) {
    console.error("Error updating recurring invoice:", error)
    return NextResponse.json(
      { error: "Failed to update recurring invoice" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recurring-invoices/[id]
 * Elimina una factura recurrente
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Verificar que existe y pertenece a la compañía
    const existing = await prisma.recurringInvoice.findUnique({
      where: { id, companyId: company.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Recurring invoice not found" },
        { status: 404 }
      )
    }

    // Eliminar la factura recurrente (los items se eliminan en cascada)
    await prisma.recurringInvoice.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Recurring invoice deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting recurring invoice:", error)
    return NextResponse.json(
      { error: "Failed to delete recurring invoice" },
      { status: 500 }
    )
  }
}

