import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { nanoid } from "nanoid"

/**
 * GET /api/recurring-invoices
 * Obtiene todas las facturas recurrentes de la compañía
 */
export async function GET(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recurringInvoices = await prisma.recurringInvoice.findMany({
      where: { companyId: company.id },
      include: {
        Client: true,
        RecurringItem: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const data = recurringInvoices.map(inv => ({
      id: inv.id,
      clientId: inv.clientId,
      clientName: inv.Client.name,
      clientEmail: inv.Client.email,
      title: inv.title,
      description: inv.description,
      frequency: inv.frequency,
      intervalValue: inv.intervalValue,
      dayOfMonth: inv.dayOfMonth,
      dayOfWeek: inv.dayOfWeek,
      startDate: inv.startDate.toISOString().slice(0, 10),
      endDate: inv.endDate ? inv.endDate.toISOString().slice(0, 10) : null,
      nextRunDate: inv.nextRunDate.toISOString().slice(0, 10),
      lastRunDate: inv.lastRunDate ? inv.lastRunDate.toISOString().slice(0, 10) : null,
      currency: inv.currency,
      tax: inv.tax,
      subtotal: inv.subtotal,
      total: inv.total,
      dueInDays: inv.dueInDays,
      isActive: inv.isActive,
      notes: inv.notes,
      items: inv.RecurringItem.map(item => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        price: item.price,
      })),
      createdAt: inv.createdAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching recurring invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch recurring invoices" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recurring-invoices
 * Crea una nueva factura recurrente
 */
export async function POST(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
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
    } = body

    // Validación básica
    if (!clientId || !title || !frequency || !startDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calcular subtotal, taxAmount y total
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
    const taxAmount = (subtotal * tax) / 100
    const total = subtotal + taxAmount

    // Determinar la primera fecha de ejecución
    const nextRunDate = new Date(startDate)
    nextRunDate.setHours(0, 0, 0, 0)

    // Crear la factura recurrente
    const recurringInvoice = await prisma.recurringInvoice.create({
      data: {
        id: `rec_${nanoid(16)}`,
        companyId: company.id,
        clientId,
        title,
        description: description || null,
        frequency,
        intervalValue: intervalValue || 1,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextRunDate,
        currency: currency || 'EUR',
        tax: tax || 21,
        subtotal,
        taxAmount,
        total,
        dueInDays: dueInDays || 30,
        notes: notes || null,
        isActive: true,
        updatedAt: new Date(),
        RecurringItem: {
          create: items.map((item: any) => ({
            id: `recitem_${nanoid(16)}`,
            description: item.description,
            qty: item.qty,
            price: item.price,
          })),
        },
      },
      include: {
        Client: true,
        RecurringItem: true,
      },
    })

    return NextResponse.json({
      success: true,
      id: recurringInvoice.id,
      message: "Recurring invoice created successfully",
    })
  } catch (error) {
    console.error("Error creating recurring invoice:", error)
    return NextResponse.json(
      { error: "Failed to create recurring invoice" },
      { status: 500 }
    )
  }
}

