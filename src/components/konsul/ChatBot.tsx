"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2 } from "lucide-react"
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

export default function ChatBot({ className = "" }: ChatBotProps) {
  console.log('[ChatBot] ========== COMPONENT FUNCTION CALLED ==========')
  console.log('[ChatBot] Props:', { className })
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy tu asistente de Konsul Bills. Puedo ayudarte a crear cotizaciones, facturas, cambiar estados y enviar documentos a tus clientes. ¿En qué puedo ayudarte?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true) // Iniciar minimizado para que sea más discreto
  const [mounted, setMounted] = useState(false)
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
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
        className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        aria-label="Abrir asistente de IA"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  ) : (
    <div 
      className={`fixed bottom-4 right-4 z-[9999] w-96 max-w-[calc(100vw-2rem)] ${className}`}
      style={{ position: 'fixed' }}
    >
      <Card className="flex flex-col h-[600px] shadow-2xl border-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">Asistente IA</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0 text-white hover:bg-blue-800"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    {message.actions.map((action, idx) => (
                      <div key={idx} className="text-xs text-slate-600">
                        {action.type === "quote_created" && (
                          <span>✅ Cotización {action.data.id} creada</span>
                        )}
                        {action.type === "invoice_created" && (
                          <span>✅ Factura {action.data.id} creada</span>
                        )}
                        {action.type === "status_updated" && (
                          <span>✅ Estado actualizado</span>
                        )}
                        {action.type === "email_sent" && (
                          <span>📧 {action.data.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
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

