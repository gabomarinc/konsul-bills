"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DeleteInvoiceButton({ id, asMenuItem }: { id: string; asMenuItem?: boolean }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function deleteInvoice() {
    if (!confirm("¿Estás seguro de que quieres eliminar esta factura?")) return

    setDeleting(true)
    try {
      const r = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Failed to delete invoice")
      
      toast.success("Factura eliminada")
      router.push("/invoices")
    } catch (error) {
      toast.error("Error al eliminar factura")
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  if (asMenuItem) {
    return (
      <button onClick={deleteInvoice} disabled={deleting} className="w-full text-left">
        {deleting ? "Eliminando..." : "Eliminar"}
      </button>
    )
  }

  return (
    <Button variant="destructive" onClick={deleteInvoice} disabled={deleting}>
      {deleting ? "Eliminando..." : "Eliminar"}
    </Button>
  )
}

