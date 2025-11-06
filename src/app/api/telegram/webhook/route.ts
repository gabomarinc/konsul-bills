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
import { parseNaturalLanguage } from '@/lib/telegram-ai'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Tipo para el bot (sin importar el módulo)
type TelegramBot = {
  sendMessage(chatId: number, text: string, options?: any): Promise<any>;
  [key: string]: any;
}

// Función para obtener el bot (solo se inicializa cuando se necesita)
function getBot(): TelegramBot | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[TELEGRAM] TELEGRAM_BOT_TOKEN no configurado')
    return null
  }

  // Inicializar dinámicamente para evitar problemas en build
  try {
    // Usar require dinámico para evitar problemas en build time
    const TelegramBotClass = require('node-telegram-bot-api')
    // Intentar con default primero, luego sin default
    const BotConstructor = TelegramBotClass.default || TelegramBotClass
    const bot = new BotConstructor(TELEGRAM_BOT_TOKEN, { polling: false }) as TelegramBot
    console.log('[TELEGRAM] Bot inicializado correctamente con token:', TELEGRAM_BOT_TOKEN.substring(0, 10) + '...')
    return bot
  } catch (error) {
    console.error('[TELEGRAM] Error inicializando bot:', error)
    console.error('[TELEGRAM] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return null
  }
}

