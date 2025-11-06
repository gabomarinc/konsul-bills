/**
 * Procesador de lenguaje natural para Telegram usando OpenAI o Gemini
 */

export interface ParsedIntent {
  intent: 'create_invoice' | 'create_quote' | 'list_clients' | 'query' | 'unknown'
  clientName?: string
  clientEmail?: string
  items?: Array<{ description: string; qty: number; price: number }>
  title?: string
  currency?: string
  tax?: number
  actions?: string[] // ['send_email', 'notify', etc.]
  confidence: number
}

/**
 * Procesa lenguaje natural usando OpenAI
 */
export async function parseWithOpenAI(
  message: string,
  availableClients: Array<{ name: string; email?: string | null }>
): Promise<ParsedIntent> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurado')
  }

  const clientsList = availableClients
    .map(c => `- ${c.name}${c.email ? ` (${c.email})` : ''}`)
    .join('\n')

  const systemPrompt = `Eres un asistente para gestionar facturas y cotizaciones.

Puedes crear facturas y cotizaciones cuando el usuario lo solicite.

Clientes disponibles:
${clientsList || 'No hay clientes registrados'}

Cuando el usuario pida crear algo, extrae:
- Tipo: "factura" o "cotización"
- Cliente: nombre del cliente (debe coincidir con uno de la lista o ser nuevo)
- Items: descripción, cantidad, precio
- Título: descripción breve del trabajo/servicio
- Monto total si se menciona
- Acciones: "enviar email", "notificar", etc.

Responde SOLO con JSON válido en este formato:
{
  "intent": "create_invoice" | "create_quote" | "list_clients" | "query" | "unknown",
  "clientName": "nombre del cliente",
  "clientEmail": "email si se menciona",
  "items": [{"description": "...", "qty": 1, "price": 100}],
  "title": "título de la factura/cotización",
  "currency": "EUR" | "USD",
  "tax": 21,
  "actions": ["send_email"],
  "confidence": 0.9
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Más económico que gpt-4
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content) as ParsedIntent
    return parsed
  } catch (error) {
    console.error('Error procesando con OpenAI:', error)
    throw error
  }
}

/**
 * Procesa lenguaje natural usando Gemini
 */
export async function parseWithGemini(
  message: string,
  availableClients: Array<{ name: string; email?: string | null }>
): Promise<ParsedIntent> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurado')
  }

  const clientsList = availableClients
    .map(c => `- ${c.name}${c.email ? ` (${c.email})` : ''}`)
    .join('\n')

  const prompt = `Eres un asistente para gestionar facturas y cotizaciones.

Clientes disponibles:
${clientsList || 'No hay clientes registrados'}

Cuando el usuario pida crear algo, extrae:
- Tipo: "factura" o "cotización"
- Cliente: nombre del cliente
- Items: descripción, cantidad, precio
- Título: descripción breve
- Monto total si se menciona
- Acciones: "enviar email", etc.

Responde SOLO con JSON válido:
{
  "intent": "create_invoice" | "create_quote" | "list_clients" | "query" | "unknown",
  "clientName": "nombre",
  "clientEmail": "email si se menciona",
  "items": [{"description": "...", "qty": 1, "price": 100}],
  "title": "título",
  "currency": "EUR" | "USD",
  "tax": 21,
  "actions": ["send_email"],
  "confidence": 0.9
}

Mensaje del usuario: ${message}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const data = await response.json()
    const content = data.candidates[0]?.content?.parts[0]?.text
    
    if (!content) {
      throw new Error('No response from Gemini')
    }

    // Extraer JSON del texto (puede venir con markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent
    return parsed
  } catch (error) {
    console.error('Error procesando con Gemini:', error)
    throw error
  }
}

/**
 * Procesa lenguaje natural (usa OpenAI si está disponible, sino Gemini, sino fallback básico)
 */
export async function parseNaturalLanguage(
  message: string,
  availableClients: Array<{ name: string; email?: string | null }>
): Promise<ParsedIntent> {
  // Intentar OpenAI primero
  if (process.env.OPENAI_API_KEY) {
    try {
      return await parseWithOpenAI(message, availableClients)
    } catch (error) {
      console.error('Error con OpenAI, intentando Gemini:', error)
    }
  }

  // Intentar Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      return await parseWithGemini(message, availableClients)
    } catch (error) {
      console.error('Error con Gemini:', error)
    }
  }

  // Fallback: parseo básico (el que ya tienes)
  return parseBasic(message)
}

/**
 * Parseo básico sin IA (fallback)
 */
function parseBasic(message: string): ParsedIntent {
  const t = message.replace(/\s+/g, " ").trim().toLowerCase()
  
  // Detectar intent
  let intent: ParsedIntent['intent'] = 'unknown'
  if (t.includes('factura') || t.includes('invoice')) {
    intent = 'create_invoice'
  } else if (t.includes('cotización') || t.includes('quote') || t.includes('cotizacion')) {
    intent = 'create_quote'
  } else if (t.includes('cliente') && (t.includes('lista') || t.includes('listar'))) {
    intent = 'list_clients'
  }

  // Extraer cliente
  let clientName = 'Cliente'
  const nameMatch = t.match(/cliente\s+([^,.;]+)|para\s+([^,.;]+)/i)
  if (nameMatch) {
    clientName = (nameMatch[1] || nameMatch[2] || '').trim()
  }

  // Extraer email
  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const clientEmail = emailMatch ? emailMatch[0] : undefined

  // Extraer monto
  const nums = [...message.matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map(m => parseFloat(m[1].replace(",", ".")))
    .filter(n => !isNaN(n) && n > 0)
  const amount = nums.length ? Math.max(...nums) : 0

  // Detectar moneda
  const currency = /usd|\$/i.test(message) ? 'USD' : 'EUR'

  // Título
  const title = 
    message.match(/cotizaci[oó]n(?:\s+de)?\s+([^.,;]+)/i)?.[1]?.trim() ||
    message.match(/factura(?:\s+de)?\s+([^.,;]+)/i)?.[1]?.trim() ||
    message.match(/sobre\s+([^.,;]+)/i)?.[1]?.trim() ||
    'Servicio'

  // Items
  const items = [{
    description: title || 'Servicio',
    qty: 1,
    price: amount
  }]

  // Acciones
  const actions: string[] = []
  if (/envia|enviar|email|correo/i.test(message)) {
    actions.push('send_email')
  }

  return {
    intent,
    clientName,
    clientEmail,
    items: amount > 0 ? items : undefined,
    title,
    currency,
    tax: 21,
    actions,
    confidence: 0.5 // Bajo porque es fallback
  }
}

