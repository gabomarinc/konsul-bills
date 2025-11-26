"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DownloadPDFButtonProps {
  type: "quote" | "invoice"
  id: string
  variant?: "default" | "secondary" | "ghost" | "outline"
}

export default function DownloadPDFButton({ type, id, variant = "default" }: DownloadPDFButtonProps) {
  const handleDownload = async () => {
    try {
      const endpoint = type === "quote" ? `/api/quotes/${id}/pdf` : `/api/invoices/${id}/pdf`
      const response = await fetch(endpoint, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Error al generar el PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type === "quote" ? "cotizacion" : "factura"}-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`PDF de ${type === "quote" ? "cotización" : "factura"} descargado`)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Error al descargar el PDF")
    }
  }

  return (
    <Button onClick={handleDownload} variant={variant} className="flex items-center gap-2" data-pdf-download>
      <Download className="h-4 w-4" />
      Descargar PDF
    </Button>
  )
}