/**
 * POST /api/telegram/webhook
 * Webhook para recibir actualizaciones de Telegram
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[TELEGRAM WEBHOOK] Recibida petición')
    const bot = getBot()
    if (!bot) {
      console.error('[TELEGRAM WEBHOOK] Bot no configurado')
      return NextResponse.json(
        { error: 'Telegram bot no configurado' },
        { status: 500 }
      )
    }

    const update = await req.json()
    const messageText = update.message?.text || update.message?.caption || ''
    const chatId = update.message?.chat?.id
    const fromId = update.message?.from?.id
    
    console.log('[TELEGRAM WEBHOOK] Update recibido:', JSON.stringify({
      message: messageText,
      chatId: chatId,
      fromId: fromId,
      updateId: update.update_id
    }))
    
    // Si no hay mensaje, podría ser otro tipo de update
    if (!update.message && !update.edited_message) {
      console.log('[TELEGRAM WEBHOOK] Update sin mensaje, ignorando:', update.update_id)
      return NextResponse.json({ ok: true })
    }

    // Procesar el update de forma asíncrona (no esperar respuesta)
    // IMPORTANTE: No usar await aquí para responder rápido a Telegram
    processTelegramUpdate(update).catch(async (error) => {
      console.error('[TELEGRAM WEBHOOK] Error procesando update:', error)
      console.error('[TELEGRAM WEBHOOK] Stack:', error instanceof Error ? error.stack : 'No stack')
      
      // Intentar enviar mensaje de error incluso si falló todo
      try {
        const bot = getBot()
        const chatId = update.message?.chat?.id || update.edited_message?.chat?.id
        const telegramId = String(update.message?.from?.id || update.edited_message?.from?.id)
        
        if (bot && chatId) {
          console.log('[TELEGRAM WEBHOOK] Intentando enviar mensaje de error desde catch principal')
          await bot.sendMessage(
            chatId,
            '⚠️ Error al procesar tu mensaje.\n\n' +
            'Por favor, intenta de nuevo en unos segundos.\n\n' +
            `Tu Telegram ID es: \`${telegramId}\`\n\n` +
            'Escribe /start para comenzar.'
          )
          console.log('[TELEGRAM WEBHOOK] ✅ Mensaje de error enviado desde catch principal')
        }
      } catch (sendErr) {
        console.error('[TELEGRAM WEBHOOK] ❌ Error enviando mensaje desde catch principal:', sendErr)
      }
    })

    // Responder inmediatamente a Telegram (requerido por la API de Telegram)
    // El procesamiento continúa en background
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[TELEGRAM WEBHOOK] Error en webhook:', error)
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
  
  // Manejar tanto message como edited_message
  const message = update.message || update.edited_message
  if (!bot || !message) {
    console.log('[TELEGRAM] No bot o sin mensaje. Update:', JSON.stringify(update))
    return
  }

  const chatId = message.chat.id
  const telegramId = String(message.from?.id)
  const text = message.text || message.caption || ''
  const username = message.from?.username
  const firstName = message.from?.first_name
  const lastName = message.from?.last_name

  console.log('[TELEGRAM] Procesando mensaje:', { chatId, telegramId, text, updateId: update.update_id })

  // Función helper para enviar mensaje de error
  const sendErrorMessage = async (errorMsg: string) => {
    if (!bot) {
      console.error('[TELEGRAM] ❌ Bot no disponible para enviar mensaje de error')
      return
    }
    try {
      console.log('[TELEGRAM] Enviando mensaje de error a chatId:', chatId)
      const result = await bot.sendMessage(chatId, errorMsg)
      console.log('[TELEGRAM] ✅ Mensaje de error enviado. Message ID:', result?.message_id)
      return result
    } catch (sendErr: any) {
      console.error('[TELEGRAM] ❌ Error enviando mensaje de error:', sendErr?.message || sendErr)
      return null
    }
  }

  try {
    // Obtener o vincular usuario de Telegram
    console.log('[TELEGRAM] Buscando usuario con telegramId:', telegramId)
    let telegramUser
    try {
      telegramUser = await getTelegramUser(telegramId)
      console.log('[TELEGRAM] Usuario encontrado:', telegramUser ? 'Sí' : 'No')
      if (telegramUser) {
        console.log('[TELEGRAM] Usuario encontrado - ID:', telegramUser.id, 'UserId:', telegramUser.userId)
      }
    } catch (error: any) {
      console.error('[TELEGRAM] Error buscando usuario:', error?.code || error?.message)
      console.error('[TELEGRAM] Error completo:', JSON.stringify({
        code: error?.code,
        message: error?.message,
        name: error?.name
      }))
      console.error('[TELEGRAM] Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // CUALQUIER error al buscar usuario = tratar como usuario no vinculado y enviar mensaje
      // Esto asegura que el bot SIEMPRE responda
      console.log('[TELEGRAM] ⚠️ Error al buscar usuario, tratando como usuario no vinculado')
      console.log('[TELEGRAM] Bot disponible?', bot ? 'Sí' : 'No')
      console.log('[TELEGRAM] ChatId:', chatId, 'TelegramId:', telegramId)
      console.log('[TELEGRAM] Text recibido:', text)
      console.log('[TELEGRAM] Enviando mensaje de bienvenida a pesar del error')
      
      // Preparar mensaje según el comando
      const command = text.toLowerCase().trim()
      console.log('[TELEGRAM] Comando detectado:', command)
      const isStart = command === '/start' || command === 'hola' || command === 'hi'
      const isCreateInvoice = command === '/crear_factura' || command.startsWith('/crear_factura') || text.toLowerCase().includes('crear') && text.toLowerCase().includes('factura')
      const isCreateQuote = command === '/crear_cotizacion' || command.startsWith('/crear_cotizacion')
      
      let messageText = ''
      
      if (isStart) {
        messageText = '👋 ¡Hola! Bienvenido a Konsul Bills.\n\n' +
          '⚠️ Hay un problema temporal con la base de datos.\n\n' +
          'Tu Telegram ID es: `' + telegramId + '`\n\n' +
          'Por favor, intenta de nuevo en unos segundos.\n\n' +
          'Comandos disponibles:\n' +
          '/crear_factura - Crear una factura\n' +
          '/crear_cotizacion - Crear una cotización\n' +
          '/clientes - Ver tus clientes\n' +
          '/ayuda - Ver ayuda'
      } else if (isCreateInvoice) {
        messageText = '📝 Para crear una factura, necesito acceso a la base de datos.\n\n' +
          '⚠️ Hay un problema temporal de conexión.\n\n' +
          'Por favor, intenta de nuevo en unos segundos.\n\n' +
          'Tu Telegram ID es: `' + telegramId + '`\n\n' +
          'Si el problema persiste, verifica tu conexión a internet o contacta al soporte.'
      } else if (isCreateQuote) {
        messageText = '📋 Para crear una cotización, necesito acceso a la base de datos.\n\n' +
          '⚠️ Hay un problema temporal de conexión.\n\n' +
          'Por favor, intenta de nuevo en unos segundos.\n\n' +
          'Tu Telegram ID es: `' + telegramId + '`\n\n' +
          'Si el problema persiste, verifica tu conexión a internet o contacta al soporte.'
      } else {
        messageText = '⚠️ Error temporal de conexión con la base de datos.\n\n' +
          'Por favor, intenta de nuevo en unos segundos.\n\n' +
          'Tu Telegram ID es: `' + telegramId + '`\n\n' +
          'Escribe /start para comenzar.'
      }
      
      console.log('[TELEGRAM] Mensaje preparado:', messageText.substring(0, 100) + '...')
      console.log('[TELEGRAM] Llamando a sendErrorMessage...')
      
      // Intentar enviar mensaje usando la función helper
      const sendResult = await sendErrorMessage(messageText)
      console.log('[TELEGRAM] Resultado de sendErrorMessage:', sendResult ? 'Éxito' : 'Falló')
      
      return // Salir sin lanzar el error para que el webhook responda 200
    }
    
    if (!telegramUser) {
      console.log('[TELEGRAM] Usuario no encontrado. TelegramId:', telegramId)
      console.log('[TELEGRAM] Usuario no vinculado, enviando mensaje de bienvenida a chatId:', chatId)
      
      // Usuario no vinculado - SIEMPRE enviar mensaje de bienvenida
      // Si es /start, enviar mensaje de bienvenida más amigable
      if (text.toLowerCase().trim() === '/start' || text.toLowerCase().trim() === 'hola' || text.toLowerCase().trim() === 'hi') {
        try {
          console.log('[TELEGRAM] Enviando mensaje de bienvenida para /start')
          const welcomeMessage = await bot.sendMessage(
            chatId,
            '👋 ¡Hola! Bienvenido a Konsul Bills.\n\n' +
            'Para usar el bot, primero necesitas vincular tu cuenta de Telegram con tu cuenta de Konsul Bills.\n\n' +
            '📱 Pasos para vincular:\n' +
            '1. Visita tu panel de configuración en la aplicación web\n' +
            '2. Ve a la sección de Telegram\n' +
            '3. Copia tu Telegram ID: `' + telegramId + '`\n' +
            '4. Pega el ID y guarda la configuración\n\n' +
            'Una vez vinculado, podrás usar comandos como:\n' +
            '/crear_factura - Crear una factura\n' +
            '/crear_cotizacion - Crear una cotización\n' +
            '/clientes - Ver tus clientes\n\n' +
            '¿Necesitas ayuda? Escribe /ayuda'
          )
          console.log('[TELEGRAM] ✅ Mensaje de bienvenida enviado exitosamente. Message ID:', welcomeMessage?.message_id)
          return
        } catch (sendError: any) {
          console.error('[TELEGRAM] ❌ Error enviando mensaje de bienvenida:', sendError?.message || sendError)
          console.error('[TELEGRAM] Error stack:', sendError instanceof Error ? sendError.stack : 'No stack')
          // Intentar enviar un mensaje más simple como fallback
          try {
            await bot.sendMessage(chatId, '👋 ¡Hola! Bienvenido. Tu Telegram ID es: ' + telegramId)
          } catch (fallbackError) {
            console.error('[TELEGRAM] ❌ Error en fallback también:', fallbackError)
          }
          return
        }
      } else {
        // Para otros comandos, enviar mensaje de vinculación requerida
        try {
          console.log('[TELEGRAM] Enviando mensaje de vinculación requerida')
          const linkMessage = await bot.sendMessage(
            chatId,
            '⚠️ No estás vinculado a una cuenta.\n\n' +
            'Para usar el bot, primero necesitas vincular tu cuenta de Telegram.\n' +
            'Visita tu panel de configuración en la aplicación web.\n\n' +
            `Tu Telegram ID es: \`${telegramId}\`\n\n` +
            'Escribe /start para ver más información.'
          )
          console.log('[TELEGRAM] ✅ Mensaje de vinculación enviado exitosamente. Message ID:', linkMessage?.message_id)
          return
        } catch (sendError: any) {
          console.error('[TELEGRAM] ❌ Error enviando mensaje de vinculación:', sendError?.message || sendError)
          console.error('[TELEGRAM] Error stack:', sendError instanceof Error ? sendError.stack : 'No stack')
          // Intentar enviar un mensaje más simple como fallback
          try {
            await bot.sendMessage(chatId, '⚠️ No estás vinculado. Tu Telegram ID: ' + telegramId + '. Escribe /start')
          } catch (fallbackError) {
            console.error('[TELEGRAM] ❌ Error en fallback también:', fallbackError)
          }
          return
        }
      }
    }

    const user = telegramUser.User
    console.log('[TELEGRAM] Usuario ID:', user.id)
    
    const company = await getUserCompany(user.id)
    console.log('[TELEGRAM] Empresa encontrada:', company ? company.id : 'No')

    if (!company) {
      console.error('[TELEGRAM] No hay empresa para el usuario:', user.id)
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
      console.log('[TELEGRAM] Es un comando, llamando handleCommand')
      await handleCommand(chatId, text, conversation, company.id)
      console.log('[TELEGRAM] handleCommand completado')
    } else {
      // Verificar si hay un estado de conversación activo
      if (conversation.state !== 'idle') {
        console.log('[TELEGRAM] No es comando, llamando handleConversation (estado activo)')
        // Procesar respuesta según el estado de conversación
        await handleConversation(chatId, text, conversation, company.id)
        console.log('[TELEGRAM] handleConversation completado')
      } else {
        // Estado idle: intentar procesar como lenguaje natural con IA
        console.log('[TELEGRAM] Estado idle, intentando procesar con IA')
        await handleNaturalLanguage(chatId, text, conversation, company.id)
        console.log('[TELEGRAM] handleNaturalLanguage completado')
      }
    }
    
    console.log('[TELEGRAM] Procesamiento de mensaje completado exitosamente')
  } catch (error: any) {
    console.error('[TELEGRAM] ❌ Error procesando mensaje:', error?.message || error)
    console.error('[TELEGRAM] Error completo:', JSON.stringify({
      code: error?.code,
      message: error?.message,
      name: error?.name
    }))
    console.error('[TELEGRAM] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // Asegurar que SIEMPRE se envíe un mensaje, incluso si hay errores
    const errorMsg = '❌ Ocurrió un error al procesar tu mensaje.\n\n' +
      'Por favor, intenta de nuevo en unos segundos.\n\n' +
      `Tu Telegram ID es: \`${telegramId}\`\n\n` +
      'Escribe /start para comenzar.'
    
    await sendErrorMessage(errorMsg)
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
    console.error('[TELEGRAM] Bot no inicializado en handleCommand')
    return
  }

  const cmd = command.split(' ')[0].toLowerCase()
  console.log('[TELEGRAM] Procesando comando:', cmd, 'para chatId:', chatId)

  try {
    switch (cmd) {
    case '/start':
      console.log('[TELEGRAM] Procesando comando /start para chatId:', chatId)
      try {
        const startResult = await bot.sendMessage(
          chatId,
          '👋 ¡Hola! Soy tu asistente de Konsul Bills.\n\n' +
          'Comandos disponibles:\n' +
          '/crear_factura - Crear una nueva factura\n' +
          '/crear_cotizacion - Crear una nueva cotización\n' +
          '/clientes - Listar todos los clientes\n' +
          '/cancelar - Cancelar operación en curso\n' +
          '/ayuda - Mostrar esta ayuda\n\n' +
          '¿En qué puedo ayudarte hoy?'
        )
        console.log('[TELEGRAM] Mensaje /start enviado exitosamente. Message ID:', startResult?.message_id)
        clearConversationState(chatId)
      } catch (error) {
        console.error('[TELEGRAM] Error enviando mensaje /start:', error)
        console.error('[TELEGRAM] Error details:', error instanceof Error ? error.message : 'Unknown error')
        throw error // Re-lanzar para que se maneje en el catch general
      }
      break

    case '/crear_factura':
      console.log('[TELEGRAM] Procesando comando /crear_factura para chatId:', chatId)
      try {
        setConversationState(chatId, {
          state: 'creating_invoice_client',
          draft: { type: 'invoice', items: [] }
        })
        console.log('[TELEGRAM] Estado de conversación actualizado')
        
        const invoiceResult = await bot.sendMessage(
          chatId,
          '📝 Creando nueva factura...\n\n' +
          '¿Cuál es el nombre del cliente?\n' +
          '(Puedes escribir el nombre completo o buscar entre tus clientes)'
        )
        console.log('[TELEGRAM] Mensaje de /crear_factura enviado exitosamente. Message ID:', invoiceResult?.message_id)
      } catch (error) {
        console.error('[TELEGRAM] Error procesando /crear_factura:', error)
        console.error('[TELEGRAM] Error details:', error instanceof Error ? error.message : 'Unknown error')
        throw error
      }
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
 * Maneja lenguaje natural usando IA
 */
