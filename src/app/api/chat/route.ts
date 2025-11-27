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
    
    const normalizedMessage = normalizeText(message)

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

    // Detectar solicitudes directas de listas sin pasar por la IA
    // Solo si NO hay mención de un cliente específico (dejar que la IA lo procese con filtro)
    const directListIntent = detectDirectListRequest(normalizedMessage, clients)
    if (directListIntent && !directListIntent.hasClientFilter) {
      try {
        const action = await executeFunction(
          directListIntent.functionName,
          { limit: 10 },
          company.id,
          authUser.userId
        )

        return NextResponse.json({
          message: directListIntent.responseMessage,
          actions: action ? [action] : []
        })
      } catch (directListError) {
        console.error('[Chat API] Error ejecutando listado directo:', directListError)
        // Continuar con la IA si falla
      }
    }

    // Detectar solicitudes de cambio de estado - NO ejecutar directamente, dejar que la IA lo procese
    // pero mejorar el contexto para que la IA entienda mejor

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

Cotizaciones recientes (MÁS RECIENTE PRIMERO):
${quotesList || "No hay cotizaciones"}

Facturas recientes (MÁS RECIENTE PRIMERO):
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

IMPORTANTE - CAMBIOS DE ESTADO:
- Cuando el usuario pida cambiar el estado de una cotización o factura, DEBES usar update_quote_status o update_invoice_status.
- El usuario puede usar lenguaje natural como: "acepta la cotización", "marca como aceptada", "cambia a aceptada", "pon en enviado", "marca como pagada", etc.
- CRÍTICO PARA FACTURAS: Si el usuario dice "aceptada" o "acepta" para una FACTURA, debes usar el estado "paid" (pagada). Las facturas NO tienen estado "accepted", solo las cotizaciones.
- Si dice "la última cotización", "la última factura", "la más reciente", usa el ID de la primera en la lista (la más reciente).
- Si menciona un ID específico (como Q-00009, INV-00005), usa ese ID exacto.
- Estados válidos para cotizaciones: "draft" (borrador), "sent" (enviada), "accepted" (aceptada), "rejected" (rechazada).
- Estados válidos para facturas: "draft" (borrador), "sent" (enviada), "paid" (pagada/aceptada), "overdue" (vencida), "cancelled" (cancelada).
- NO listes las cotizaciones cuando el usuario pide cambiar un estado. Ejecuta directamente el cambio de estado.

IMPORTANTE - LISTADOS:
- Cuando el usuario pida listar clientes, cotizaciones o facturas, SIEMPRE usa la función correspondiente (list_clients, list_quotes, list_invoices).
- Si el usuario menciona un cliente específico (ej: "cotizaciones para Cranealo", "facturas de QuAl", "las cotizaciones que tenemos para cranealo"), DEBES pasar el nombre del cliente en el parámetro clientName.
- Extrae el nombre del cliente del mensaje del usuario. Busca patrones como: "para X", "de X", "del cliente X", "de la empresa X", "que tenemos para X", "que tenemos de X".
- Ejemplos: "para Cranealo" → clientName: "Cranealo", "de QuAl" → clientName: "QuAl", "las cotizaciones que tenemos para cranealo" → clientName: "Cranealo", "facturas del cliente QuAl" → clientName: "QuAl".
- El nombre del cliente debe coincidir con uno de los clientes disponibles en la lista proporcionada. Si no estás seguro, usa el nombre exacto que el usuario mencionó.
- Responde de forma amigable y natural, sin mostrar JSON ni datos técnicos. El sistema mostrará las listas de forma visual automáticamente.

