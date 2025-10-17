"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DeleteQuoteButton({ id }: { id: string }) {
  const router = useRouter()
  async function onDelete() {
    if (!confirm("Delete this quote?")) return
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Quote deleted")
      router.push("/quotes")
    } else {
      toast.error("Error deleting quote")
    }
  }
  return <Button variant="destructive" onClick={onDelete}>Delete</Button>
}
