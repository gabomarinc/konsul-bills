"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ConvertToInvoiceButtonProps {
  quoteId: string
  status: string
}

export default function ConvertToInvoiceButton({ quoteId, status }: ConvertToInvoiceButtonProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isConverting, setIsConverting] = useState(false)
  
  const isAccepted = status === "ACCEPTED"

  const handleConvert = async () => {
    if (!isAccepted || isConverting) return

    setIsConverting(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert-to-invoice`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || t.quotes.convertError)
      }

      const data = await res.json()
      toast.success(t.quotes.convertSuccess)
      
      // Redirigir a la nueva factura
      if (data.invoiceId) {
        router.push(`/invoices/${data.invoiceId}`)
      }
    } catch (error) {
      console.error("Error converting quote to invoice:", error)
      toast.error(error instanceof Error ? error.message : t.quotes.convertError)
    } finally {
      setIsConverting(false)
    }
  }

  if (!isAccepted) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                disabled
                variant="default"
                className="opacity-50 cursor-not-allowed"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t.quotes.convertToInvoice}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t.quotes.convertTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Button
      onClick={handleConvert}
      disabled={isConverting}
      variant="default"
      className="bg-green-600 hover:bg-green-700"
    >
      {isConverting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t.common.loading}
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          {t.quotes.convertToInvoice}
        </>
      )}
    </Button>
  )
}


