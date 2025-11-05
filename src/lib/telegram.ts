import { prisma } from './prisma'
import { generateId } from './db'
import { getUserCompany } from './company-utils'
import { nextHumanId } from './ids'
// No importar TelegramBot aquí para evitar problemas en build

// Tipos para estados de conversación
export type ConversationState = 
  | 'idle'
  | 'creating_invoice_client'
  | 'creating_invoice_title'
  | 'creating_invoice_items'
  | 'creating_quote_client'
  | 'creating_quote_title'
  | 'creating_quote_items'
  | 'searching_client'

export interface ConversationData {
  state: ConversationState
  userId?: string
  draft?: {
    type?: 'invoice' | 'quote'
    clientId?: string
    clientName?: string
    clientEmail?: string
    title?: string
    items?: Array<{ description: string; qty: number; price: number }>
    currentItem?: { description?: string; qty?: number; price?: number }
    similarClients?: Array<{ id: string; name: string; email?: string | null }>
  }
}

// Cache de conversaciones (en producción usar Redis)
const conversations = new Map<number, ConversationData>()

/**
 * Obtiene o crea el estado de conversación para un usuario de Telegram
 */
export function getConversationState(telegramId: number): ConversationData {
  if (!conversations.has(telegramId)) {
    conversations.set(telegramId, { state: 'idle' })
  }
  return conversations.get(telegramId)!
}

/**
 * Actualiza el estado de conversación
 */
export function setConversationState(telegramId: number, data: ConversationData) {
  conversations.set(telegramId, data)
}

/**
 * Limpia el estado de conversación
 */
export function clearConversationState(telegramId: number) {
  conversations.delete(telegramId)
}

/**
 * Obtiene el usuario de la base de datos vinculado a un Telegram ID
 */
export async function getTelegramUser(telegramId: string) {
  return await prisma.telegramUser.findUnique({
    where: { telegramId },
    include: {
      User: {
        include: {
          Membership: {
            include: {
              Company: {
                include: {
                  CompanySettings: true
                }
              }
            }
          }
        }
      }
    }
  })
}

/**
 * Vincula un usuario de Telegram con un usuario del sistema
 */
export async function linkTelegramUser(
  telegramId: string,
  userId: string,
  username?: string,
  firstName?: string,
  lastName?: string
) {
  try {
    // Usar upsert que maneja mejor los casos edge
    // Primero intentar con telegramId como clave única
    const result = await prisma.telegramUser.upsert({
      where: { telegramId },
      update: {
        userId,
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        updatedAt: new Date()
      },
      create: {
        id: generateId('telegram'),
        telegramId,
        userId,
        username: username || null,
        firstName: firstName || null,
        lastName: lastName || null,
        updatedAt: new Date()
      }
    })

    return result
  } catch (error: any) {
    // Si el error es por violación de userId único, intentar actualizar el existente
    if (error?.code === 'P2002' && error?.meta?.target?.includes('userId')) {
      // Ya existe un registro con este userId, actualizarlo
      const existing = await prisma.telegramUser.findUnique({
        where: { userId }
      })
      
      if (existing) {
        return await prisma.telegramUser.update({
          where: { userId },
          data: {
            telegramId,
            username: username || null,
            firstName: firstName || null,
            lastName: lastName || null,
            updatedAt: new Date()
          }
        })
      }
    }
    
    console.error('Error en linkTelegramUser:', error)
    throw error
  }
}

/**
 * Busca clientes por nombre (fuzzy search)
 */
export async function searchClients(companyId: string, searchTerm: string) {
  const clients = await prisma.client.findMany({
    where: {
      companyId,
      name: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    },
    take: 10,
    orderBy: { name: 'asc' }
  })
  return clients
}

/**
 * Verifica si un cliente existe o lo crea/actualiza
 */
