"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface DownloadPDFButtonProps {
  type: "quote" | "invoice"
  id: string
  variant?: "default" | "secondary" | "ghost" | "outline"
}

export default function DownloadPDFButton({ type, id, variant = "default" }: DownloadPDFButtonProps) {
  const router = useRouter()

  const handleView = () => {
    const path = type === "quote" ? `/quotes/${id}/view` : `/invoices/${id}/view`
    router.push(path)
  }

  return (
    <Button onClick={handleView} variant={variant} className="flex items-center gap-2">
      <Eye className="h-4 w-4" />
      Ver {type === "quote" ? "Cotización" : "Factura"}
    </Button>
  )
}

