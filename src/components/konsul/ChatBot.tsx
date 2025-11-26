"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Send, Bot, User, Loader2, Minimize2, 
  Users, FileText, Receipt, Mail, Plus,
  CheckCircle2, Building2
} from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actions?: Array<{
    type: string
    data: any
  }>
}

interface ChatBotProps {
  className?: string
}

// Botones predefinidos de acción rápida
const quickActions = [
  { id: "list_clients", label: "Ver clientes", icon: Users, prompt: "Muéstrame la lista de clientes" },
  { id: "list_quotes", label: "Ver cotizaciones", icon: FileText, prompt: "Muéstrame la lista de cotizaciones" },
  { id: "list_invoices", label: "Ver facturas", icon: Receipt, prompt: "Muéstrame la lista de facturas" },
  { id: "create_quote", label: "Nueva cotización", icon: Plus, prompt: "Quiero crear una nueva cotización" },
  { id: "create_invoice", label: "Nueva factura", icon: Plus, prompt: "Quiero crear una nueva factura" },
]

// Componente para renderizar listas de forma bonita
function ListRenderer({ action }: { action: { type: string; data: any } }) {
  if (action.type === "clients_listed" && action.data?.clients) {
    const clients = action.data.clients
    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
          <Users className="h-3 w-3" />
          {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {clients.map((client: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{client.name}</div>
                  {client.email && (
                    <div className="text-xs text-slate-500">{client.email}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (action.type === "quotes_listed" && action.data?.quotes) {
    const quotes = action.data.quotes
    const getStatusColor = (status: string) => {
      const s = status.toLowerCase()
      if (s === "accepted") return "bg-green-100 text-green-700"
      if (s === "sent") return "bg-blue-100 text-blue-700"
      if (s === "rejected") return "bg-red-100 text-red-700"
      return "bg-slate-100 text-slate-700"
    }
    
    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'}
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {quotes.map((quote: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{quote.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 mb-1">{quote.title}</div>
                  {quote.Client && (
                    <div className="text-xs text-slate-500">Cliente: {quote.Client.name}</div>
                  )}
                </div>
                {quote.total !== undefined && (
                  <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {typeof quote.total === 'number' 
                      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(quote.total)
                      : quote.total
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (action.type === "invoices_listed" && action.data?.invoices) {
    const invoices = action.data.invoices
    const getStatusColor = (status: string) => {
      const s = status.toLowerCase()
      if (s === "paid") return "bg-green-100 text-green-700"
      if (s === "sent") return "bg-blue-100 text-blue-700"
      if (s === "overdue") return "bg-red-100 text-red-700"
      if (s === "cancelled") return "bg-slate-100 text-slate-700"
      return "bg-yellow-100 text-yellow-700"
    }
    
    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
          <Receipt className="h-3 w-3" />
          {invoices.length} {invoices.length === 1 ? 'factura' : 'facturas'}
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {invoices.map((invoice: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{invoice.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 mb-1">{invoice.title}</div>
                  {invoice.Client && (
                    <div className="text-xs text-slate-500">Cliente: {invoice.Client.name}</div>
                  )}
                </div>
                {invoice.total !== undefined && (
                  <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {typeof invoice.total === 'number' 
                      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.total)
                      : invoice.total
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default function ChatBot({ className = "" }: ChatBotProps) {
  console.log('[ChatBot] ========== COMPONENT FUNCTION CALLED ==========')
  console.log('[ChatBot] Props:', { className })
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! 👋 Soy Axel, tu asistente de Konsul Bills. Puedo ayudarte a gestionar clientes, cotizaciones y facturas. ¿En qué puedo ayudarte?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('[ChatBot] useEffect - setting mounted to true')
    setMounted(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setShowQuickActions(false)
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error("Error al procesar el mensaje")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Lo siento, no pude procesar tu mensaje.",
        timestamp: new Date(),
        actions: data.actions
      }

      setMessages(prev => [...prev, assistantMessage])

      // Si hay acciones ejecutadas, mostrar notificaciones
      if (data.actions) {
        data.actions.forEach((action: any) => {
          if (action.type === "quote_created") {
            toast.success(`✅ Cotización ${action.data.id} creada exitosamente`)
          } else if (action.type === "invoice_created") {
            toast.success(`✅ Factura ${action.data.id} creada exitosamente`)
          } else if (action.type === "status_updated") {
            toast.success(`✅ Estado actualizado a ${action.data.status}`)
          } else if (action.type === "email_sent") {
            toast.success(`📧 ${action.data.message}`)
          }
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Error al enviar el mensaje. Por favor, intenta nuevamente.")
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  console.log('[ChatBot] Render - mounted:', mounted, 'isMinimized:', isMinimized)

  // Forzar renderizado siempre para debug
  if (!mounted) {
    console.log('[ChatBot] Not mounted yet, but rendering anyway for debug')
    // No retornar null, continuar con el renderizado
  }

  console.log('[ChatBot] Rendering chatbot, mounted:', mounted, 'isMinimized:', isMinimized)

  const chatbotContent = isMinimized ? (
    <div className={`fixed bottom-4 right-4 z-[9999] ${className}`} style={{ position: 'fixed' }}>
      <Button
        onClick={() => setIsMinimized(false)}
        className="rounded-full h-14 w-14 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105"
        aria-label="Abrir asistente de IA"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  ) : (
    <div 
      className={`fixed bottom-4 right-4 z-[9999] w-[420px] max-w-[calc(100vw-2rem)] ${className}`}
      style={{ position: 'fixed' }}
    >
      <Card className="flex flex-col h-[650px] shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Asistente IA</h3>
              <p className="text-xs text-blue-100">Konsul Bills</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                    : "bg-white border border-slate-200/80 text-slate-900 backdrop-blur-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action, idx) => {
                      // Renderizar listas de forma bonita
                      if (["clients_listed", "quotes_listed", "invoices_listed"].includes(action.type)) {
                        return <ListRenderer key={idx} action={action} />
                      }
                      
                      // Renderizar otras acciones
                      return (
                        <div key={idx} className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                          {action.type === "quote_created" && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Cotización {action.data.id} creada</span>
                            </div>
                          )}
                          {action.type === "invoice_created" && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Factura {action.data.id} creada</span>
                            </div>
                          )}
                          {action.type === "status_updated" && (
                            <div className="flex items-center gap-2 text-blue-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Estado actualizado</span>
                            </div>
                          )}
                          {action.type === "email_sent" && (
                            <div className="flex items-center gap-2 text-blue-700">
                              <Mail className="h-3 w-3" />
                              <span>{action.data.message}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-sm">
                  <User className="h-4 w-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}
          
          {/* Quick Actions - Mostrar solo si no hay mensajes del usuario aún o después del mensaje de bienvenida */}
          {showQuickActions && messages.length === 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 px-1">Acciones rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="h-auto py-2.5 px-3 justify-start text-left hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  // TEMPORAL: Renderizar directamente sin portal para debug
  console.log('[ChatBot] Returning chatbotContent directly (no portal for now)')
  console.log('[ChatBot] chatbotContent type:', typeof chatbotContent)
  
  // Forzar renderizado siempre
  return chatbotContent
  
  // Código original con portal (comentado temporalmente)
  // if (typeof window !== 'undefined') {
  //   if (document.body) {
  //     console.log('[ChatBot] Rendering via portal to document.body')
  //     try {
  //       return createPortal(chatbotContent, document.body)
  //     } catch (error) {
  //       console.error('[ChatBot] Error creating portal:', error)
  //       return chatbotContent
  //     }
  //   } else {
  //     console.log('[ChatBot] document.body not available yet')
  //     return null
  //   }
  // }
  // 
  // console.log('[ChatBot] Window not available (SSR)')
  // return null
}

