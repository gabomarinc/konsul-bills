"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import LoadingSpinner from "@/components/konsul/LoadingSpinner"
import StatusDropdown from "@/components/konsul/StatusDropdown"
import { useQuotes } from "@/hooks/useQuotes"
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Search,
  Filter,
  Download
} from "lucide-react"

type Quote = {
  id: string
  client: string
  clientEmail?: string | null
  title: string
  issueDate: string
  dueDate: string | null
  currency: "EUR" | "USD"
  tax: number
  total: number
  status: "draft" | "sent" | "accepted" | "rejected"
  createdAt: string
}

const fmt = (n: number, c: "EUR" | "USD" = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: c }).format(n)

// Calcular días hasta vencimiento
const getDaysUntilDue = (dueDate: string | null): number | null => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function QuotesPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { data = [], isLoading } = useQuotes()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<Quote["status"] | "all">("all")

  // Calcular estadísticas
  const stats = useMemo(() => {
    const approved = data.filter(q => q.status === "accepted").length
    const pending = data.filter(q => q.status === "draft").length
    const totalValue = data.reduce((sum, q) => sum + q.total, 0)
    
    return {
      total: data.length,
      approved,
      pending,
      totalValue,
      currency: data[0]?.currency || "EUR"
    }
  }, [data])

  const filtered = useMemo(() => {
    return data.filter(item => {
      const text = `${item.id} ${item.client} ${item.title} ${item.clientEmail ?? ""}`.toLowerCase()
      const matchesText = text.includes(q.toLowerCase())
      const matchesStatus = status === "all" ? true : item.status === status
      return matchesText && matchesStatus
    })
  }, [q, status, data])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-3xl font-bold text-gray-900">{t.quotes.allQuotes}</h2>
        <Button asChild size="lg">
          <Link href="/quotes/new">{t.quotes.newQuote}</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes */}
        <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.quotes.totalQuotes}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Approved */}
        <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.quotes.approved}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Pending */}
        <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.quotes.pending}</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        {/* Total Value */}
        <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t.quotes.totalValue}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{fmt(stats.totalValue, stats.currency)}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.quotes.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 md:max-w-md"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Quote["status"] | "all")}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.quotes.allStatus}</option>
              <option value="draft">{t.quotes.draft}</option>
              <option value="sent">{t.quotes.sent}</option>
              <option value="accepted">{t.quotes.accepted}</option>
              <option value="rejected">{t.quotes.rejected}</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t.quotes.export}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-6 border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    {t.quotes.quoteId}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">{t.quotes.client}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t.quotes.project}</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">{t.quotes.value}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t.quotes.status}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t.quotes.date}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t.quotes.validUntil}</TableHead>
                <TableHead className="font-semibold text-gray-700"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => {
                const daysUntilDue = getDaysUntilDue(row.dueDate)
                const isExpiringSoon = daysUntilDue !== null && daysUntilDue <= 5 && daysUntilDue >= 0
                
                return (
                  <TableRow 
                    key={row.id} 
                    className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors" 
                    onClick={() => router.push(`/quotes/${row.id}`)}
                  >
                    {/* Quote ID */}
                    <TableCell className="font-semibold text-blue-600">{row.id}</TableCell>
                    
                    {/* Client */}
                    <TableCell className="font-medium text-gray-900">{row.client}</TableCell>
                    
                    {/* Project */}
                    <TableCell className="text-gray-600">{row.title}</TableCell>
                    
                    {/* Value */}
                    <TableCell className="text-right font-semibold text-gray-900">
                      {fmt(row.total, row.currency)}
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        id={row.id}
                        value={row.status}
                        className="min-w-[120px]"
                      />
                    </TableCell>
                    
                    {/* Date */}
                    <TableCell className="text-gray-600 text-sm">
                      {new Date(row.issueDate).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    
                    {/* Valid Until */}
                    <TableCell>
                      {row.dueDate ? (
                        <div className="relative inline-block">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-2 ${
                                  isExpiringSoon 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'text-gray-700'
                                }`}>
                                  {new Date(row.dueDate).toLocaleDateString('es-ES', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                  {isExpiringSoon && <AlertCircle className="h-4 w-4" />}
                                </div>
                              </TooltipTrigger>
                              {isExpiringSoon && (
                                <TooltipContent side="top" className="bg-gray-900 text-white px-3 py-2 text-sm">
                                  <p>
                                    {daysUntilDue === 0 
                                      ? t.quotes.duesToday
                                      : daysUntilDue === 1
                                      ? t.quotes.daysUntilDueSingular.replace('{days}', String(daysUntilDue))
                                      : t.quotes.daysUntilDue.replace('{days}', String(daysUntilDue))}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {isExpiringSoon && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-[10px] font-bold">!</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/quotes/${row.id}`)
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t.quotes.noQuotesFound}</p>
            <p className="text-gray-400 text-sm mt-1">{t.quotes.noQuotesHint}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