IMPORTANTE - CREACIÓN:
- Cuando el usuario pida CREAR una cotización o factura (ej: "crear cotización", "nueva cotización", "quiero crear una cotización", "hacer una factura"), DEBES usar create_quote o create_invoice.
- NO uses list_quotes o list_invoices cuando el usuario pide CREAR algo nuevo.
- Si el usuario no proporciona toda la información necesaria (cliente, título, items), pregunta por los datos faltantes de forma amigable.
- Para crear una cotización mínima, necesitas al menos: clientName, title, y items (o amount como alternativa).
- Si el usuario solo proporciona un monto y descripción, crea un item automáticamente con esa información.`

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
        description: "Cambiar el estado de una cotización. Usa esta función cuando el usuario pida aceptar, rechazar, enviar o cambiar el estado de una cotización. Si dice 'la última' o 'la más reciente', usa el ID de la cotización más reciente de la lista proporcionada.",
        parameters: {
          type: "object",
          properties: {
            quoteId: { 
              type: "string", 
              description: "ID de la cotización (ej: Q-00009). Si el usuario dice 'la última', 'la más reciente' o similar, usa el ID de la primera cotización en la lista de cotizaciones recientes." 
            },
            status: { 
              type: "string", 
              enum: ["draft", "sent", "accepted", "rejected"], 
              description: "Nuevo estado. 'accepted' para aceptar, 'rejected' para rechazar, 'sent' para enviar, 'draft' para borrador." 
            }
          },
          required: ["quoteId", "status"]
        }
      },
      {
        name: "update_invoice_status",
        description: "Cambiar el estado de una factura. Usa esta función cuando el usuario pida marcar como pagada, aceptada, enviar, cancelar o cambiar el estado de una factura. IMPORTANTE: Si el usuario dice 'aceptada' para una factura, usa 'paid' (pagada). Si dice 'la última' o 'la más reciente', usa el ID de la factura más reciente de la lista proporcionada.",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { 
              type: "string", 
              description: "ID de la factura (ej: INV-00005). Si el usuario dice 'la última', 'la más reciente' o similar, usa el ID de la primera factura en la lista de facturas recientes." 
            },
            status: { 
              type: "string", 
              enum: ["draft", "sent", "paid", "overdue", "cancelled"], 
              description: "Nuevo estado. 'paid' para pagada/aceptada, 'sent' para enviada, 'cancelled' para cancelada, 'overdue' para vencida, 'draft' para borrador. NOTA: Si el usuario dice 'aceptada', usa 'paid'." 
            }
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
        description: "Listar cotizaciones recientes. Si el usuario menciona un cliente específico (ej: 'para Cranealo', 'de QuAl'), usa el parámetro clientName para filtrar solo las cotizaciones de ese cliente.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Número de cotizaciones a listar", default: 10 },
            clientName: { type: "string", description: "Nombre del cliente para filtrar (opcional). Si el usuario dice 'para X', 'de X', 'de X cliente', usa X como clientName." }
          },
          required: []
        }
      },
      {
        name: "list_invoices",
        description: "Listar facturas recientes. Si el usuario menciona un cliente específico (ej: 'para Cranealo', 'de QuAl'), usa el parámetro clientName para filtrar solo las facturas de ese cliente.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Número de facturas a listar", default: 10 },
            clientName: { type: "string", description: "Nombre del cliente para filtrar (opcional). Si el usuario dice 'para X', 'de X', 'de X cliente', usa X como clientName." }
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
      const choice = aiResponse.choices?.[0]

      if (choice?.message?.function_calls) {
        functionCalls = choice.message.function_calls.map((fc: any) => ({
          name: fc.name,
          arguments: fc.arguments
        }))
      } else if (choice?.message?.function_call) {
        functionCalls = [
          {
            name: choice.message.function_call.name,
            arguments: choice.message.function_call.arguments
          }
        ]
      }
    } else if (GEMINI_API_KEY) {
      console.log('[Chat API] Usando Gemini')
      console.log('[Chat API] Historial de conversación:', conversationHistory.length, 'mensajes')
      
      // Construir historial de conversación para contexto
      let historyContext = ''
      if (conversationHistory && conversationHistory.length > 0) {
        historyContext = '\n\nHistorial de la conversación:\n'
        conversationHistory.slice(-10).forEach((msg: any) => {
          if (msg.role === 'user') {
            historyContext += `Usuario: ${msg.content}\n`
          } else if (msg.role === 'assistant') {
            historyContext += `Asistente: ${msg.content}\n`
          }
        })
      }
      
      const fullPrompt = `${systemPrompt}${historyContext}

Usuario dice: "${message}"

IMPORTANTE: Mantén el contexto de la conversación anterior. Si el usuario está respondiendo a una pregunta tuya, usa la información previa para completar la acción.

INSTRUCCIONES CRÍTICAS:
1. Si el usuario quiere crear algo y ya tienes TODA la información necesaria (cliente, monto, descripción/título), DEBES responder SOLO con un JSON válido, sin texto adicional antes o después.

2. El formato del JSON DEBE ser exactamente:
{
  "message": "tu respuesta amigable al usuario",
  "function_calls": [{"name": "create_quote", "arguments": {"clientName": "...", "amount": ..., "description": "...", "currency": "USD"}}]
}

