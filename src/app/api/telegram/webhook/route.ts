import { NextRequest, NextResponse } from 'next/server'
import {
  getTelegramUser,
  linkTelegramUser,
  getConversationState,
  setConversationState,
  clearConversationState,
  searchClients,
  ensureClient,
  getCompanyClients,
  createInvoiceFromConversation,
  createQuoteFromConversation,
  formatClientsList
} from '@/lib/telegram'
import { getUserCompany } from '@/lib/company-utils'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Tipo para el bot (sin importar el módulo)
type TelegramBot = {
  sendMessage(chatId: number, text: string, options?: any): Promise<any>;
  [key: string]: any;
}

// Función para obtener el bot (solo se inicializa cuando se necesita)
function getBot(): TelegramBot | null {
  if (!TELEGRAM_BOT_TOKEN) {
    return null
  }

  // Inicializar dinámicamente para evitar problemas en build
  try {
    // Usar require dinámico para evitar problemas en build time
    const TelegramBotClass = require('node-telegram-bot-api')
    // Intentar con default primero, luego sin default
    const BotConstructor = TelegramBotClass.default || TelegramBotClass
    return new BotConstructor(TELEGRAM_BOT_TOKEN) as TelegramBot
  } catch (error) {
    console.error('Error inicializando Telegram bot:', error)
    return null
  }
}

/**
 * POST /api/telegram/webhook
 * Webhook para recibir actualizaciones de Telegram
 */
export async function POST(req: NextRequest) {
  try {
    const bot = getBot()
    if (!bot) {
      return NextResponse.json(
        { error: 'Telegram bot no configurado' },
        { status: 500 }
      )
    }

    const update = await req.json()

    // Procesar el update de forma asíncrona (no esperar respuesta)
    processTelegramUpdate(update).catch(console.error)

    // Responder inmediatamente a Telegram (requerido)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en webhook de Telegram:', error)
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    )
  }
}

/**
 * Procesa una actualización de Telegram
 */
