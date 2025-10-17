import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import QuoteForm, { QuoteDraft } from "@/components/konsul/QuoteForm"

export const dynamic = "force-dynamic"

// Tipos locales para evitar 'any'
type DbQuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED"
type ItemShape = { description: string; qty: number; price: number }

const toUiStatus = (s: DbQuoteStatus): QuoteDraft["status"] =>
  s === "ACCEPTED" ? "accepted" :
  s === "REJECTED" ? "rejected" :
  s === "SENT"     ? "sent"     : "draft"

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const q = await prisma.quote.findUnique({
    where: { id },
    include: { Client: true, QuoteItem: true },
  })

  if (!q) return notFound()

  const initial: QuoteDraft = {
    id: q.id,
    client: q.Client.name,
    clientEmail: q.Client.email ?? "",
    title: q.title,
    issueDate: q.issueDate.toISOString().slice(0, 10),
    dueDate: q.dueDate ? q.dueDate.toISOString().slice(0, 10) : "",
    currency: (q.currency === "USD" ? "USD" : "EUR"),
    tax: q.tax,
    items: q.QuoteItem.map((i: ItemShape) => ({
      description: i.description,
      qty: i.qty,
      price: i.price,
    })),
    notes: q.notes ?? "",
    status: toUiStatus(q.status as DbQuoteStatus),
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Edit Quote {q.id}</h2>
      <QuoteForm initial={initial} />
    </div>
  )
}