3. Si falta información, responde de forma conversacional (sin JSON) preguntando qué falta.

4. Cuando tengas toda la información y vayas a crear la cotización, responde SOLO con el JSON, sin texto adicional.

Ejemplo de respuesta cuando tienes toda la info:
{
  "message": "¡Perfecto! Estoy creando la cotización para Cranealo por $650 para Sitio Web. ¡Un momento!",
  "function_calls": [{"name": "create_quote", "arguments": {"clientName": "Cranealo", "amount": 650, "description": "Sitio Web", "currency": "USD"}}]
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
      
      console.log('[Chat API] Respuesta recibida de gemini-2.5-flash:', text.substring(0, 1000))
      
      // Intentar extraer JSON del texto (puede estar en un bloque de código o mezclado con texto)
      let parsed: any = null
      let extractedJson: string | null = null
      let messageText: string | null = null
      
      // Buscar JSON en bloques de código (más específico primero)
      const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/)
      if (jsonBlockMatch) {
        extractedJson = jsonBlockMatch[1].trim()
        // Extraer el texto antes del bloque JSON
        const textBefore = text.substring(0, text.indexOf(jsonBlockMatch[0])).trim()
        if (textBefore) {
          messageText = textBefore
        }
        console.log('[Chat API] JSON encontrado en bloque de código')
      } else {
        // Buscar JSON directamente (entre llaves) - buscar el más completo
        const jsonMatches = text.match(/\{[\s\S]*?\}/g)
        if (jsonMatches && jsonMatches.length > 0) {
          // Tomar el JSON más largo (probablemente el correcto)
          extractedJson = jsonMatches.reduce((a: string, b: string) => a.length > b.length ? a : b)
          // Extraer el texto antes del JSON
          const jsonIndex = text.indexOf(extractedJson)
          if (jsonIndex > 0) {
            const textBefore = text.substring(0, jsonIndex).trim()
            if (textBefore) {
              messageText = textBefore
            }
          }
          console.log('[Chat API] JSON encontrado directamente en el texto')
        }
      }
      
      if (extractedJson) {
        try {
          // Limpiar el JSON antes de parsear
          extractedJson = extractedJson
            .trim()
            .replace(/^[\s`]+|[\s`]+$/g, "")
            .replace(/```json/gi, "")
            .replace(/```/g, "")
          
          parsed = JSON.parse(extractedJson)
          // Si hay texto antes del JSON y el parsed.message está vacío o es muy corto, usar el texto extraído
          if (messageText && (!parsed.message || parsed.message.length < 10)) {
            parsed.message = messageText
          }
          console.log('[Chat API] JSON extraído y parseado exitosamente:', JSON.stringify(parsed, null, 2))
        } catch (parseError: any) {
          console.warn('[Chat API] Error al parsear JSON extraído:', parseError.message)
          console.warn('[Chat API] JSON que falló:', extractedJson.substring(0, 200))
        }
      }
      
      if (parsed && parsed.message) {
        // Si hay function_calls, asegurarse de que el mensaje no contenga JSON
        let cleanMessage = parsed.message
        if (parsed.function_calls && parsed.function_calls.length > 0) {
          // Limpiar cualquier JSON residual del mensaje
          cleanMessage = cleanMessage
            .replace(/```json[\s\S]*?```/gi, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\{[\s\S]*?function_calls[\s\S]*?\}/gi, '')
            .replace(/\{[\s\S]*?"name"[\s\S]*?"arguments"[\s\S]*?\}/gi, '')
            .trim()
        }
        
        aiResponse = { message: { content: cleanMessage }, function_calls: parsed.function_calls || [] }
        functionCalls = parsed.function_calls || []
        console.log('[Chat API] Function calls encontrados:', functionCalls.length)
        if (functionCalls.length > 0) {
          console.log('[Chat API] Detalles de function calls:', JSON.stringify(functionCalls, null, 2))
        }
      } else {
        // Si no se pudo parsear, intentar extraer el texto antes del JSON
        let cleanText = text
        // Si el texto contiene JSON, extraer solo la parte antes del JSON
        if (text.includes('function_calls') || text.includes('"name"') || text.includes('"arguments"')) {
          const textBeforeJson = text.match(/(.*?)(?:\{[\s\S]*function_calls[\s\S]*\}|```json[\s\S]*?```|```[\s\S]*?```)/i)
          if (textBeforeJson && textBeforeJson[1].trim()) {
            cleanText = textBeforeJson[1].trim()
          } else {
            // Si no hay texto antes, limpiar todo el JSON
            cleanText = text
              .replace(/```json[\s\S]*?```/gi, '')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/\{[\s\S]*?function_calls[\s\S]*?\}/gi, '')
              .replace(/\{[\s\S]*?"name"[\s\S]*?"arguments"[\s\S]*?\}/gi, '')
              .trim()
          }
        }
        
        console.warn('[Chat API] No se encontró JSON válido, usando texto limpio')
        console.warn('[Chat API] Texto original:', text.substring(0, 200))
        console.warn('[Chat API] Texto limpio:', cleanText.substring(0, 200))
        aiResponse = { message: { content: cleanText } }
        functionCalls = []
      }
    } else {
      return NextResponse.json({
        message: "Lo siento, no tengo acceso a la IA en este momento. Por favor, configura OPENAI_API_KEY o GEMINI_API_KEY.",
        actions: []
      })
    }

    // Ejecutar function calls
    console.log('[Chat API] Ejecutando function calls:', functionCalls.length)
    if (functionCalls.length === 0) {
      console.warn('[Chat API] ⚠️ No hay function calls para ejecutar')
    }
    
    for (const funcCall of functionCalls) {
      try {
        console.log('[Chat API] Procesando function call:', funcCall.name)
        console.log('[Chat API] Arguments recibidos (raw):', funcCall.arguments)
        
        let args: any
        if (typeof funcCall.arguments === "string") {
          try {
            args = JSON.parse(funcCall.arguments)
          } catch (parseError) {
            console.error('[Chat API] Error al parsear arguments como string:', parseError)
            args = funcCall.arguments
          }
        } else {
          args = funcCall.arguments
        }

        // Normalizar argumentos (corregir nombres de parámetros)
        if (funcCall.name === "update_quote_status" && args) {
          // Corregir newStatus -> status
          if (args.newStatus && !args.status) {
            args.status = args.newStatus
            delete args.newStatus
          }
          // Resolver IDs cuando el usuario dice "la última" o similar
          if (!args.quoteId) {
            if (recentQuotes.length > 0) {
              args.quoteId = recentQuotes[0].id
              console.log('[Chat API] Usando cotización más reciente:', args.quoteId)
            }
          }
        }
        
        if (funcCall.name === "update_invoice_status" && args) {
          // Corregir newStatus -> status
          if (args.newStatus && !args.status) {
            args.status = args.newStatus
            delete args.newStatus
          }
          // Normalizar estado: si viene "accepted" para una factura, cambiarlo a "paid"
          if (args.status && args.status.toLowerCase() === "accepted") {
            args.status = "paid"
            console.log('[Chat API] Normalizando estado: accepted -> paid para factura')
          }
          // Resolver IDs cuando el usuario dice "la última" o similar
          if (!args.invoiceId) {
            if (recentInvoices.length > 0) {
              args.invoiceId = recentInvoices[0].id
              console.log('[Chat API] Usando factura más reciente:', args.invoiceId)
            }
          }
        }

        console.log('[Chat API] Arguments parseados:', JSON.stringify(args, null, 2))
        const result = await executeFunction(funcCall.name, args, company.id, authUser.userId)
        console.log('[Chat API] ✅ Resultado de executeFunction:', JSON.stringify(result, null, 2))
        if (result) {
          executedActions.push(result)
        } else {
          console.warn('[Chat API] ⚠️ executeFunction no devolvió resultado')
        }
      } catch (error: any) {
        console.error(`[Chat API] ❌ Error ejecutando función ${funcCall.name}:`, error)
        console.error(`[Chat API] Error message:`, error?.message)
        console.error(`[Chat API] Error stack:`, error?.stack)
        executedActions.push({
          type: "error",
          data: { message: `Error al ejecutar ${funcCall.name}: ${error.message}` }
        })
      }
    }
    
    console.log('[Chat API] Total de acciones ejecutadas:', executedActions.length)

    // Construir mensaje de respuesta
    let responseMessage = aiResponse.message?.content || aiResponse.choices?.[0]?.message?.content || "Entendido, he procesado tu solicitud."

    // Limpiar el mensaje: eliminar JSON crudo, código Python, y otros artefactos si hay function calls ejecutados
    if (functionCalls.length > 0) {
      // Detectar si el mensaje contiene código o JSON
      const hasCode = responseMessage.includes("function_calls") || 
                      responseMessage.includes('"name"') || 
                      responseMessage.includes('"arguments"') || 
                      responseMessage.includes('}') || 
                      responseMessage.includes(']') ||
                      responseMessage.includes('print(') ||
                      responseMessage.includes('tool_code') ||
                      responseMessage.includes('list_quotes(') ||
                      responseMessage.includes('list_invoices(') ||
                      responseMessage.includes('list_clients(')
      
      if (hasCode) {
        // Eliminar bloques tool_code completos (incluyendo el label)
        responseMessage = responseMessage
          .replace(/tool_code[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '') // Eliminar tool_code y todo lo que sigue hasta el final o nueva línea
          .replace(/```[\s\S]*?```/gi, '') // Eliminar bloques de código
          .replace(/print\([^)]*\)/gi, '') // Eliminar llamadas print()
          .replace(/list_\w+\([^)]*\)/gi, '') // Eliminar llamadas a funciones list_*
          .replace(/```json[\s\S]*?```/gi, '')
          .replace(/\{[\s\S]*?function_calls[\s\S]*?\}/gi, '')
          .replace(/\{[\s\S]*?"name"[\s\S]*?"arguments"[\s\S]*?\}/gi, '')
          .replace(/\[[\s\S]*?\]/g, '') // Eliminar arrays JSON
          .replace(/\{[\s\S]*?\}/g, '') // Eliminar cualquier objeto JSON restante
          .replace(/^[\s\}\]]+$/gm, '') // Eliminar líneas que solo contengan llaves o corchetes
          .replace(/[\}\]]+/g, '') // Eliminar llaves y corchetes sueltos
          .trim()
        
        // Si después de limpiar queda vacío o solo tiene caracteres especiales, usar mensaje vacío
        if (!responseMessage || /^[\s\}\]]+$/.test(responseMessage)) {
          responseMessage = ""
        }
      }
    }

    // Verificar si hay cambios de estado (prioridad sobre listas)
    const hasStatusUpdate = executedActions.some(a => a.type === "status_updated")
    
    // Si hay listas, mejorar el mensaje para que sea más claro
    const hasListActions = executedActions.some(a => 
      ["clients_listed", "quotes_listed", "invoices_listed"].includes(a.type)
    )
    
    // Si hay cambio de estado, NO mostrar listas, solo confirmar el cambio
    if (hasStatusUpdate) {
      const statusAction = executedActions.find(a => a.type === "status_updated")
      if (statusAction) {
        const docId = statusAction.data.quoteId || statusAction.data.invoiceId
        const status = statusAction.data.status
        const statusLabels: Record<string, string> = {
          "accepted": "aceptada",
          "rejected": "rechazada",
          "sent": "enviada",
          "paid": "pagada",
          "draft": "borrador",
          "overdue": "vencida",
          "cancelled": "cancelada"
        }
        const statusLabel = statusLabels[status.toLowerCase()] || status
        
        // Si el mensaje de la IA ya es bueno, usarlo; si no, crear uno mejor
        if (!responseMessage.includes("actualizado") && !responseMessage.includes("cambiado") && !responseMessage.includes(statusLabel)) {
          responseMessage = `¡Listo! ✅ He cambiado el estado de ${docId} a ${statusLabel.toUpperCase()}.`
        }
      }
    } else if (hasListActions) {
      // Si hay listas, SIEMPRE reemplazar el mensaje con uno amigable (ignorar cualquier código residual)
      const listAction = executedActions.find(a => 
        ["clients_listed", "quotes_listed", "invoices_listed"].includes(a.type)
      )
      if (listAction) {
        // Extraer el nombre del cliente de los argumentos si está disponible
        let clientName: string | null = null
        const listFunctionCall = functionCalls.find(fc => 
          ["list_quotes", "list_invoices"].includes(fc.name)
        )
        if (listFunctionCall) {
          try {
            let args: any = listFunctionCall.arguments
            if (typeof args === 'string') {
              args = JSON.parse(args)
            }
            if (args && typeof args === 'object' && 'clientName' in args) {
              clientName = args.clientName
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
        
        if (listAction.type === "clients_listed") {
          const count = listAction.data?.clients?.length || 0
          responseMessage = `¡Perfecto! Aquí tienes tu lista de clientes${count > 0 ? ` (${count} ${count === 1 ? 'cliente' : 'clientes'})` : ''}:`
        } else if (listAction.type === "quotes_listed") {
          const count = listAction.data?.quotes?.length || 0
          if (clientName) {
            responseMessage = `¡Claro! Aquí tienes las cotizaciones para ${clientName}${count > 0 ? ` (${count} ${count === 1 ? 'cotización' : 'cotizaciones'})` : ''}:`
          } else {
            responseMessage = `¡Claro! Aquí tienes las cotizaciones${count > 0 ? ` (${count} ${count === 1 ? 'cotización' : 'cotizaciones'})` : ''}:`
          }
        } else if (listAction.type === "invoices_listed") {
          const count = listAction.data?.invoices?.length || 0
          if (clientName) {
            responseMessage = `¡Claro! Aquí tienes las facturas para ${clientName}${count > 0 ? ` (${count} ${count === 1 ? 'factura' : 'facturas'})` : ''}:`
          } else {
            responseMessage = `¡Claro! Aquí tienes las facturas${count > 0 ? ` (${count} ${count === 1 ? 'factura' : 'facturas'})` : ''}:`
          }
        }
      }
    } else {
      // Agregar información sobre acciones ejecutadas (solo si no son listas ni cambios de estado)
      if (executedActions.length > 0) {
        const actionsSummary = executedActions
          .filter(a => a.type !== "error" && !["clients_listed", "quotes_listed", "invoices_listed", "status_updated"].includes(a.type))
          .map(a => {
            if (a.type === "quote_created") return `✅ Cotización ${a.data.id} creada`
            if (a.type === "invoice_created") return `✅ Factura ${a.data.id} creada`
            if (a.type === "email_sent") return `📧 ${a.data.message}`
            return null
          })
          .filter(Boolean)
          .join("\n")

        if (actionsSummary) {
          responseMessage += `\n\n${actionsSummary}`
        }
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
      console.log('[Chat API] create_quote - args recibidos:', args)
      
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
      console.log('[Chat API] create_quote - cliente encontrado/creado:', clientId)

      // Si viene amount y description, crear un item automáticamente
      let items = args.items || []
      if (!items.length && args.amount) {
        items = [{
          description: args.description || args.title || "Servicio",
          qty: 1,
          price: parseFloat(args.amount)
        }]
        console.log('[Chat API] create_quote - items creados desde amount:', items)
      }

      // Calcular totales
      const tax = args.tax ?? settings?.defaultTaxRate ?? 21
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
      const taxAmount = (subtotal * tax) / 100
      const total = Math.round((subtotal + taxAmount) * 100) / 100
      console.log('[Chat API] create_quote - totales calculados:', { subtotal, taxAmount, total })

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
          title: args.title || args.description || "Cotización",
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
      console.log('[Chat API] create_quote - cotización creada:', quote.id)

      // Crear items
      for (const item of items) {
        await prisma.quoteItem.create({
          data: {
            id: `item_${nanoid(16)}`,
            quoteId: quote.id,
            description: item.description,
            qty: item.qty || 1,
            price: item.price
          }
        })
      }
      console.log('[Chat API] create_quote - items creados:', items.length)

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
      console.log('[Chat API] create_invoice - args recibidos:', args)
      
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
      console.log('[Chat API] create_invoice - cliente encontrado/creado:', clientId)

      // Si viene amount y description, crear un item automáticamente
      let items = args.items || []
      if (!items.length && args.amount) {
        items = [{
          description: args.description || args.title || "Servicio",
          qty: 1,
          price: parseFloat(args.amount)
        }]
        console.log('[Chat API] create_invoice - items creados desde amount:', items)
      }

      // Calcular totales
      const tax = args.tax ?? settings?.defaultTaxRate ?? 21
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.qty * item.price), 0)
      const taxAmount = (subtotal * tax) / 100
      const total = Math.round((subtotal + taxAmount) * 100) / 100
      console.log('[Chat API] create_invoice - totales calculados:', { subtotal, taxAmount, total })

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
          title: args.title || args.description || "Factura",
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
              qty: item.qty || 1,
              price: item.price
            }))
          }
        }
      })
      console.log('[Chat API] create_invoice - factura creada:', invoice.id)

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
      const whereClause: any = { companyId }
      
      // Filtrar por cliente si se proporciona
      if (args.clientName) {
        console.log('[Chat API] Filtrando cotizaciones por cliente:', args.clientName)
        whereClause.Client = {
          name: {
            contains: args.clientName,
            mode: 'insensitive'
          }
        }
      } else {
        console.log('[Chat API] No hay filtro de cliente, mostrando todas las cotizaciones')
      }
      
      console.log('[Chat API] Where clause para list_quotes:', JSON.stringify(whereClause, null, 2))
      
      const quotes = await prisma.quote.findMany({
        where: whereClause,
        select: { id: true, title: true, status: true, total: true, Client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: args.limit || 10
      })

      console.log('[Chat API] Cotizaciones encontradas:', quotes.length)
      if (quotes.length > 0) {
        console.log('[Chat API] Primer cliente encontrado:', quotes[0].Client?.name)
      }

      return {
        type: "quotes_listed",
        data: { quotes }
      }
    }

    case "list_invoices": {
      const whereClause: any = { companyId }
      
      // Filtrar por cliente si se proporciona
      if (args.clientName) {
        whereClause.Client = {
          name: {
            contains: args.clientName,
            mode: 'insensitive'
          }
        }
      }
      
      const invoices = await prisma.invoice.findMany({
        where: whereClause,
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

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function detectDirectListRequest(
  normalizedMessage: string,
  availableClients: Array<{ name: string; email?: string | null }>
): { functionName: "list_clients" | "list_quotes" | "list_invoices"; responseMessage: string; hasClientFilter: boolean } | null {
  const listKeywords = [
    "lista",
    "listado",
    "muestrame",
    "muestreme",
    "mostrar",
    "mostrame",
    "ver",
    "ensename",
    "enseneme",
    "dame",
    "quiero ver",
    "quiero la",
    "quiero el",
    "mis",
    "todas",
    "toda",
    "tus",
    "las",
    "cuales",
    "cual"
  ]
  const hasListIntent = listKeywords.some(keyword => normalizedMessage.includes(keyword))
  const isShortRequest = normalizedMessage.length <= 60

  // Detectar si hay mención de un cliente específico
  let hasClientFilter = false
  let mentionedClient: string | null = null
  
  // Buscar patrones como "para X", "de X", "del cliente X", etc.
  const clientPatterns = [
    /(?:para|de|del|del cliente|de la empresa)\s+([a-záéíóúñ]+)/i,
    /([a-záéíóúñ]+)\s+(?:cliente|empresa)/i
  ]
  
  for (const pattern of clientPatterns) {
    const match = normalizedMessage.match(pattern)
    if (match && match[1]) {
      const potentialClient = match[1].trim()
      // Verificar si coincide con algún cliente disponible
      const foundClient = availableClients.find(c => 
        c.name.toLowerCase().includes(potentialClient.toLowerCase()) ||
        potentialClient.toLowerCase().includes(c.name.toLowerCase())
      )
      if (foundClient) {
        hasClientFilter = true
        mentionedClient = foundClient.name
        break
      }
    }
  }

  // Excluir solicitudes de creación
  const createKeywords = ["crear", "nueva", "nuevo", "nuevas", "nuevos", "generar", "hacer"]
  const hasCreateIntent = createKeywords.some(keyword => normalizedMessage.includes(keyword))
  
  // Si es una solicitud de creación, NO usar detección directa, dejar que la IA lo procese
  if (hasCreateIntent) {
    return null
  }

  const wantsQuotes = normalizedMessage.includes("cotiz")
  const wantsInvoices = normalizedMessage.includes("factur")
  const wantsClients = normalizedMessage.includes("cliente") && !wantsQuotes && !wantsInvoices

  if (!(hasListIntent || isShortRequest)) {
    return null
  }

  // Si hay filtro por cliente, NO usar detección directa, dejar que la IA lo procese
  if (hasClientFilter) {
    return null
  }

  if (wantsQuotes) {
    return {
      functionName: "list_quotes",
      responseMessage: "¡Claro! Aquí tienes la lista de tus cotizaciones recientes. 😊",
      hasClientFilter: false
    }
  }

  if (wantsInvoices) {
    return {
      functionName: "list_invoices",
      responseMessage: "¡Por supuesto! Estas son tus facturas más recientes.",
      hasClientFilter: false
    }
  }

  if (wantsClients) {
    return {
      functionName: "list_clients",
      responseMessage: "Con gusto, aquí tienes el listado de tus clientes.",
      hasClientFilter: false
    }
  }

  return null
}

