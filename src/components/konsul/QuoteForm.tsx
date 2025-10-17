"use client"

import { useMemo, useState } from "react"
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
export type QuoteDraft = {
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
  status?: "draft" | "sent" | "accepted" | "rejected"
}

const money = (n: number, c: "EUR" | "USD") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: c }).format(n)

export default function QuoteForm({ initial }: { initial?: QuoteDraft }) {
  const router = useRouter()
  const { t } = useTranslation()
  const isEdit = !!initial?.id
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<QuoteDraft>(
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

  const subtotal = useMemo(
    () => form.items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [form.items]
  )
  const taxAmount = useMemo(() => (subtotal * (Number(form.tax) || 0)) / 100, [subtotal, form.tax])
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount])

  const setField = <K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) =>
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
        toast.error(t.quotes.requiredFields)
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
          qty: Number(it.qty ?? 0),
          price: Number(it.price ?? 0),
        })),
        status: form.status ?? "draft",
        total,
      }

      const isEdit = Boolean(initial?.id)
      const url = isEdit ? `/api/quotes/${initial!.id}` : "/api/quotes"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const ct = res.headers.get("content-type") || ""
        let errorMessage = t.quotes.errorSaving
        
        try {
          const err = ct.includes("application/json")
            ? await res.json()
            : { error: await res.text() }
          errorMessage = err.error || err.message || errorMessage
        } catch (parseError) {
          console.error("Error parsing response:", parseError)
        }
        
        console.error("Save quote failed:", { 
          url, 
          method, 
          status: res.status,
          statusText: res.statusText,
          errorMessage
        })
        toast.error(errorMessage)
        return
      }

      const data = await res.json()
      const nextId = data?.id ?? initial?.id
      
      if (!nextId) {
        throw new Error(t.quotes.noIdReturned)
      }

      toast.success(isEdit ? t.quotes.updateSuccess : t.quotes.createSuccess)
      router.push(`/quotes/${nextId}`)
    } catch (error) {
      console.error("Unexpected error saving quote:", error)
      toast.error(t.quotes.unexpectedError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" role="form" aria-label={isEdit ? t.quotes.editQuote : t.quotes.newQuote}>
      {/* Botón IA grande con gradiente y badge NEW */}
      <div className="flex justify-end">
        <AIPromptDialog onApply={applyAI} triggerLabel={t.quotes.generateWithAI} triggerClassName="shadow-lg" />
      </div>

      {/* Datos generales */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="client" className="block text-sm text-slate-600">{t.quotes.client}</label>
            <Input id="client" value={form.client} onChange={e => setField("client", e.target.value)} placeholder={t.quotes.companyNamePlaceholder} aria-describedby="client-help" />
            <p id="client-help" className="text-xs text-gray-500">{t.quotes.clientHelp}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="clientEmail" className="block text-sm text-slate-600">{t.quotes.clientEmail}</label>
            <Input id="clientEmail" type="email" value={form.clientEmail ?? ""} onChange={e => setField("clientEmail", e.target.value)} placeholder={t.quotes.clientEmailPlaceholder} aria-describedby="clientEmail-help" />
            <p id="clientEmail-help" className="text-xs text-gray-500">{t.quotes.clientEmailHelp}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm text-slate-600">{t.quotes.title_field}</label>
            <Input id="title" value={form.title} onChange={e => setField("title", e.target.value)} placeholder={t.quotes.titlePlaceholder} aria-describedby="title-help" />
            <p id="title-help" className="text-xs text-gray-500">{t.quotes.titleHelp}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="issueDate" className="block text-sm text-slate-600">{t.quotes.issueDate}</label>
            <Input id="issueDate" type="date" value={form.issueDate} onChange={e => setField("issueDate", e.target.value)} aria-describedby="issueDate-help" />
            <p id="issueDate-help" className="text-xs text-gray-500">{t.quotes.issueDateHelp}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="dueDate" className="block text-sm text-slate-600">{t.quotes.dueDate}</label>
            <Input id="dueDate" type="date" value={form.dueDate} onChange={e => setField("dueDate", e.target.value)} aria-describedby="dueDate-help" />
            <p id="dueDate-help" className="text-xs text-gray-500">{t.quotes.dueDateHelp}</p>
          </div>

          {/* Currency */}
          <div className="flex flex-col">
            <label htmlFor="currency" className="block text-sm text-slate-600 mb-2">{t.quotes.currency}</label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value as "EUR" | "USD")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              aria-describedby="currency-help"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
            <p id="currency-help" className="text-xs text-gray-500 mt-1">{t.quotes.currencyHelp}</p>
          </div>

          {/* Tax */}
          <div className="space-y-2">
            <label htmlFor="tax" className="block text-sm text-slate-600">{t.quotes.tax}</label>
            <Input id="tax" type="number" min={0} max={100} value={form.tax} onChange={e => setField("tax", Number(e.target.value))} aria-describedby="tax-help" />
            <p id="tax-help" className="text-xs text-gray-500">{t.quotes.taxHelp}</p>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label htmlFor="status" className="block text-sm text-slate-600 mb-2">{t.quotes.status}</label>
            <select
              id="status"
              value={form.status ?? "draft"}
              onChange={(e) => setField("status", e.target.value as "draft" | "sent" | "accepted" | "rejected")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              aria-describedby="status-help"
            >
              <option value="draft">{t.quotes.draft}</option>
              <option value="sent">{t.quotes.sent}</option>
              <option value="accepted">{t.quotes.accepted}</option>
              <option value="rejected">{t.quotes.rejected}</option>
            </select>
            <p id="status-help" className="text-xs text-gray-500 mt-1">{t.quotes.statusHelp}</p>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6 space-y-4">
        <div className="text-base font-semibold">{t.quotes.items}</div>
        <div className="space-y-4">
          {form.items.map((it, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-2 lg:col-span-6">
                <label htmlFor={`item-description-${i}`} className="block text-sm font-medium mb-1">{t.quotes.description}</label>
                <Input 
                  id={`item-description-${i}`}
                  placeholder={t.quotes.descriptionPlaceholder} 
                  value={it.description} 
                  onChange={e => setItem(i, { description: e.target.value })}
                  aria-describedby={`item-description-help-${i}`}
                />
                <p id={`item-description-help-${i}`} className="text-xs text-gray-500 mt-1">{t.quotes.descriptionHelp}</p>
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label htmlFor={`item-qty-${i}`} className="block text-sm font-medium mb-1">{t.quotes.qty}</label>
                <Input 
                  id={`item-qty-${i}`}
                  type="number" 
                  min={0} 
                  value={it.qty} 
                  onChange={e => setItem(i, { qty: Number(e.target.value) })}
                  aria-describedby={`item-qty-help-${i}`}
                />
                <p id={`item-qty-help-${i}`} className="text-xs text-gray-500 mt-1">{t.quotes.qtyHelp}</p>
              </div>
              <div className="sm:col-span-1 lg:col-span-3">
                <label htmlFor={`item-price-${i}`} className="block text-sm font-medium mb-1">{t.quotes.price}</label>
                <Input 
                  id={`item-price-${i}`}
                  type="number" 
                  min={0} 
                  step="0.01" 
                  value={it.price} 
                  onChange={e => setItem(i, { price: Number(e.target.value) })}
                  aria-describedby={`item-price-help-${i}`}
                />
                <p id={`item-price-help-${i}`} className="text-xs text-gray-500 mt-1">{t.quotes.priceHelp}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1 flex justify-end">
                {form.items.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeItem(i)}
                    className="w-full sm:w-auto"
                    aria-label={`${t.quotes.removeItem} ${i + 1}`}
                  >
                    {t.quotes.removeItem}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addItem} className="w-full sm:w-auto" aria-label={t.quotes.addItem}>
          + {t.quotes.addItem}
        </Button>
      </Card>

      {/* Notes + Totales */}
      <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm text-slate-600 mb-2">{t.quotes.notes}</label>
          <textarea
            id="notes"
            className="h-40 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            placeholder={t.quotes.notesPlaceholder}
            value={form.notes}
            onChange={e => setField("notes", e.target.value)}
            aria-describedby="notes-help"
          />
          <p id="notes-help" className="text-xs text-gray-500 mt-1">{t.quotes.notesHelp}</p>
        </div>

        <div className="md:col-span-1 md:justify-self-end w-full md:max-w-sm space-y-2">
          <div className="flex justify-between text-sm"><span>{t.quotes.subtotal}</span><span>{money(subtotal, form.currency)}</span></div>
          <div className="flex justify-between text-sm"><span>{t.quotes.tax} ({form.tax}%)</span><span>{money(taxAmount, form.currency)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>{t.quotes.total}</span><span>{money(total, form.currency)}</span></div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSaving} aria-label={t.common.cancel}>{t.common.cancel}</Button>
            <Button type="submit" disabled={isSaving} aria-label={initial?.id ? t.common.save : t.common.create}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.common.creating}
                </>
              ) : (
                initial?.id ? t.common.save : t.common.create
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  )
}
