"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DeleteQuoteButton({ id, asMenuItem }: { id: string; asMenuItem?: boolean }) {
  const router = useRouter()
  async function onDelete() {
    if (!confirm("¿Eliminar esta cotización?")) return
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Cotización eliminada")
      router.push("/quotes")
    } else {
      toast.error("Error al eliminar cotización")
    }
  }
  
  if (asMenuItem) {
    return (
      <button onClick={onDelete} className="w-full text-left">
        Eliminar
      </button>
    )
  }
  
  return <Button variant="destructive" onClick={onDelete}>Eliminar</Button>
}
