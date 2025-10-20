"use client"

import { useMemo } from "react"
import { useTranslation } from "@/contexts/LanguageContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import LoadingSpinner from "@/components/konsul/LoadingSpinner"
import { useQuotes } from "@/hooks/useQuotes"
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Target,
  FileDown,
  Sparkles,
  Receipt
} from "lucide-react"

type Currency = "EUR" | "USD"

const fmtMoney = (n: number, c: Currency = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: c }).format(n)

const getTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) {
    return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
  } else if (diffHours > 0) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  } else {
    return 'hace unos momentos'
  }
}

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700"
}

const statusLabels = {
  draft: "borrador",
  sent: "enviada",
  accepted: "aceptada",
  rejected: "rechazada"
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data = [], isLoading } = useQuotes()

  // Calcular métricas
  const totalRevenue = useMemo(() => {
    return data
      .filter(q => q.status === "accepted")
      .reduce((acc, q) => acc + (Number(q.total) || 0), 0)
  }, [data])

  const acceptedQuotes = useMemo(() => {
    return data.filter(q => q.status === "accepted").length
  }, [data])

  // Cotizaciones Activas = Enviadas + Borradores (las que están en proceso)
  const activeQuotes = useMemo(() => {
    return data.filter(q => ["sent", "draft"].includes(q.status)).length
  }, [data])

  const avgQuoteValue = useMemo(() => {
    const quotes = data.filter(q => q.status !== "rejected")
    if (quotes.length === 0) return 0
    const sum = quotes.reduce((acc, q) => acc + (Number(q.total) || 0), 0)
    return sum / quotes.length
  }, [data])

  // Tasa de Conversión: Aceptadas / Enviadas
  const conversionRate = useMemo(() => {
    const sent = data.filter(q => q.status === "sent" || q.status === "accepted")
    const accepted = data.filter(q => q.status === "accepted")
    if (sent.length === 0) return 0
    return Math.round((accepted.length / sent.length) * 100)
  }, [data])

  // Cotizaciones recientes (últimas 4)
  const recentQuotes = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [data])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t.dashboard.title}</h1>
        <p className="text-slate-600 mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{t.dashboard.totalRevenue}</p>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{fmtMoney(totalRevenue, "EUR")}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-slate-500">{acceptedQuotes} {t.dashboard.totalAccepted}</span>
            </div>
          </div>
        </Card>

        {/* Active Quotes */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{t.dashboard.activeQuotes}</p>
            <div className="p-3 bg-cyan-50 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{activeQuotes}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-slate-500">{t.dashboard.pendingQuotes}</span>
            </div>
          </div>
        </Card>

        {/* Avg Quote Value */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{t.dashboard.avgQuoteValue}</p>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{fmtMoney(avgQuoteValue, "EUR")}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-slate-500">promedio por cotización</span>
            </div>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{t.dashboard.conversionRate}</p>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{conversionRate}%</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-slate-500">{t.dashboard.acceptedVsSent}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotes */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t.dashboard.recentQuotes}</h3>
              <p className="text-sm text-slate-500">{t.dashboard.latestQuoteActivity}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-600">
              <span className="mr-1">•••</span>
            </Button>
          </div>

          <div className="space-y-4">
            {recentQuotes.length > 0 ? (
              recentQuotes.map((quote) => (
                <Link 
                  key={quote.id} 
                  href={`/quotes/${quote.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{quote.id}</p>
                        <Badge className={`${statusColors[quote.status as keyof typeof statusColors]} text-xs`}>
                          {statusLabels[quote.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{quote.client || "Sin cliente"}</p>
                      <p className="text-xs text-slate-500 mt-1">{getTimeAgo(quote.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{fmtMoney(quote.total, quote.currency)}</p>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                {t.dashboard.noRecentQuotes}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-slate-900">{t.dashboard.quickActions}</h3>
            <p className="text-sm text-slate-500">{t.dashboard.streamlineWorkflow}</p>
          </div>

          <div className="space-y-1.5">
            <Link href="/quotes/new" className="block">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white justify-start h-12">
                <FileText className="h-5 w-5 mr-3" />
                {t.dashboard.createNewQuote}
              </Button>
            </Link>

            <Link href="/invoices/new" className="block">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white justify-start h-12">
                <Receipt className="h-5 w-5 mr-3" />
                {t.dashboard.createNewInvoice}
              </Button>
            </Link>

            <Button variant="outline" className="w-full justify-start h-12 border-slate-300 hover:bg-slate-50">
              <FileDown className="h-5 w-5 mr-3" />
              {t.dashboard.exportReports}
            </Button>
          </div>

          {/* Pro Tip */}
          <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">{t.dashboard.proTip}</h4>
                <p className="text-xs text-blue-700 mt-1">
                  {t.dashboard.proTipText}
                </p>
              </div>
            </div>
          </div>

          {/* AI Buttons */}
          <div className="mt-2.5 space-y-1.5">
            <Link href="/quotes/new" className="block">
              <Button
                type="button"
                className="w-full h-12 px-6 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600 shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">✨</span>
                {t.dashboard.generateQuoteWithAI}
              </Button>
            </Link>

            <Link href="/invoices/new" className="block">
              <Button
                type="button"
                className="w-full h-12 px-6 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600 shadow-lg hover:shadow-xl transition-all"
              >
                <span className="mr-2">✨</span>
                {t.dashboard.generateInvoiceWithAI}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
