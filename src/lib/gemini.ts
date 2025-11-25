type GeminiQuote = {
  clientName?: string
  clientEmail?: string
  title?: string
  description?: string
  amount?: number
  currency?: string
  tax?: number
  issueDate?: string
  dueDate?: string
}

export async function extractQuoteFromEmail(emailBody: string): Promise<GeminiQuote | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY no configurado; se omite extracción")
    return null
  }

  const prompt = `
Eres un asistente que extrae datos de cotizaciones en correos electrónicos. 
El resultado debe ser un JSON válido con las siguientes propiedades:
{
  "clientName": string | null,
  "clientEmail": string | null,
  "title": string | null,
  "description": string | null,
  "amount": number | null,
  "currency": string | null,
  "tax": number | null,
  "issueDate": string | null,
  "dueDate": string | null
}

Formato de fechas: YYYY-MM-DD.
Si no encuentras un dato, usa null. Responde solo con JSON válido.

Correo:
${emailBody}
`

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  )

  if (!response.ok) {
    console.error("Error en Gemini:", await response.text())
    return null
  }

  const data = await response.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.output ||
    ""

  if (!text) return null

  try {
    const jsonText = text
      .trim()
      .replace(/^[\s`]+|[\s`]+$/g, "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
    return JSON.parse(jsonText) as GeminiQuote
  } catch (error) {
    console.error("No se pudo parsear respuesta de Gemini:", text)
    return null
  }
}