export async function ensureClient(
  companyId: string,
  name: string,
  email?: string
) {
  const client = await prisma.client.upsert({
    where: {
      companyId_name: {
        companyId,
        name
      }
    },
    update: {
      email: email || undefined,
      updatedAt: new Date()
    },
    create: {
      id: generateId('client'),
      companyId,
      name,
      email,
      updatedAt: new Date()
    }
  })
  return client
}

/**
 * Obtiene todos los clientes de una empresa
 */
export async function getCompanyClients(companyId: string) {
  return await prisma.client.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true
    }
  })
}

/**
 * Crea una factura desde los datos del estado de conversación
 */
export async function createInvoiceFromConversation(
  companyId: string,
  conversationData: ConversationData
) {
  if (!conversationData.draft || conversationData.draft.type !== 'invoice') {
    throw new Error('Invalid conversation data for invoice')
  }

  const draft = conversationData.draft
  const settings = await prisma.companySettings.findUnique({
    where: { companyId }
  })

  if (!draft.clientId || !draft.title) {
    throw new Error('Missing required fields')
  }

  const items = draft.items || []
  const tax = settings?.defaultTaxRate ?? 21
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const taxAmount = (subtotal * tax) / 100
  const total = subtotal + taxAmount

  // Generar ID de factura
  const prefix = settings?.invoicePrefix ?? 'INV-'
  const padding = settings?.numberPadding ?? 5
  const invoiceId = await nextHumanId({
    companyId,
    type: 'INVOICE',
    prefix,
    padding
  })

  const invoice = await prisma.invoice.create({
    data: {
      id: invoiceId,
      companyId,
      clientId: draft.clientId,
      title: draft.title,
      issueDate: new Date(),
      currency: settings?.defaultCurrency ?? 'EUR',
      tax,
      status: 'DRAFT',
      subtotal,
      taxAmount,
      total,
      balanceDue: total,
      updatedAt: new Date(),
      InvoiceItem: {
        create: items.map(item => ({
          id: generateId('item'),
          description: item.description,
          qty: item.qty,
          price: item.price
        }))
      }
    }
  })

  return invoice
}

/**
 * Crea una cotización desde los datos del estado de conversación
 */
export async function createQuoteFromConversation(
  companyId: string,
  conversationData: ConversationData
) {
  if (!conversationData.draft || conversationData.draft.type !== 'quote') {
    throw new Error('Invalid conversation data for quote')
  }

  const draft = conversationData.draft
  const settings = await prisma.companySettings.findUnique({
    where: { companyId }
  })

  if (!draft.clientId || !draft.title) {
    throw new Error('Missing required fields')
  }

  const items = draft.items || []
  const tax = settings?.defaultTaxRate ?? 21
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const taxAmount = (subtotal * tax) / 100
  const total = subtotal + taxAmount

  // Generar ID de cotización
  const prefix = settings?.quotePrefix ?? 'Q-'
  const padding = settings?.numberPadding ?? 5
  const quoteId = await nextHumanId({
    companyId,
    type: 'QUOTE',
    prefix,
    padding
  })

  const quote = await prisma.quote.create({
    data: {
      id: quoteId,
      companyId,
      clientId: draft.clientId,
      title: draft.title,
      issueDate: new Date(),
      currency: settings?.defaultCurrency ?? 'EUR',
      tax,
      status: 'DRAFT',
      subtotal,
      taxAmount,
      total,
      updatedAt: new Date()
    }
  })

  // Crear items de la cotización
  if (items.length > 0) {
    await prisma.quoteItem.createMany({
      data: items.map(item => ({
        id: generateId('item'),
        quoteId: quote.id,
        description: item.description,
        qty: item.qty,
        price: item.price
      }))
    })
  }

  return quote
}

/**
 * Formatea una lista de clientes para mostrar en Telegram
 */
export function formatClientsList(clients: Array<{ id: string; name: string; email?: string | null }>) {
  if (clients.length === 0) {
    return 'No hay clientes registrados.'
  }

  return clients
    .map((client, index) => {
      const email = client.email ? ` (${client.email})` : ''
      return `${index + 1}. ${client.name}${email}`
    })
    .join('\n')
}

