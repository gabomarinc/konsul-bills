"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DeleteInvoiceButton({ id }: { id: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function deleteInvoice() {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    setDeleting(true)
    try {
      const r = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Failed to delete invoice")
      
      toast.success("Invoice deleted")
      router.push("/invoices")
    } catch (error) {
      toast.error("Failed to delete invoice")
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button variant="destructive" onClick={deleteInvoice} disabled={deleting}>
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  )
}

