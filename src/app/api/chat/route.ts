import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest, getUserCompanyFromRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"
import { nextHumanId } from "@/lib/ids"
import { sendEmail, generateQuoteEmailHTML, generateInvoiceEmailHTML } from "@/lib/email"

// Tipos para function calling
type FunctionCall = {
  name: string
  arguments: string
}

type ChatMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

interface ActionResult {
  type: string
  data: any
}

export async function POST(req: NextRequest) {
  try {
    console.log('[Chat API] Request recibido')
    const authUser = await getAuthUserFromRequest(req)
    console.log('[Chat API] Auth user:', authUser ? 'existe' : 'no existe')
    
    if (!authUser?.userId) {
      console.log('[Chat API] No autenticado')
      return NextResponse.json(
        { error: "No autenticado", message: "Por favor, inicia sesión nuevamente." },
        { status: 401 }
      )
    }

    console.log('[Chat API] Obteniendo company...')
    const company = await getUserCompanyFromRequest(req)
    console.log('[Chat API] Company obtenida:', company?.id)
    
    const body = await req.json()
    const { message, conversationHistory = [] } = body
    console.log('[Chat API] Mensaje recibido:', message?.substring(0, 50))

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      )
    }

    // Obtener clientes disponibles
    const clients = await prisma.client.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    // Obtener cotizaciones y facturas recientes para contexto
    const recentQuotes = await prisma.quote.findMany({
      where: { companyId: company.id },
      select: { id: true, title: true, status: true, Client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId: company.id },
      select: { id: true, title: true, status: true, Client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    // Construir contexto para la IA
    const clientsList = clients.map(c => `- ${c.name}${c.email ? ` (${c.email})` : ''}`).join('\n')
    const quotesList = recentQuotes.map(q => `- ${q.id}: ${q.title} (${q.Client.name}) - Estado: ${q.status}`).join('\n')
    const invoicesList = recentInvoices.map(i => `- ${i.id}: ${i.title} (${i.Client.name}) - Estado: ${i.status}`).join('\n')

    const systemPrompt = `Eres Axel, un asistente inteligente para Konsul Bills, una plataforma de gestión de facturas y cotizaciones.

Tu personalidad:
- Eres amigable, profesional y servicial
- Hablas en español de forma natural y conversacional
- Eres conciso pero completo en tus respuestas
- Usas emojis de forma moderada

Contexto del usuario:
- Empresa: ${company.name}
- Clientes disponibles:
${clientsList || "No hay clientes registrados"}

Cotizaciones recientes:
${quotesList || "No hay cotizaciones"}

Facturas recientes:
${invoicesList || "No hay facturas"}

Puedes realizar las siguientes acciones usando function calling:
1. create_quote - Crear una cotización
2. create_invoice - Crear una factura
3. update_quote_status - Cambiar el estado de una cotización
4. update_invoice_status - Cambiar el estado de una factura
5. send_quote_email - Enviar una cotización por email
6. send_invoice_email - Enviar una factura por email
7. list_clients - Listar clientes
8. list_quotes - Listar cotizaciones
9. list_invoices - Listar facturas

Cuando el usuario pida crear algo, extrae toda la información posible y usa las funciones correspondientes.`

    const functions = [
      {
        name: "create_quote",
        description: "Crear una nueva cotización",
        parameters: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Nombre del cliente" },
            clientEmail: { type: "string", description: "Email del cliente (opcional)" },
            title: { type: "string", description: "Título de la cotización" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  qty: { type: "number" },
                  price: { type: "number" }
                }
              },
              description: "Items de la cotización"
            },
            currency: { type: "string", enum: ["EUR", "USD"], default: "EUR" },
            tax: { type: "number", description: "Tasa de impuestos (%)" },
            sendEmail: { type: "boolean", description: "Si se debe enviar por email al cliente" }
          },
          required: ["clientName", "title", "items"]
        }
      },
      {
        name: "create_invoice",
        description: "Crear una nueva factura",
        parameters: {
          type: "object",
          properties: {
            clientName: { type: "string", description: "Nombre del cliente" },
            clientEmail: { type: "string", description: "Email del cliente (opcional)" },
            title: { type: "string", description: "Título de la factura" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  qty: { type: "number" },
                  price: { type: "number" }
                }
              },
              description: "Items de la factura"
            },
            currency: { type: "string", enum: ["EUR", "USD"], default: "EUR" },
            tax: { type: "number", description: "Tasa de impuestos (%)" },
            sendEmail: { type: "boolean", description: "Si se debe enviar por email al cliente" }
          },
          required: ["clientName", "title", "items"]
        }
      },
      {
        name: "update_quote_status",
        description: "Cambiar el estado de una cotización",
        parameters: {
          type: "object",
          properties: {
            quoteId: { type: "string", description: "ID de la cotización" },
            status: { type: "string", enum: ["draft", "sent", "accepted", "rejected"], description: "Nuevo estado" }
          },
          required: ["quoteId", "status"]
        }
      },
      {
        name: "update_invoice_status",
        description: "Cambiar el estado de una factura",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string", description: "ID de la factura" },
            status: { type: "string", enum: ["draft", "sent", "paid", "overdue", "cancelled"], description: "Nuevo estado" }
          },
          required: ["invoiceId", "status"]
        }
      },
      {
        name: "send_quote_email",
        description: "Enviar una cotización por email al cliente",
        parameters: {
          type: "object",
          properties: {
            quoteId: { type: "string", description: "ID de la cotización" }
          },
          required: ["quoteId"]
        }
      },
      {
        name: "send_invoice_email",
        description: "Enviar una factura por email al cliente",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string", description: "ID de la factura" }
          },
          required: ["invoiceId"]
        }
      },
      {
        name: "list_clients",
        description: "Listar todos los clientes",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "list_quotes",
        description: "Listar cotizaciones recientes",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Número de cotizaciones a listar", default: 10 }
          },
          required: []
        }
      },
      {
        name: "list_invoices",
        description: "Listar facturas recientes",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Número de facturas a listar", default: 10 }
          },
          required: []
        }
      }
    ]

    // Llamar a OpenAI o Gemini con function calling
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    console.log('[Chat API] API Keys disponibles:', {
      hasOpenAI: !!OPENAI_API_KEY,
      hasGemini: !!GEMINI_API_KEY
    })

    let aiResponse: any
    let functionCalls: FunctionCall[] = []
    const executedActions: ActionResult[] = []

    // Priorizar OpenAI si está disponible (más estable)
    if (OPENAI_API_KEY) {
      console.log('[Chat API] Usando OpenAI')
      // Usar OpenAI con function calling
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message }
      ]

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          functions,
          function_call: "auto",
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      aiResponse = await response.json()
      const choice = aiResponse.choices[0]

      if (choice.message.function_calls) {
        functionCalls = choice.message.function_calls.map((fc: any) => ({
          name: fc.name,
          arguments: fc.arguments
        }))
      }
    } else if (GEMINI_API_KEY) {
      console.log('[Chat API] Usando Gemini')
      // Simplificar: usar prompt directo sin function calling por ahora
      const fullPrompt = `${systemPrompt}

Usuario dice: "${message}"

Analiza el mensaje y responde de forma conversacional. Si el usuario quiere crear algo, extrae la información y responde en formato JSON:
{
  "message": "tu respuesta",
  "function_calls": [{"name": "funcion", "arguments": {...}}]
}`

      // Usar gemini-2.5-flash que está disponible (gemini-1.5-flash ya no existe)
      console.log('[Chat API] Usando gemini-2.5-flash')
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: fullPrompt }]
              }
            ]
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Chat API] Error de Gemini:', errorText)
        
        // Si falla, intentar verificar qué modelos están disponibles
        try {
          const listResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
          )
          if (listResponse.ok) {
            const modelsList = await listResponse.json()
            console.log('[Chat API] Modelos disponibles:', modelsList)
          }
        } catch (listError) {
          console.error('[Chat API] Error al listar modelos:', listError)
        }
        
        return NextResponse.json({
          message: `Error al conectar con Gemini. Verifica que GEMINI_API_KEY sea válido. Error: ${errorText.substring(0, 300)}`,
          actions: []
        }, { status: 500 })
      }

      const data = await response.json()
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.output ||
        ""
      
      console.log('[Chat API] Respuesta recibida de gemini-2.5-flash:', text.substring(0, 100))
      
      try {
        const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```/g, ""))
        aiResponse = { message: { content: parsed.message }, function_calls: parsed.function_calls || [] }
        functionCalls = parsed.function_calls || []
      } catch (parseError) {
        // Si no se puede parsear, usar el texto directamente
        console.warn('[Chat API] No se pudo parsear respuesta de Gemini como JSON, usando texto plano')
        aiResponse = { message: { content: text } }
        functionCalls = []
      }
    } else {
      return NextResponse.json({
        message: "Lo siento, no tengo acceso a la IA en este momento. Por favor, configura OPENAI_API_KEY o GEMINI_API_KEY.",
        actions: []
      })
    }

    // Ejecutar function calls
    for (const funcCall of functionCalls) {
      try {
        const args = typeof funcCall.arguments === "string" 
          ? JSON.parse(funcCall.arguments) 
          : funcCall.arguments

        const result = await executeFunction(funcCall.name, args, company.id, authUser.userId)
        if (result) {
          executedActions.push(result)
        }
      } catch (error: any) {
        console.error(`Error ejecutando función ${funcCall.name}:`, error)
        executedActions.push({
          type: "error",
          data: { message: `Error al ejecutar ${funcCall.name}: ${error.message}` }
        })
      }
    }

    // Construir mensaje de respuesta
    let responseMessage = aiResponse.message?.content || aiResponse.choices?.[0]?.message?.content || "Entendido, he procesado tu solicitud."

    // Agregar información sobre acciones ejecutadas
    if (executedActions.length > 0) {
      const actionsSummary = executedActions
        .filter(a => a.type !== "error")
        .map(a => {
          if (a.type === "quote_created") return `✅ Cotización ${a.data.id} creada`
          if (a.type === "invoice_created") return `✅ Factura ${a.data.id} creada`
          if (a.type === "status_updated") return `✅ Estado actualizado`
          if (a.type === "email_sent") return `📧 ${a.data.message}`
          return null
        })
        .filter(Boolean)
        .join("\n")

      if (actionsSummary) {
        responseMessage += `\n\n${actionsSummary}`
      }
    }

    return NextResponse.json({
      message: responseMessage,
      actions: executedActions
    })
  } catch (error: any) {
    console.error("[Chat API] Error completo:", error)
    console.error("[Chat API] Error stack:", error?.stack)
    console.error("[Chat API] Error message:", error?.message)
    
    return NextResponse.json(
      { 
        message: error?.message || "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
        error: error?.message,
        actions: []
      },
      { status: 500 }
    )
  }
}

// Ejecutar funciones según el nombre
async function executeFunction(
  functionName: string,
  args: any,
  companyId: string,
  userId: string
): Promise<ActionResult | null> {
  const settings = await prisma.companySettings.findUnique({
    where: { companyId }
  })

  switch (functionName) {
    case "create_quote": {
      // Crear o buscar cliente
      let clientId: string
      const client = await prisma.client.upsert({
        where: { companyId_name: { companyId, name: args.clientName } },
        update: { email: args.clientEmail },
        create: {
          id: `client_${nanoid(16)}`,
          companyId,
          name: args.clientName,
          email: args.clientEmail,
          updatedAt: new Date()
        }
      })
      clientId = client.id

      // Calcular totales
      const items = args.items || []
      const tax = args.tax ?? settings?.defaultTaxRate ?? 21
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
      const taxAmount = (subtotal * tax) / 100
      const total = Math.round((subtotal + taxAmount) * 100) / 100

      // Crear cotización
      const quoteId = await nextHumanId({
        companyId,
        type: "QUOTE",
        prefix: settings?.quotePrefix ?? "Q-",
        padding: settings?.numberPadding ?? 5
      })

      const quote = await prisma.quote.create({
        data: {
          id: quoteId,
          companyId,
          clientId,
          title: args.title || "Cotización",
          issueDate: new Date(),
          currency: args.currency || settings?.defaultCurrency || "EUR",
          tax,
          status: "DRAFT",
          subtotal,
          taxAmount,
          total,
          updatedAt: new Date()
        }
      })

      // Crear items
      for (const item of items) {
        await prisma.quoteItem.create({
          data: {
            id: `item_${nanoid(16)}`,
            quoteId: quote.id,
            description: item.description,
            qty: item.qty,
            price: item.price
          }
        })
      }

      // Enviar email si se solicita
      if (args.sendEmail && client.email) {
        try {
          const quoteWithItems = await prisma.quote.findUnique({
            where: { id: quote.id },
            include: { QuoteItem: true, Client: true }
          })
          
          if (quoteWithItems) {
            await sendEmail({
              to: client.email,
              subject: `Cotización ${quote.id} - ${quote.title}`,
              html: generateQuoteEmailHTML(quoteWithItems)
            })
          }
        } catch (emailError) {
          console.error(`[CHAT] Error enviando email de cotización:`, emailError)
        }
      }

      return {
        type: "quote_created",
        data: { id: quote.id, title: quote.title, total: quote.total }
      }
    }

    case "create_invoice": {
      // Similar a create_quote pero para facturas
      let clientId: string
      const client = await prisma.client.upsert({
        where: { companyId_name: { companyId, name: args.clientName } },
        update: { email: args.clientEmail },
        create: {
          id: `client_${nanoid(16)}`,
          companyId,
          name: args.clientName,
          email: args.clientEmail,
          updatedAt: new Date()
        }
      })
      clientId = client.id

      const items = args.items || []
      const tax = args.tax ?? settings?.defaultTaxRate ?? 21
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
      const taxAmount = (subtotal * tax) / 100
      const total = Math.round((subtotal + taxAmount) * 100) / 100

      const invoiceId = await nextHumanId({
        companyId,
        type: "INVOICE",
        prefix: settings?.invoicePrefix ?? "INV-",
        padding: settings?.numberPadding ?? 5
      })

      const invoice = await prisma.invoice.create({
        data: {
          id: invoiceId,
          companyId,
          clientId,
          title: args.title || "Factura",
          issueDate: new Date(),
          currency: args.currency || settings?.defaultCurrency || "EUR",
          tax,
          status: "DRAFT",
          subtotal,
          taxAmount,
          total,
          balanceDue: total,
          updatedAt: new Date(),
          InvoiceItem: {
            create: items.map((item: any) => ({
              id: `item_${nanoid(16)}`,
              description: item.description,
              qty: item.qty,
              price: item.price
            }))
          }
        }
      })

      if (args.sendEmail && client.email) {
        try {
          const invoiceWithItems = await prisma.invoice.findUnique({
            where: { id: invoice.id },
            include: { InvoiceItem: true, Client: true }
          })
          
          if (invoiceWithItems) {
            await sendEmail({
              to: client.email,
              subject: `Factura ${invoice.id} - ${invoice.title}`,
              html: generateInvoiceEmailHTML(invoiceWithItems)
            })
          }
        } catch (emailError) {
          console.error(`[CHAT] Error enviando email de factura:`, emailError)
        }
      }

      return {
        type: "invoice_created",
        data: { id: invoice.id, title: invoice.title, total: invoice.total }
      }
    }

    case "update_quote_status": {
      const quote = await prisma.quote.findFirst({
        where: { id: args.quoteId, companyId }
      })

      if (!quote) {
        throw new Error("Cotización no encontrada")
      }

      await prisma.quote.update({
        where: { id: args.quoteId },
        data: {
          status: args.status.toUpperCase(),
          updatedAt: new Date()
        }
      })

      return {
        type: "status_updated",
        data: { quoteId: args.quoteId, status: args.status }
      }
    }

    case "update_invoice_status": {
      const invoice = await prisma.invoice.findFirst({
        where: { id: args.invoiceId, companyId }
      })

      if (!invoice) {
        throw new Error("Factura no encontrada")
      }

      await prisma.invoice.update({
        where: { id: args.invoiceId },
        data: {
          status: args.status.toUpperCase(),
          updatedAt: new Date()
        }
      })

      return {
        type: "status_updated",
        data: { invoiceId: args.invoiceId, status: args.status }
      }
    }

    case "send_quote_email": {
      const quote = await prisma.quote.findFirst({
        where: { id: args.quoteId, companyId },
        include: { Client: true, QuoteItem: true }
      })

      if (!quote) {
        throw new Error("Cotización no encontrada")
      }

      if (!quote.Client.email) {
        throw new Error("El cliente no tiene email registrado")
      }

      try {
        await sendEmail({
          to: quote.Client.email,
          subject: `Cotización ${quote.id} - ${quote.title}`,
          html: generateQuoteEmailHTML(quote)
        })

        return {
          type: "email_sent",
          data: { message: `Cotización ${quote.id} enviada a ${quote.Client.email}` }
        }
      } catch (error: any) {
        throw new Error(`Error al enviar email: ${error.message}`)
      }
    }

    case "send_invoice_email": {
      const invoice = await prisma.invoice.findFirst({
        where: { id: args.invoiceId, companyId },
        include: { Client: true, InvoiceItem: true }
      })

      if (!invoice) {
        throw new Error("Factura no encontrada")
      }

      if (!invoice.Client.email) {
        throw new Error("El cliente no tiene email registrado")
      }

      try {
        await sendEmail({
          to: invoice.Client.email,
          subject: `Factura ${invoice.id} - ${invoice.title}`,
          html: generateInvoiceEmailHTML(invoice)
        })

        return {
          type: "email_sent",
          data: { message: `Factura ${invoice.id} enviada a ${invoice.Client.email}` }
        }
      } catch (error: any) {
        throw new Error(`Error al enviar email: ${error.message}`)
      }
    }

    case "list_clients": {
      const clients = await prisma.client.findMany({
        where: { companyId },
        select: { name: true, email: true },
        orderBy: { name: "asc" }
      })

      return {
        type: "clients_listed",
        data: { clients }
      }
    }

    case "list_quotes": {
      const quotes = await prisma.quote.findMany({
        where: { companyId },
        select: { id: true, title: true, status: true, total: true, Client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: args.limit || 10
      })

      return {
        type: "quotes_listed",
        data: { quotes }
      }
    }

    case "list_invoices": {
      const invoices = await prisma.invoice.findMany({
        where: { companyId },
        select: { id: true, title: true, status: true, total: true, Client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: args.limit || 10
      })

      return {
        type: "invoices_listed",
        data: { invoices }
      }
    }

    default:
      console.warn(`Función desconocida: ${functionName}`)
      return null
  }
}

