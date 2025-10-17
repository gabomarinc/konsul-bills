import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

/**
 * Genera un ID único para secuencias
 */
export function generateSequenceId(type: string): string {
  return `seq_${type.toLowerCase()}_${nanoid(12)}`
}

/**
 * Genera el próximo ID legible para humanos (INV-00001, Q-00001, etc.)
 */
export async function nextHumanId(opts: {
  companyId: string
  type: "QUOTE" | "INVOICE"
  prefix: string
  padding?: number
}) {
  const { companyId, type, prefix, padding = 5 } = opts

  const seq = await prisma.sequence.upsert({
    where: { companyId_type: { companyId, type } },
    create: { 
      id: generateSequenceId(type),
      companyId, 
      type, 
      current: 1 
    },
    update: { current: { increment: 1 } },
  })

  const n = seq.current
  return `${prefix}${String(n).padStart(padding, "0")}`
}
