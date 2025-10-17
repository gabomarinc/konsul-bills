import Stripe from "stripe"
import { prisma } from "./prisma"
import crypto from "crypto"

// Función para desencriptar la Secret Key de Stripe
function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32', 'utf8').slice(0, 32)
  const parts = text.split(':')
  const iv = Buffer.from(parts.shift()!, 'hex')
  const encrypted = parts.join(':')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Obtiene el cliente de Stripe para una compañía específica
 * @param companyId - ID de la compañía
 * @returns Cliente de Stripe inicializado o null si no está configurado
 */
export async function getStripeClient(companyId: string): Promise<Stripe | null> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId }
    })

    if (!settings?.stripeEnabled || !settings?.stripeSecretKey) {
      console.log("Stripe no está configurado para esta compañía")
      return null
    }

    // Desencriptar la secret key
    const secretKey = decrypt(settings.stripeSecretKey)

    // Inicializar el cliente de Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia"
    })

    return stripe
  } catch (error) {
    console.error("Error al inicializar Stripe:", error)
    return null
  }
}

/**
 * Verifica si Stripe está configurado para una compañía
 * @param companyId - ID de la compañía
 * @returns true si Stripe está configurado y habilitado
 */
export async function isStripeEnabled(companyId: string): Promise<boolean> {
  const settings = await prisma.companySettings.findUnique({
    where: { companyId },
    select: { stripeEnabled: true, stripeSecretKey: true }
  })

  return !!(settings?.stripeEnabled && settings?.stripeSecretKey)
}

