import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

// Deshabilitar el body parser de Next.js para poder leer el raw body
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json(
        { error: "No stripe signature found" },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET no está configurado")
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      )
    }

    // Verificar la firma del webhook usando una instancia temporal de Stripe
    // Nota: Esto requiere que tengamos una API key global o manejemos múltiples secrets
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-12-18.acacia"
    })

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Error verifying webhook signature:", err)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("Invoice finalized:", invoice.id)
        break
      }

      case "invoice.sent": {
        const invoice = event.data.object as Stripe.Invoice
        console.log("Invoice sent:", invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
  try {
    const invoiceId = stripeInvoice.metadata?.invoice_id

    if (!invoiceId) {
      console.error("No invoice_id found in Stripe invoice metadata")
      return
    }

    // Actualizar el estado de la factura en nuestra BD
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        balanceDue: 0,
        stripePaymentId: stripeInvoice.payment_intent as string | null
      }
    })

    // Crear registro de pago
    if (stripeInvoice.amount_paid && stripeInvoice.amount_paid > 0) {
      await prisma.payment.create({
        data: {
          id: `payment_${Date.now()}`,
          invoiceId: updatedInvoice.id,
          date: new Date(),
          amount: stripeInvoice.amount_paid / 100, // Convertir de centavos a unidad
          method: "STRIPE",
          reference: stripeInvoice.id,
          notes: `Pago recibido vía Stripe - ${stripeInvoice.payment_intent || 'N/A'}`
        }
      })
    }

    console.log(`Invoice ${invoiceId} marked as PAID`)
  } catch (error) {
    console.error("Error handling payment succeeded:", error)
  }
}

async function handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  try {
    const invoiceId = stripeInvoice.metadata?.invoice_id

    if (!invoiceId) {
      console.error("No invoice_id found in Stripe invoice metadata")
      return
    }

    // Actualizar el estado de la factura
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "OVERDUE"
      }
    })

    console.log(`Invoice ${invoiceId} marked as OVERDUE due to payment failure`)
  } catch (error) {
    console.error("Error handling payment failed:", error)
  }
}

