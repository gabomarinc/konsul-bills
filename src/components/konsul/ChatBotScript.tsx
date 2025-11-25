"use client"

import { useEffect } from "react"

export default function ChatBotScript() {
  useEffect(() => {
    // Esperar a que React termine de hidratar
    const initChatbot = () => {
      const button = document.getElementById('chatbot-button')
      const window = document.getElementById('chatbot-window')
      const closeBtn = document.getElementById('chatbot-close')
      const sendBtn = document.getElementById('chatbot-send')
      const input = document.getElementById('chatbot-input') as HTMLInputElement
      const messages = document.getElementById('chatbot-messages')
      
      if (!button || !window || !messages) {
        console.error('[ChatBot] Elementos no encontrados')
        return
      }
      
      // Mantener historial de conversación con persistencia en localStorage
      const STORAGE_KEY = 'konsul-chatbot-history'
      let conversationHistory: Array<{ role: string; content: string }> = []
      
      // Agregar mensaje solo a la UI (sin guardar en historial)
      function addMessageToUI(text: string, isUser: boolean, scroll = true) {
        if (!messages) return
        
        const messageDiv = document.createElement('div')
        messageDiv.style.marginBottom = '12px'
        messageDiv.style.display = 'flex'
        messageDiv.style.justifyContent = isUser ? 'flex-end' : 'flex-start'
        
        const bubble = document.createElement('div')
        bubble.style.backgroundColor = isUser ? '#2563eb' : 'white'
        bubble.style.color = isUser ? 'white' : 'black'
        bubble.style.padding = '12px'
        bubble.style.borderRadius = '8px'
        bubble.style.maxWidth = '80%'
        bubble.style.fontSize = '14px'
        bubble.textContent = text
        
        messageDiv.appendChild(bubble)
        messages.appendChild(messageDiv)
        if (scroll) {
          messages.scrollTop = messages.scrollHeight
        }
      }
      
      // Guardar historial en localStorage
      function saveHistory() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory))
        } catch (e) {
          console.warn('[ChatBot] Error guardando historial:', e)
        }
      }
      
      // Cargar historial desde localStorage al iniciar
      function loadHistory() {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            conversationHistory = JSON.parse(saved)
            // Renderizar mensajes guardados
            conversationHistory.forEach(msg => {
              if (msg.role === 'user' || msg.role === 'assistant') {
                addMessageToUI(msg.content, msg.role === 'user', false)
              }
            })
            // Hacer scroll al final después de cargar todos los mensajes
            setTimeout(() => {
              if (messages) {
                messages.scrollTop = messages.scrollHeight
              }
            }, 100)
          }
        } catch (e) {
          console.warn('[ChatBot] Error cargando historial:', e)
        }
      }
      
      function addMessage(text: string, isUser: boolean) {
        addMessageToUI(text, isUser)
        
        // Agregar al historial
        conversationHistory.push({
          role: isUser ? 'user' : 'assistant',
          content: text
        })
        
        // Mantener solo los últimos 20 mensajes para no sobrecargar
        if (conversationHistory.length > 20) {
          conversationHistory = conversationHistory.slice(-20)
        }
        
        // Guardar en localStorage
        saveHistory()
      }
      
      function toggleChat() {
        if (!window) return
        const isVisible = window.style.display !== 'none'
        window.style.display = isVisible ? 'none' : 'flex'
        console.log('[ChatBot] Chat toggled, visible:', !isVisible)
      }
      
      // Cargar historial al iniciar
      loadHistory()
      
      // Configurar event listeners
      button.addEventListener('click', toggleChat)
      if (closeBtn) {
        closeBtn.addEventListener('click', toggleChat)
      }
      if (sendBtn && input) {
        sendBtn.addEventListener('click', sendMessage)
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            sendMessage()
          }
        })
      }
      
      console.log('[ChatBot] Event listeners agregados')
      
      async function sendMessage() {
        if (!input || !messages) return
        const text = input.value.trim()
        if (!text) return
        
        addMessage(text, true)
        input.value = ''
        
        // Mostrar "escribiendo..."
        const typingDiv = document.createElement('div')
        typingDiv.id = 'chatbot-typing'
        typingDiv.style.marginBottom = '12px'
        typingDiv.style.display = 'flex'
        typingDiv.style.justifyContent = 'flex-start'
        const typingBubble = document.createElement('div')
        typingBubble.style.backgroundColor = 'white'
        typingBubble.style.padding = '12px'
        typingBubble.style.borderRadius = '8px'
        typingBubble.textContent = 'Escribiendo...'
        typingDiv.appendChild(typingBubble)
        messages.appendChild(typingDiv)
        messages.scrollTop = messages.scrollHeight
        
        try {
          // Enviar historial completo (sin el mensaje actual que ya se agregó)
          const historyToSend = conversationHistory.slice(0, -1)
          
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              message: text,
              conversationHistory: historyToSend
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            typingDiv.remove()
            addMessage(errorData.message || errorData.error || 'Error al procesar el mensaje. Por favor, intenta nuevamente.', false)
            console.error('[ChatBot] API Error:', errorData)
            return
          }
          
          const data = await response.json()
          typingDiv.remove()
          const responseText = data.message || 'Lo siento, no pude procesar tu mensaje.'
          addMessage(responseText, false)
          
          // Si hay acciones ejecutadas, mostrarlas también
          if (data.actions && data.actions.length > 0) {
            const actions = data.actions.filter((a: any) => a.type !== 'error')
            if (actions.length > 0) {
              const actionMessages = actions.map((a: any) => {
                if (a.type === 'quote_created') return '✅ Cotización ' + a.data.id + ' creada'
                if (a.type === 'invoice_created') return '✅ Factura ' + a.data.id + ' creada'
                if (a.type === 'status_updated') return '✅ Estado actualizado'
                if (a.type === 'email_sent') return '📧 ' + a.data.message
                return null
              }).filter(Boolean)
              if (actionMessages.length > 0) {
                setTimeout(() => {
                  addMessage(actionMessages.join('\\n'), false)
                  
                  // Disparar evento para actualizar la lista de cotizaciones
                  if (actions.some((a: any) => a.type === 'quote_created' || a.type === 'invoice_created')) {
                    if (typeof window !== 'undefined') {
                      const win = window as Window & typeof globalThis
                      win.dispatchEvent(new CustomEvent('quoteCreated'))
                    }
                  }
                }, 500)
              }
            }
          }
        } catch (error) {
          typingDiv.remove()
          addMessage('Error al enviar el mensaje. Por favor, intenta nuevamente.', false)
          console.error('[ChatBot] Error:', error)
        }
      }
    }
    
    // Esperar un poco más para asegurar que React haya terminado de hidratar
    const timeoutId = setTimeout(initChatbot, 500)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])
  
  return null
}