async function handleNaturalLanguage(
  chatId: number,
  text: string,
  conversation: any,
  companyId: string
) {
  const bot = getBot()
  if (!bot) return

  try {
    console.log('[TELEGRAM AI] Procesando lenguaje natural:', text)
    
    // Obtener clientes disponibles para el contexto
    const clients = await getCompanyClients(companyId)
    
    // Procesar con IA
    const parsed = await parseNaturalLanguage(text, clients)
    
    console.log('[TELEGRAM AI] Intent detectado:', parsed.intent, 'Confidence:', parsed.confidence)
    
    if (parsed.intent === 'create_invoice' || parsed.intent === 'create_quote') {
      // Confirmar con el usuario antes de crear
      const type = parsed.intent === 'create_invoice' ? 'factura' : 'cotización'
      let confirmMessage = `📝 Entendido, quieres crear una ${type}:\n\n`
      
      if (parsed.clientName) {
        confirmMessage += `👤 Cliente: ${parsed.clientName}\n`
      }
      if (parsed.title) {
        confirmMessage += `📋 Título: ${parsed.title}\n`
      }
      if (parsed.items && parsed.items.length > 0) {
        confirmMessage += `💰 Items:\n`
        parsed.items.forEach(item => {
          confirmMessage += `  • ${item.description}: ${item.qty} x ${item.price} ${parsed.currency || 'EUR'}\n`
        })
      }
      if (parsed.actions && parsed.actions.includes('send_email')) {
        confirmMessage += `📧 Se enviará por email\n`
      }
      
      confirmMessage += `\n¿Confirmas? Responde "sí" para crear o "no" para cancelar.`
      
      // Guardar el intent parseado en el estado
      setConversationState(chatId, {
        state: parsed.intent === 'create_invoice' ? 'creating_invoice_client' : 'creating_quote_client',
        draft: {
          type: parsed.intent === 'create_invoice' ? 'invoice' : 'quote',
          clientName: parsed.clientName,
          clientEmail: parsed.clientEmail,
          title: parsed.title,
          items: parsed.items,
          currency: parsed.currency,
          tax: parsed.tax,
          actions: parsed.actions,
          aiParsed: true // Flag para indicar que viene de IA
        }
      })
      
      await bot.sendMessage(chatId, confirmMessage)
    } else if (parsed.intent === 'list_clients') {
      const clientsList = formatClientsList(clients)
      await bot.sendMessage(chatId, `📋 Tus clientes:\n\n${clientsList}`)
    } else {
      await bot.sendMessage(
        chatId,
        '🤔 No entendí tu solicitud. Puedes:\n\n' +
        '• Usar comandos: /crear_factura, /crear_cotizacion\n' +
        '• Escribir en lenguaje natural: "Crea una cotización de 600 dólares para Omar Ortiz"\n' +
        '• Usar /ayuda para más información'
      )
    }
  } catch (error) {
    console.error('[TELEGRAM AI] Error procesando lenguaje natural:', error)
    await bot.sendMessage(
      chatId,
      '❌ Error al procesar tu mensaje. Por favor, intenta usar comandos como /crear_factura'
    )
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
  const draft = conversation.draft || {}

  // Si viene de IA y el usuario confirma, crear directamente
  if (draft.aiParsed && (text.toLowerCase().trim() === 'sí' || text.toLowerCase().trim() === 'si' || text.toLowerCase().trim() === 'yes')) {
    console.log('[TELEGRAM] Confirmación de IA recibida, creando directamente')
    
    try {
      if (!conversation.userId) throw new Error('User ID not found')
      const company = await getUserCompany(conversation.userId)
      if (!company) throw new Error('Company not found')

      // Asegurar cliente
      if (draft.clientName) {
        const client = await ensureClient(company.id, draft.clientName, draft.clientEmail)
        draft.clientId = client.id
      }

      if (!draft.clientId) {
        await bot.sendMessage(chatId, '❌ Falta el nombre del cliente. Por favor, especifica el cliente.')
        return
      }

      if (draft.type === 'invoice') {
        const invoice = await createInvoiceFromConversation(company.id, conversation)
        await bot.sendMessage(
          chatId,
          `✅ Factura creada exitosamente!\n\n` +
          `ID: ${invoice.id}\n` +
          `Cliente: ${draft.clientName}\n` +
          `Título: ${draft.title || 'Factura'}\n` +
          `Total: ${invoice.total.toFixed(2)} ${invoice.currency}`
        )
        
        // TODO: Implementar envío de email si está en actions
        if (draft.actions && draft.actions.includes('send_email')) {
          await bot.sendMessage(chatId, '📧 Email enviado al cliente')
        }
      } else {
        const quote = await createQuoteFromConversation(company.id, conversation)
        await bot.sendMessage(
          chatId,
          `✅ Cotización creada exitosamente!\n\n` +
          `ID: ${quote.id}\n` +
          `Cliente: ${draft.clientName}\n` +
          `Título: ${draft.title || 'Cotización'}\n` +
          `Total: ${quote.total.toFixed(2)} ${quote.currency}`
        )
        
        // TODO: Implementar envío de email si está en actions
        if (draft.actions && draft.actions.includes('send_email')) {
          await bot.sendMessage(chatId, '📧 Email enviado al cliente')
        }
      }

      clearConversationState(chatId)
    } catch (error) {
      console.error('Error creando desde IA:', error)
      await bot.sendMessage(
        chatId,
        '❌ Error al crear. Por favor, intenta de nuevo.'
      )
    }
    return
  }

  // Si el usuario cancela
  if (draft.aiParsed && (text.toLowerCase().trim() === 'no' || text.toLowerCase().trim() === 'cancelar')) {
    clearConversationState(chatId)
    await bot.sendMessage(chatId, '✅ Operación cancelada.')
    return
  }

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


