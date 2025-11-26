"use client"

import Link from "next/link"
import { MoreVertical, Edit, Download, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import DeleteQuoteButton from "./DeleteQuoteButton"
import { toast } from "sonner"

interface QuoteActionsMenuProps {
  quoteId: string
  onDownloadPDF?: () => void
}

export default function QuoteActionsMenu({ quoteId, onDownloadPDF }: QuoteActionsMenuProps) {
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Error al generar el PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cotizacion-${quoteId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("PDF de cotización descargado")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Error al descargar el PDF")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Más opciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/quotes/${quoteId}/edit`} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <div className="flex items-center gap-2 w-full">
            <Trash2 className="h-4 w-4" />
            <DeleteQuoteButton id={quoteId} asMenuItem />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

