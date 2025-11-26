

import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import DeleteQuoteButton from "@/components/konsul/DeleteQuoteButton"
import ConvertToInvoiceButton from "@/components/konsul/ConvertToInvoiceButton"
import DownloadPDFButton from "@/components/konsul/DownloadPDFButton"
import QuoteActionsMenu from "@/components/konsul/QuoteActionsMenu"

export const dynamic = "force-dynamic"

function titleCase(s: string) {
  return s.slice(0,1).toUpperCase() + s.slice(1).toLowerCase()
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const q = await prisma.quote.findUnique({
    where: { id },
    include: { Client: true, QuoteItem: true },
  })
  if (!q) return notFound()

  const fmt = (n: number) => new Intl.NumberFormat("es-ES", {
    style: "currency", currency: (q.currency as "EUR" | "USD")
  }).format(n)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Quote {q.id}</h2>
          <Badge
            variant={q.status === "ACCEPTED" ? "default" : q.status === "REJECTED" ? "destructive" : "secondary"}
          >
            {titleCase(q.status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <ConvertToInvoiceButton quoteId={q.id} status={q.status} />
          <DownloadPDFButton type="quote" id={q.id} variant="default" />
          <QuoteActionsMenu quoteId={q.id} />
          <Button asChild variant="ghost">
            <Link href="/quotes">Back</Link>
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-sm text-slate-500">Client</div>
          <div className="font-medium">{q.Client.name}</div>
          {q.Client.email && <div className="text-sm text-slate-500">{q.Client.email}</div>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-slate-500">Issue date</div><div className="font-medium">{q.issueDate.toISOString().slice(0,10)}</div></div>
          <div><div className="text-slate-500">Due date</div><div className="font-medium">{q.dueDate ? q.dueDate.toISOString().slice(0,10) : "—"}</div></div>
          <div><div className="text-slate-500">Currency</div><div className="font-medium">{q.currency}</div></div>
          <div><div className="text-slate-500">Tax</div><div className="font-medium">{q.tax}%</div></div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm text-slate-500 mb-1">Title</div>
          <div className="font-medium">{q.title}</div>
        </div>
        {q.notes && (
          <div className="md:col-span-2">
            <div className="text-sm text-slate-500 mb-1">Notes</div>
            <div className="text-sm">{q.notes}</div>
          </div>
        )}
      </Card>

      {/* Items */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Qty</TableHead>
              <TableHead className="w-[160px]">Price</TableHead>
              <TableHead className="w-[160px] text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.QuoteItem.map((it: { id: string; description: string; qty: number; price: number }) => (
              <TableRow key={it.id}>
                <TableCell>{it.description}</TableCell>
                <TableCell>{it.qty}</TableCell>
                <TableCell>{fmt(it.price)}</TableCell>
                <TableCell className="text-right">{fmt(it.qty * it.price)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
              <TableCell className="text-right">{fmt(q.subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">Tax ({q.tax}%)</TableCell>
              <TableCell className="text-right">{fmt(q.taxAmount)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">{fmt(q.total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
