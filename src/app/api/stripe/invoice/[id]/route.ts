import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import { getStripeClient } from "@/lib/stripe"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const company = await getUserCompanyFromRequest(req)

    // Obtener la factura
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: invoiceId,
        companyId: company.id 
      },
      include: {
        Client: true,
        InvoiceItem: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si ya fue enviada a Stripe
    if (invoice.stripeInvoiceId) {
      // Obtener la URL del invoice de Stripe
      const stripe = await getStripeClient(company.id)
      if (!stripe) {
        return NextResponse.json(
          { error: "Stripe no está configurado" },
          { status: 400 }
        )
      }

      const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceId)
      
      return NextResponse.json({
        message: "Esta factura ya fue enviada a Stripe",
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
        stripeInvoiceId: invoice.stripeInvoiceId
      })
    }

    // Inicializar cliente de Stripe
    const stripe = await getStripeClient(company.id)
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe no está configurado. Por favor configúralo en Settings." },
        { status: 400 }
      )
    }

    // Crear o buscar el cliente en Stripe
    let stripeCustomerId: string
    
    // Buscar si el cliente ya existe en Stripe (por email)
    if (invoice.Client.email) {
      const existingCustomers = await stripe.customers.list({
        email: invoice.Client.email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id
      } else {
        // Crear nuevo cliente en Stripe
        const customer = await stripe.customers.create({
          email: invoice.Client.email,
          name: invoice.Client.name,
          metadata: {
            client_id: invoice.Client.id
          }
        })
        stripeCustomerId = customer.id
      }
    } else {
      // Crear cliente sin email
      const customer = await stripe.customers.create({
        name: invoice.Client.name,
        metadata: {
          client_id: invoice.Client.id
        }
      })
      stripeCustomerId = customer.id
    }

    // Crear la factura en Stripe
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: invoice.dueDate 
        ? Math.max(1, Math.ceil((invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 30,
      currency: invoice.currency.toLowerCase(),
      metadata: {
        invoice_id: invoice.id,
        company_id: company.id
      },
      description: invoice.title || `Invoice ${invoice.id}`
    })

    // Agregar los items a la factura
    for (const item of invoice.InvoiceItem) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        amount: Math.round(item.qty * item.price * 100), // Stripe usa centavos
        currency: invoice.currency.toLowerCase(),
        description: item.description
      })
    }

    // Agregar impuestos si es necesario
    if (invoice.tax > 0) {
      // Crear o buscar una tasa de impuestos
      const taxRate = await stripe.taxRates.create({
        display_name: `Tax ${invoice.tax}%`,
        percentage: invoice.tax,
        inclusive: false
      })

      await stripe.invoices.update(stripeInvoice.id, {
        default_tax_rates: [taxRate.id]
      })
    }

    // Finalizar la factura
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id)

    // Enviar la factura por email (si el cliente tiene email)
    if (invoice.Client.email) {
      await stripe.invoices.sendInvoice(finalizedInvoice.id)
    }

    // Actualizar la factura en nuestra BD con el ID de Stripe
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripeInvoiceId: finalizedInvoice.id,
        status: "SENT"
      }
    })

    return NextResponse.json({
      success: true,
      message: "Factura enviada a Stripe exitosamente",
      stripeInvoiceId: finalizedInvoice.id,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url
    })
  } catch (error: unknown) {
    console.error("Error sending invoice to Stripe:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    
    return NextResponse.json(
      { error: `Error al enviar factura a Stripe: ${errorMessage}` },
      { status: 500 }
    )
  }
}







