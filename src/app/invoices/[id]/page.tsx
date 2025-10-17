import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import DeleteInvoiceButton from "@/components/konsul/DeleteInvoiceButton"
import StripePaymentButton from "@/components/konsul/StripePaymentButton"
import { isStripeEnabled } from "@/lib/stripe"

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { Client: true, InvoiceItem: true },
  })
  if (!inv) return notFound()

  // Verificar si Stripe está configurado
  const stripeConnected = await isStripeEnabled(inv.companyId)

  const fmt = (n: number) => new Intl.NumberFormat("es-ES", {
    style: "currency", currency: (inv.currency as "EUR" | "USD")
  }).format(n)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Invoice {inv.id}</h2>
          <Badge
            variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"}
          >
            {titleCase(inv.status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <StripePaymentButton 
            invoiceId={inv.id} 
            isStripeConnected={stripeConnected}
          />
          <Button asChild variant="secondary">
            <Link href={`/invoices/${inv.id}/edit`}>Edit</Link>
          </Button>
          <DeleteInvoiceButton id={inv.id} />
          <Button asChild variant="ghost">
            <Link href="/invoices">Back</Link>
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Client</h3>
          <p className="text-slate-600">{inv.Client.name}</p>
          {inv.Client.email && (
            <p className="text-slate-500 text-sm">{inv.Client.email}</p>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Invoice Details</h3>
          <p className="text-slate-600">Issue Date: {inv.issueDate.toLocaleDateString()}</p>
          {inv.dueDate && (
            <p className="text-slate-600">Due Date: {inv.dueDate.toLocaleDateString()}</p>
          )}
          <p className="text-slate-600">Currency: {inv.currency}</p>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Items</h3>
        <div className="space-y-3">
          {inv.InvoiceItem.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="flex-1">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-slate-500">
                  {item.qty} × {fmt(item.price)}
                </p>
              </div>
              <p className="font-mono">{fmt(item.qty * item.price)}</p>
            </div>
          ))}
        </div>
        
        {/* Totals */}
        <div className="mt-6 space-y-2 text-right">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-mono">{fmt(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax ({inv.tax}%):</span>
            <span className="font-mono">{fmt(inv.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span className="font-mono">{fmt(inv.total)}</span>
          </div>
          {inv.balanceDue !== inv.total && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Balance Due:</span>
              <span className="font-mono">{fmt(inv.balanceDue)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      {inv.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-slate-600 whitespace-pre-wrap">{inv.notes}</p>
        </Card>
      )}
    </div>
  )
}

