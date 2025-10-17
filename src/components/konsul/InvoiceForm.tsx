"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/contexts/LanguageContext"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import AIPromptDialog from "@/components/konsul/AIPromptDialog"
import type { AIParsed } from "@/components/konsul/AIPromptDialog"

type Item = { description: string; qty: number; price: number }
export type InvoiceDraft = {
  id?: string
  client: string
  clientEmail?: string | null
  title: string
  issueDate: string
  dueDate: string
  currency: "EUR" | "USD"
  tax: number
  items: Item[]
  notes?: string
  status?: "draft" | "sent" | "paid" | "overdue" | "cancelled"
}

const money = (n: number, c: "EUR" | "USD") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: c }).format(n)

export default function InvoiceForm({ initial }: { initial?: InvoiceDraft }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<InvoiceDraft>(
    initial ?? {
      client: "",
      clientEmail: "",
      title: "",
      issueDate: "",
      dueDate: "",
      currency: "EUR",
      tax: 21,
      items: [{ description: "", qty: 1, price: 0 }],
      notes: "",
      status: "draft",
    }
  )

  // Actualizar el formulario cuando cambie el initial (para edición)
  useEffect(() => {
    if (initial) {
      console.log("InvoiceForm - Initial data received:", initial)
      setForm(initial)
    }
  }, [initial])

  const subtotal = useMemo(
    () => form.items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [form.items]
  )
  const taxAmount = useMemo(() => (subtotal * (Number(form.tax) || 0)) / 100, [subtotal, form.tax])
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount])

  const setField = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const setItem = (idx: number, patch: Partial<Item>) =>
    setForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }))
  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: "", qty: 1, price: 0 }] }))
  const removeItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))

  function applyAI(data: AIParsed) {
    setForm(prev => ({
      ...prev,
      client: data.clientName || prev.client,
      clientEmail: data.clientEmail ?? prev.clientEmail ?? "",
      title: data.title || prev.title,
      issueDate: data.issueDate || prev.issueDate,
      dueDate: data.dueDate || prev.dueDate,
      currency: (data.currency as "EUR" | "USD") || prev.currency,
      tax: typeof data.tax === "number" ? data.tax : prev.tax,
      notes: data.notes ?? prev.notes,
      items: data.items?.length
        ? data.items.map(i => ({ description: i.description, qty: Number(i.qty), price: Number(i.price) }))
        : prev.items,
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (isSaving) return // Prevenir múltiples clicks
    
    try {
      if (!form.client || !form.title) {
        toast.error("Client and Title are required")
        return
      }

      setIsSaving(true)

      const payload = {
        id: form.id || undefined,
        client: form.client,
        clientEmail: form.clientEmail || null,
        title: form.title,
        issueDate: form.issueDate,
        dueDate: form.dueDate || null,
        currency: form.currency,
        tax: Number(form.tax ?? 0),
        notes: form.notes || null,
        items: (form.items || []).map(it => ({
          description: it.description || "",
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0,
        })),
        status: form.status || "draft",
      }

      const url = form.id ? `/api/invoices/${form.id}` : "/api/invoices"
      const method = form.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const ct = response.headers.get("content-type") || ""
        let errorMessage = "Error saving invoice"
        
        try {
          const err = ct.includes("application/json")
            ? await response.json()
            : { error: await response.text() }
          errorMessage = err.error || err.message || errorMessage
        } catch (parseError) {
          console.error("Error parsing response:", parseError)
        }
        
        console.error("Save invoice failed:", { 
          url, 
          method, 
          status: response.status,
          statusText: response.statusText,
          errorMessage
        })
        toast.error(errorMessage)
        return
      }

      const result = await response.json()
      const id = form.id || result.id
      
      if (!id) {
        throw new Error("No ID returned from server")
      }
      
      toast.success(form.id ? "Invoice updated" : "Invoice created")
      router.push(`/invoices/${id}`)
    } catch (error) {
      console.error("Unexpected error saving invoice:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* AI Prompt */}
      <div className="flex justify-end">
        <AIPromptDialog onApply={applyAI} />
      </div>

      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Client *</label>
            <Input
              value={form.client}
              onChange={(e) => setField("client", e.target.value)}
              placeholder="Client name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client Email</label>
            <Input
              type="email"
              value={form.clientEmail || ""}
              onChange={(e) => setField("clientEmail", e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Invoice title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={form.status || "draft"}
              onChange={(e) => setField("status", e.target.value as "draft" | "sent" | "paid" | "overdue")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Issue Date *</label>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) => setField("issueDate", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value as "EUR" | "USD")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
            <Input
              type="number"
              value={form.tax}
              onChange={(e) => setField("tax", Number(e.target.value))}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Add Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={item.description}
                  onChange={(e) => setItem(idx, { description: e.target.value })}
                  placeholder="Item description"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Qty</label>
                <Input
                  type="number"
                  value={item.qty}
                  onChange={(e) => setItem(idx, { qty: Number(e.target.value) })}
                  min="0"
                  step="1"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => setItem(idx, { price: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-2">Total</label>
                <div className="h-10 flex items-center px-3 text-sm font-mono">
                  {money(item.qty * item.price, form.currency)}
                </div>
              </div>
              <div className="col-span-1">
                {form.items.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    className="w-full h-10"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-2 text-right">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal:</span>
            <span className="font-mono">{money(subtotal, form.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax ({form.tax}%):</span>
            <span className="font-mono">{money(taxAmount, form.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span className="font-mono">{money(total, form.currency)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notes</h3>
        <textarea
          value={form.notes || ""}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Additional notes..."
          className="w-full h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-none"
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.common.creating}
            </>
          ) : (
            form.id ? "Update Invoice" : t.common.create
          )}
        </Button>
      </div>
    </form>
  )
}
