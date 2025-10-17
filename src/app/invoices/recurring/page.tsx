"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Repeat, Play, Pause, Trash2, Edit, FileText } from "lucide-react"
import { toast } from "sonner"

type RecurringInvoice = {
  id: string
  clientId: string
  clientName: string
  clientEmail: string | null
  title: string
  description: string | null
  frequency: string
  intervalValue: number
  dayOfMonth: number | null
  startDate: string
  endDate: string | null
  nextRunDate: string
  lastRunDate: string | null
  currency: string
  tax: number
  total: number
  dueInDays: number
  isActive: boolean
  items: Array<{
    id: string
    description: string
    qty: number
    price: number
  }>
  createdAt: string
}

const fmt = (n: number, c: string = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: c }).format(n)

const getFrequencyText = (frequency: string, interval: number, t: any) => {
  if (frequency === "MONTHLY") {
    return interval === 1 ? t.recurringInvoices.frequencyMonthly : `${interval} ${t.recurringInvoices.intervalMonths}`
  }
  if (frequency === "WEEKLY") {
    return interval === 1 ? t.recurringInvoices.frequencyWeekly : `${interval} ${t.recurringInvoices.intervalWeeks}`
  }
  if (frequency === "YEARLY") {
    return interval === 1 ? t.recurringInvoices.frequencyYearly : `${interval} ${t.recurringInvoices.intervalYears}`
  }
  return frequency
}

export default function RecurringInvoicesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [data, setData] = useState<RecurringInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/recurring-invoices", {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const json = await res.json()
      setData(json.data || [])
    } catch (error) {
      console.error("Error fetching recurring invoices:", error)
      toast.error(t.recurringInvoices.createError)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/recurring-invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentState }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(currentState ? t.recurringInvoices.pauseSuccess : t.recurringInvoices.resumeSuccess)
      fetchData()
    } catch (error) {
      console.error("Error updating recurring invoice:", error)
      toast.error(t.recurringInvoices.updateError)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.recurringInvoices.deleteConfirm)) return

    try {
      const res = await fetch(`/api/recurring-invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success(t.recurringInvoices.deleteSuccess)
      fetchData()
    } catch (error) {
      console.error("Error deleting recurring invoice:", error)
      toast.error(t.recurringInvoices.deleteError)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.common.loading}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-3xl font-bold text-gray-900">{t.recurringInvoices.title}</h2>
        <Button asChild size="lg">
          <Link href="/invoices/recurring/new">{t.recurringInvoices.newRecurring}</Link>
        </Button>
      </div>

      {/* Lista de facturas recurrentes */}
      {data.length === 0 ? (
        <Card className="p-12 text-center">
          <Repeat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">{t.recurringInvoices.noRecurringFound}</p>
          <p className="text-gray-400 text-sm mt-1">{t.recurringInvoices.noRecurringHint}</p>
          <Button asChild className="mt-6">
            <Link href="/invoices/recurring/new">{t.recurringInvoices.newRecurring}</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((recurring) => (
            <Card key={recurring.id} className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Info principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{recurring.title}</h3>
                    <Badge variant={recurring.isActive ? "default" : "secondary"}>
                      {recurring.isActive ? (
                        <><Play className="h-3 w-3 mr-1" /> {t.recurringInvoices.active}</>
                      ) : (
                        <><Pause className="h-3 w-3 mr-1" /> {t.recurringInvoices.paused}</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{recurring.clientName}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Frecuencia */}
                    <div className="flex items-center gap-2 text-sm">
                      <Repeat className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">{getFrequencyText(recurring.frequency, recurring.intervalValue, t)}</span>
                      {recurring.dayOfMonth && (
                        <span className="text-gray-400">({t.recurringInvoices.dayOfMonth} {recurring.dayOfMonth})</span>
                      )}
                    </div>
                    
                    {/* Próxima generación */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-700">{t.recurringInvoices.nextRunDate}:</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(recurring.nextRunDate).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {/* Última generación */}
                    {recurring.lastRunDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{t.recurringInvoices.lastRunDate}:</span>
                        <span>
                          {new Date(recurring.lastRunDate).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Monto y acciones */}
                <div className="text-right space-y-3">
                  <p className="text-2xl font-bold text-blue-600">{fmt(recurring.total, recurring.currency)}</p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/invoices/recurring/${recurring.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(recurring.id, recurring.isActive)}
                    >
                      {recurring.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(recurring.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

