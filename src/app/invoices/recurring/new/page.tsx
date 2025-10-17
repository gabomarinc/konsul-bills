"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

type Client = {
  id: string
  name: string
  email: string | null
}

type LineItem = {
  id: string
  description: string
  qty: number
  price: number
}

export default function NewRecurringInvoicePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [isSaving, setIsSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  
  // Form data
  const [clientId, setClientId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState("MONTHLY")
  const [intervalValue, setIntervalValue] = useState(1)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState("")
  const [hasEndDate, setHasEndDate] = useState(false)
  const [currency, setCurrency] = useState("EUR")
  const [tax, setTax] = useState(21)
  const [dueInDays, setDueInDays] = useState(30)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", qty: 1, price: 0 }
  ])

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients", { credentials: "include" })
        if (res.ok) {
          const json = await res.json()
          setClients(json.data || [])
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
      }
    }
    fetchClients()
  }, [])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
  const taxAmount = (subtotal * tax) / 100
  const total = subtotal + taxAmount

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: "", qty: 1, price: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("Debe haber al menos un artículo")
      return
    }
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSaving) return
    
    // Validación
    if (!clientId) {
      toast.error("Selecciona un cliente")
      return
    }
    if (!title.trim()) {
      toast.error("Ingresa un título")
      return
    }
    if (items.some(item => !item.description.trim())) {
      toast.error("Todos los artículos deben tener descripción")
      return
    }

    try {
      setIsSaving(true)

      const body = {
        clientId,
        title,
        description: description || null,
        frequency,
        intervalValue,
        dayOfMonth: frequency === "MONTHLY" ? dayOfMonth : null,
        dayOfWeek: null,
        startDate,
        endDate: hasEndDate && endDate ? endDate : null,
        currency,
        tax,
        dueInDays,
        items: items.map(({ id, ...rest }) => rest),
        notes: notes || null,
      }

      const res = await fetch("/api/recurring-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || t.recurringInvoices.createError)
      }

      toast.success(t.recurringInvoices.createSuccess)
      router.push("/invoices/recurring")
    } catch (error: any) {
      console.error("Error creating recurring invoice:", error)
      toast.error(error.message || t.recurringInvoices.createError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{t.recurringInvoices.newRecurring}</h2>
        <p className="text-gray-600 mt-1">Configura una factura que se generará automáticamente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📋 {t.invoices.invoiceDetails}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.invoices.client} *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t.invoices.title_field} *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Hosting mensual"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t.invoices.description}</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción adicional (opcional)"
              />
            </div>
          </div>
        </Card>

        {/* Configuración de Recurrencia */}
        <Card className="p-6 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="text-lg font-semibold mb-4">🔄 {t.recurringInvoices.recurrenceConfig}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.recurringInvoices.frequency} *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white"
              >
                <option value="MONTHLY">{t.recurringInvoices.frequencyMonthly}</option>
                <option value="WEEKLY">{t.recurringInvoices.frequencyWeekly}</option>
                <option value="YEARLY">{t.recurringInvoices.frequencyYearly}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.recurringInvoices.intervalValue}</label>
              <Input
                type="number"
                min={1}
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {frequency === "MONTHLY" && `Ej: 1 = cada mes, 2 = cada 2 meses`}
                {frequency === "WEEKLY" && `Ej: 1 = cada semana, 2 = cada 2 semanas`}
                {frequency === "YEARLY" && `Ej: 1 = cada año`}
              </p>
            </div>

            {frequency === "MONTHLY" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t.recurringInvoices.dayOfMonth}</label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-gray-500 mt-1">{t.recurringInvoices.dayOfMonthHint}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{t.recurringInvoices.startDate} *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="hasEndDate"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="hasEndDate" className="text-sm font-medium">
                  {t.recurringInvoices.endDate} {t.recurringInvoices.endDateOptional}
                </label>
              </div>
              {hasEndDate && (
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              )}
              {!hasEndDate && (
                <p className="text-sm text-gray-500 italic">✨ {t.recurringInvoices.noEndDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.recurringInvoices.dueInDays}</label>
              <Input
                type="number"
                min={1}
                value={dueInDays}
                onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-gray-500 mt-1">{t.recurringInvoices.dueInDaysHint}</p>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">💰 {t.invoices.items}</h3>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder={t.invoices.description}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={1}
                    placeholder={t.invoices.qty}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder={t.invoices.price}
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            {t.invoices.addItem}
          </Button>

          {/* Totales */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>{t.invoices.subtotal}:</span>
              <span className="font-medium">{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.invoices.tax} ({tax}%):</span>
              <span className="font-medium">{taxAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t.invoices.total}:</span>
              <span className="text-blue-600">{total.toFixed(2)} €</span>
            </div>
          </div>
        </Card>

        {/* Opciones adicionales */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.invoices.currency}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.invoices.tax} (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t.invoices.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2"
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.common.creating}
              </>
            ) : (
              t.common.create
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

