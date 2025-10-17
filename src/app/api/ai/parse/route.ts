import { NextResponse } from "next/server"

// util: fecha ISO YYYY-MM-DD (hoy + offset días)
function iso(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  const { prompt } = await req.json()
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
  }

  const t = prompt.replace(/\s+/g, " ").trim()

  // email (simple)
  const clientEmail =
    t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null

  // nombre cliente (heurísticas básicas)
  let clientName = "Cliente"
  const name1 = t.match(/cliente\s+(se\s+llama|es)\s+([^,.;]+)/i)
  if (name1) clientName = name1[2].trim()
  else {
    const name2 = t.match(/para\s+([^,.;]+)/i)
    if (name2) clientName = name2[1].trim()
  }

  // moneda
  const currency: "EUR" | "USD" = /usd|\$/i.test(t) ? "USD" : "EUR"

  // montos: tomamos el mayor como precio principal si no hay desglose
  const nums = [...t.matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map(m => parseFloat(m[1].replace(",", ".")))
    .filter(n => !isNaN(n))
  const amount = nums.length ? Math.max(...nums) : 0

  // título
  const title =
    t.match(/cotizaci[oó]n(?:\s+de)?\s+([^.,;]+)/i)?.[1]?.trim() ||
    t.match(/factura(?:\s+de)?\s+([^.,;]+)/i)?.[1]?.trim() ||
    "Quote"

  // resultado
  return NextResponse.json({
    clientName,
    clientEmail,
    currency,
    issueDate: iso(0),
    dueDate: iso(15),
    tax: 21,
    items: [{ description: t.slice(0, 120), qty: 1, price: amount }],
    notes: "",
    title,
  })
}
