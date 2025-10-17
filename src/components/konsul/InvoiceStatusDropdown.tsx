"use client"

import { useState } from "react"
import { toast } from "sonner"

export type InvoiceUIStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

const LABELS: Record<InvoiceUIStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
}

type Props = {
  id: string
  value: InvoiceUIStatus
  onChange?: (next: InvoiceUIStatus) => void
  className?: string
}

export default function InvoiceStatusDropdown({ id, value, onChange, className = "" }: Props) {
  const [val, setVal] = useState<InvoiceUIStatus>(value)
  const [loading, setLoading] = useState(false)

  async function update(next: InvoiceUIStatus) {
    if (next === val) return
    const prev = val
    setVal(next)
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error(await res.text())
      onChange?.(next)
      toast.success("Status updated")
    } catch (e) {
      console.error(e)
      setVal(prev)
      toast.error("Could not update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={val}
      disabled={loading}
      onChange={(e) => update(e.target.value as InvoiceUIStatus)}
      className={[
        "h-8 rounded-md border border-slate-200 bg-white px-2 text-xs md:text-sm",
        "outline-none focus:ring-2 focus:ring-slate-300",
        loading ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      aria-label="Change invoice status"
    >
      {Object.keys(LABELS).map((k) => (
        <option key={k} value={k}>
          {LABELS[k as InvoiceUIStatus]}
        </option>
      ))}
    </select>
  )
}

