"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface StripePaymentButtonProps {
  invoiceId: string
  isStripeConnected: boolean
}

export default function StripePaymentButton({ 
  invoiceId, 
  isStripeConnected 
}: StripePaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStripePayment = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/stripe/invoice/${invoiceId}`, {
        method: "POST",
        credentials: "include"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al enviar factura a Stripe")
      }

      const data = await response.json()

      // Redirigir al hosted invoice page de Stripe
      if (data.hostedInvoiceUrl) {
        window.open(data.hostedInvoiceUrl, "_blank")
      }

      // Refrescar la página para mostrar el estado actualizado
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "Error al procesar pago con Stripe")
    } finally {
      setLoading(false)
    }
  }

  if (!isStripeConnected) {
    return null
  }

  return (
    <Button 
      onClick={handleStripePayment}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Cobrar con Stripe
        </>
      )}
    </Button>
  )
}