async function processTelegramUpdate(update: any) {
  const bot = getBot()
  if (!bot || !update.message) return

  const message = update.message
  const chatId = message.chat.id
  const telegramId = String(message.from?.id)
  const text = message.text || ''
  const username = message.from?.username
  const firstName = message.from?.first_name
  const lastName = message.from?.last_name

  try {
    // Obtener o vincular usuario de Telegram
    let telegramUser = await getTelegramUser(telegramId)

    if (!telegramUser) {
      // Usuario no vinculado - requerir vinculación
      await bot.sendMessage(
        chatId,
        '⚠️ No estás vinculado a una cuenta.\n\n' +
        'Para usar el bot, primero necesitas vincular tu cuenta de Telegram.\n' +
        'Visita tu panel de configuración en la aplicación web.'
      )
      return
    }

    const user = telegramUser.User
    const company = await getUserCompany(user.id)

    if (!company) {
      await bot.sendMessage(
        chatId,
        '❌ No se encontró una empresa asociada a tu cuenta.'
      )
      return
    }

    // Obtener estado de conversación
    const conversation = getConversationState(chatId)
    conversation.userId = user.id

    // Procesar comandos
    if (text.startsWith('/')) {
      await handleCommand(chatId, text, conversation, company.id)
    } else {
      // Procesar respuesta según el estado de conversación
      await handleConversation(chatId, text, conversation, company.id)
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error)
    const bot = getBot()
    if (bot) {
      try {
        await bot.sendMessage(
          chatId,
          '❌ Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.\n\n' +
          `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
        )
      } catch (sendError) {
        console.error('Error enviando mensaje de error:', sendError)
      }
    }
  }
}

/**
 * Maneja comandos de Telegram
 */
async function handleCommand(
  chatId: number,
  command: string,
  conversation: any,
  companyId: string
) {
  const bot = getBot()
  if (!bot) {
    console.error('Bot no inicializado en handleCommand')
    return
  }

  const cmd = command.split(' ')[0].toLowerCase()
  console.log('Procesando comando:', cmd, 'para chatId:', chatId)

  try {
    switch (cmd) {
    case '/start':
      await bot.sendMessage(
        chatId,
        '👋 ¡Hola! Soy tu asistente de Konsul Bills.\n\n' +
        'Comandos disponibles:\n' +
        '/crear_factura - Crear una nueva factura\n' +
        '/crear_cotizacion - Crear una nueva cotización\n' +
        '/clientes - Listar todos los clientes\n' +
        '/cancelar - Cancelar operación en curso\n' +
        '/ayuda - Mostrar esta ayuda'
      )
      clearConversationState(chatId)
      break

    case '/crear_factura':
      setConversationState(chatId, {
        state: 'creating_invoice_client',
        draft: { type: 'invoice', items: [] }
      })
      await bot.sendMessage(
        chatId,
        '📝 Creando nueva factura...\n\n' +
        '¿Cuál es el nombre del cliente?\n' +
        '(Puedes escribir el nombre completo o buscar entre tus clientes)'
      )
      break

    case '/crear_cotizacion':
      setConversationState(chatId, {
        state: 'creating_quote_client',
        draft: { type: 'quote', items: [] }
      })
      await bot.sendMessage(
        chatId,
        '📋 Creando nueva cotización...\n\n' +
        '¿Cuál es el nombre del cliente?\n' +
        '(Puedes escribir el nombre completo o buscar entre tus clientes)'
      )
      break

    case '/clientes':
      const clients = await getCompanyClients(companyId)
      const clientsList = formatClientsList(clients)
      await bot.sendMessage(
        chatId,
        `📋 Tus clientes:\n\n${clientsList}`
      )
      break

    case '/cancelar':
      clearConversationState(chatId)
      await bot.sendMessage(chatId, '✅ Operación cancelada.')
      break

    case '/ayuda':
      await bot.sendMessage(
        chatId,
        '📖 Comandos disponibles:\n\n' +
        '/crear_factura - Crear una nueva factura\n' +
        '/crear_cotizacion - Crear una nueva cotización\n' +
        '/clientes - Listar todos los clientes\n' +
        '/cancelar - Cancelar operación en curso\n' +
        '/ayuda - Mostrar esta ayuda'
      )
      break

    default:
      await bot.sendMessage(
        chatId,
        '❌ Comando no reconocido. Usa /ayuda para ver los comandos disponibles.'
      )
    }
  } catch (error) {
    console.error('Error en handleCommand:', error)
    try {
      await bot.sendMessage(
        chatId,
        '❌ Error al procesar el comando. Por favor, intenta de nuevo.\n\n' +
        `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    } catch (sendError) {
      console.error('Error enviando mensaje de error:', sendError)
    }
  }
}

/**
 * Maneja conversaciones según el estado actual
 */
async function handleConversation(
  chatId: number,
  text: string,
  conversation: any,
  companyId: string
) {
  const bot = getBot()
  if (!bot) return

  const state = conversation.state

  // Verificar si hay clientes similares antes de crear uno nuevo
  if (state === 'creating_invoice_client' || state === 'creating_quote_client') {
    // Verificar si el usuario está respondiendo a una lista de clientes similares
    const draft = conversation.draft || {}
    const similarClients = draft.similarClients || []

    if (similarClients.length > 0) {
      // El usuario está respondiendo a una lista de clientes
      const num = parseInt(text)
      if (!isNaN(num) && num >= 1 && num <= similarClients.length) {
        // Usuario seleccionó un cliente de la lista
        const selectedClient = similarClients[num - 1]
        draft.clientId = selectedClient.id
        draft.clientName = selectedClient.name
        draft.similarClients = undefined // Limpiar la lista

        const nextState = state === 'creating_invoice_client' 
          ? 'creating_invoice_title' 
          : 'creating_quote_title'

        setConversationState(chatId, {
          ...conversation,
          state: nextState,
          draft
        })

        const type = state === 'creating_invoice_client' ? 'factura' : 'cotización'
        await bot.sendMessage(
          chatId,
          `✅ Cliente seleccionado: "${selectedClient.name}"\n\n` +
          `¿Cuál es el título de la ${type}?`
        )
        return
      } else if (text.toLowerCase().trim() === 'nuevo') {
        // Usuario quiere crear un nuevo cliente
        await bot.sendMessage(
          chatId,
          'Escribe el nombre completo del nuevo cliente:'
        )
        // Limpiar la lista pero mantener el estado
        draft.similarClients = undefined
        setConversationState(chatId, {
          ...conversation,
          draft
        })
        return
      }
      // Si no es un número ni "nuevo", continuar con la búsqueda normal
    }

    // Buscar clientes similares
    const similarClientsFound = await searchClients(companyId, text)

    if (similarClientsFound.length > 0) {
      // Mostrar clientes similares
      const clientsList = similarClientsFound
        .map((client, index) => `${index + 1}. ${client.name}${client.email ? ` (${client.email})` : ''}`)
        .join('\n')

      await bot.sendMessage(
        chatId,
        `🔍 Encontré clientes similares:\n\n${clientsList}\n\n` +
        `¿Es uno de estos? Responde con el número (1-${similarClientsFound.length}) o escribe "nuevo" para crear uno nuevo.`
      )

      // Guardar clientes encontrados para la siguiente respuesta
      setConversationState(chatId, {
        ...conversation,
        draft: {
          ...draft,
          similarClients: similarClientsFound
        }
      })
      return
    }

    // Si no hay clientes similares, crear o usar el cliente
    const client = await ensureClient(companyId, text)
    draft.clientId = client.id
    draft.clientName = client.name
    draft.similarClients = undefined

    const nextState = state === 'creating_invoice_client' 
      ? 'creating_invoice_title' 
      : 'creating_quote_title'

    setConversationState(chatId, {
      state: nextState,
      draft
    })

    const type = state === 'creating_invoice_client' ? 'factura' : 'cotización'
    await bot.sendMessage(
      chatId,
      `✅ Cliente "${client.name}" ${client.id ? 'encontrado' : 'creado'}.\n\n` +
      `¿Cuál es el título de la ${type}?`
    )
    return
  }


  // Continuar con el flujo normal
  if (state === 'creating_invoice_title' || state === 'creating_quote_title') {
    const draft = conversation.draft || {}
    draft.title = text

    const nextState = state === 'creating_invoice_title' 
      ? 'creating_invoice_items' 
      : 'creating_quote_items'

    setConversationState(chatId, {
      state: nextState,
      draft
    })

    await bot.sendMessage(
      chatId,
      '✅ Título guardado.\n\n' +
      'Ahora agrega los items. Formato:\n' +
      '`Descripción | Cantidad | Precio`\n\n' +
      'Ejemplo: `Desarrollo web | 10 | 50`\n\n' +
      'Escribe "terminar" cuando hayas agregado todos los items.'
    )
    return
  }

  if (state === 'creating_invoice_items' || state === 'creating_quote_items') {
    if (text.toLowerCase().trim() === 'terminar') {
      // Finalizar creación
      const draft = conversation.draft || {}
      if (!draft.items || draft.items.length === 0) {
        await bot.sendMessage(
          chatId,
          '❌ Debes agregar al menos un item. Formato:\n' +
          '`Descripción | Cantidad | Precio`'
        )
        return
      }

      try {
        if (!conversation.userId) throw new Error('User ID not found')
        const company = await getUserCompany(conversation.userId)
        if (!company) throw new Error('Company not found')

        if (draft.type === 'invoice') {
          const invoice = await createInvoiceFromConversation(company.id, conversation)
          await bot.sendMessage(
            chatId,
            `✅ Factura creada exitosamente!\n\n` +
            `ID: ${invoice.id}\n` +
            `Cliente: ${draft.clientName}\n` +
            `Título: ${draft.title}\n` +
            `Total: ${invoice.total.toFixed(2)} ${invoice.currency}`
          )
        } else {
          const quote = await createQuoteFromConversation(company.id, conversation)
          await bot.sendMessage(
            chatId,
            `✅ Cotización creada exitosamente!\n\n` +
            `ID: ${quote.id}\n` +
            `Cliente: ${draft.clientName}\n` +
            `Título: ${draft.title}\n` +
            `Total: ${quote.total.toFixed(2)} ${quote.currency}`
          )
        }

        clearConversationState(chatId)
      } catch (error) {
        console.error('Error creando factura/cotización:', error)
        await bot.sendMessage(
          chatId,
          '❌ Error al crear la factura/cotización. Por favor, intenta de nuevo.'
        )
      }
      return
    }

    // Parsear item: "Descripción | Cantidad | Precio"
    const parts = text.split('|').map(p => p.trim())
    if (parts.length !== 3) {
      await bot.sendMessage(
        chatId,
        '❌ Formato incorrecto. Usa:\n' +
        '`Descripción | Cantidad | Precio`\n\n' +
        'Ejemplo: `Desarrollo web | 10 | 50`'
      )
      return
    }

    const [description, qtyStr, priceStr] = parts
    const qty = parseFloat(qtyStr)
    const price = parseFloat(priceStr)

    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
      await bot.sendMessage(
        chatId,
        '❌ Cantidad y precio deben ser números positivos.'
      )
      return
    }

    const draft = conversation.draft || {}
    if (!draft.items) draft.items = []
    draft.items.push({ description, qty, price })

    setConversationState(chatId, {
      ...conversation,
      draft
    })

    const total = draft.items.reduce((sum: number, item: any) => 
      sum + item.qty * item.price, 0
    )

    await bot.sendMessage(
      chatId,
      `✅ Item agregado: ${description}\n` +
      `Subtotal actual: ${total.toFixed(2)}\n\n` +
      'Agrega otro item o escribe "terminar" para finalizar.'
    )
    return
  }

  // Estado desconocido
  await bot.sendMessage(
    chatId,
    'No entiendo tu mensaje. Usa /ayuda para ver los comandos disponibles.'
  )
}


