import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import InvoiceForm from "@/components/konsul/InvoiceForm"
import type { InvoiceDraft } from "@/components/konsul/InvoiceForm"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { Client: true, InvoiceItem: true },
  })

  if (!invoice) return notFound()

  // Convertir los datos de la base de datos al formato que espera el formulario
  const initialData: InvoiceDraft = {
    id: invoice.id,
    client: invoice.Client.name,
    clientEmail: invoice.Client.email,
    title: invoice.title,
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
    currency: invoice.currency as "EUR" | "USD",
    tax: invoice.tax,
    items: invoice.InvoiceItem.map(item => ({
      description: item.description,
      qty: item.qty,
      price: item.price,
    })),
    notes: invoice.notes || "",
    status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "cancelled",
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Edit Invoice {invoice.id}</h2>
      <InvoiceForm initial={initialData} />
    </div>
  )
}

