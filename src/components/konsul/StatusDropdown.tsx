"use client"

import { useState } from "react"
import { toast } from "sonner"

export type UIStatus = "draft" | "sent" | "accepted" | "rejected"

const LABELS: Record<UIStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
}

type Props = {
  id: string
  value: UIStatus
  onChange?: (next: UIStatus) => void
  className?: string
}

export default function StatusDropdown({ id, value, onChange, className = "" }: Props) {
  const [val, setVal] = useState<UIStatus>(value)
  const [loading, setLoading] = useState(false)

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
      onChange={(e) => update(e.target.value as UIStatus)}
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
