"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/contexts/LanguageContext"
import { useInvalidateQuotes } from "@/hooks/useQuotes"

export type UIStatus = "draft" | "sent" | "accepted" | "rejected"

type Props = {
  id: string
  value: UIStatus
  onChange?: (next: UIStatus) => void
  className?: string
}

export default function StatusDropdown({ id, value, onChange, className = "" }: Props) {
  const { t } = useTranslation()
  const invalidateQuotes = useInvalidateQuotes()
  const [val, setVal] = useState<UIStatus>(value)
  const [loading, setLoading] = useState(false)

  // Actualizar valor cuando cambia el prop
  useEffect(() => {
    setVal(value)
  }, [value])

  const LABELS: Record<UIStatus, string> = {
    draft: t.quotes.draft,
    sent: t.quotes.sent,
    accepted: t.quotes.accepted,
    rejected: t.quotes.rejected,
  }

  async function update(next: UIStatus) {
    if (next === val) return
    const prev = val
    setVal(next)
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        credentials: "include",
      })
      if (!res.ok) throw new Error(await res.text())
      onChange?.(next)
      invalidateQuotes() // Refrescar la lista de cotizaciones
      toast.success(t.quotes.statusUpdated || "Estado actualizado")
    } catch (e) {
      console.error(e)
      setVal(prev)
      toast.error(t.quotes.statusUpdateError || "Error al actualizar estado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={val}
      disabled={loading}
      onChange={(e) => update(e.target.value as UIStatus)}
      onClick={(e) => e.stopPropagation()}
      className={[
        "h-8 rounded-md border border-slate-200 bg-white px-2 text-xs md:text-sm",
        "outline-none focus:ring-2 focus:ring-slate-300",
        loading ? "opacity-60 cursor-not-allowed" : "",
        className,
      ].join(" ")}
      aria-label="Change status"
    >
      {Object.keys(LABELS).map((k) => (
        <option key={k} value={k}>
          {LABELS[k as UIStatus]}
        </option>
      ))}
    </select>
  )
}
