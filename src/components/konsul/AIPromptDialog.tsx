"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export type AIParsed = {
  clientName?: string
  clientEmail?: string
  title?: string
  issueDate?: string
  dueDate?: string
  currency?: "EUR" | "USD"
  tax?: number
  notes?: string
  items?: Array<{ description: string; qty: number; price: number }>
}

type Props = {
  onApply: (data: AIParsed) => void
  triggerLabel?: string
  triggerClassName?: string
}

export default function AIPromptDialog({
  onApply,
  triggerLabel = "Generar con IA",
  triggerClassName = "",
}: Props) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error("Escribe qué necesitas generar")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: AIParsed = await res.json()
      onApply(data)
      toast.success("Propuesta generada con IA")
      setOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("No se pudo generar con IA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Botón grande con gradiente verde→azul + badge NEW */}
        <Button
          type="button"
          className={[
            "relative h-12 px-6 rounded-2xl font-semibold text-white",
            "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500",
            "hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600",
            "shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400",
            "transition-all",
            triggerClassName,
          ].join(" ")}
        >
          <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 shadow ring-1 ring-amber-500/40">
            NEW
          </span>
          <span className="mr-2">✨</span>
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar con IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Describe lo que necesitas y la IA pre-rellenará el formulario.
          </div>

          {/* Textarea nativa con estilo “input” */}
          <textarea
            placeholder='Ej: "Cotización web con Woocommerce, cliente Gabriela, 800€"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[140px] w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="(Opcional) Email del cliente" />
            <Input placeholder="(Opcional) Moneda: EUR/USD" />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Generando…" : "Aplicar al formulario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
