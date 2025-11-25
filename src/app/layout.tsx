import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { OnboardingProvider } from "@/contexts/OnboardingContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import OnboardingTrigger from "@/components/konsul/OnboardingTrigger"
import QueryProvider from "@/components/providers/QueryProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Kônsul Bills",
  description: "Smart quoting & invoicing platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    console.log('[RootLayout] ========== ROOT LAYOUT RENDERED ==========')
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('[RootLayout] Script tag executed');
              window.addEventListener('DOMContentLoaded', () => {
                console.log('[RootLayout] DOM Content Loaded');
              });
            `,
          }}
        />
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <OnboardingProvider>
                {children}
                
                {/* Toaster (Sonner) */}
                <Toaster richColors position="top-right" />
                
                {/* Onboarding Trigger */}
                <OnboardingTrigger />
              </OnboardingProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
        
        {/* ChatBot Simple - Renderizado directo */}
        <div id="chatbot-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999 }}>
          <button
            id="chatbot-button"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            aria-label="Abrir chatbot"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          
          {/* Chat Window - Inicialmente oculto */}
          <div
            id="chatbot-window"
            style={{
              display: 'none',
              position: 'fixed',
              bottom: '90px',
              right: '20px',
              width: '400px',
              height: '500px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              flexDirection: 'column',
              border: '2px solid #2563eb',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontWeight: 'bold' }}>Asistente IA</span>
              </div>
              <button
                id="chatbot-close"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Messages area */}
            <div
              id="chatbot-messages"
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                backgroundColor: '#f9fafb',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    maxWidth: '80%',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    ¡Hola! Soy tu asistente de Konsul Bills. ¿En qué puedo ayudarte?
                  </p>
                </div>
              </div>
            </div>

            {/* Input area */}
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white',
                borderRadius: '0 0 8px 8px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="chatbot-input"
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                <button
                  id="chatbot-send"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Script para funcionalidad del chatbot */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('[ChatBot] Script inicializado');
                
                // Esperar a que el DOM esté completamente cargado
                function initChatbot() {
                  const button = document.getElementById('chatbot-button');
                  const window = document.getElementById('chatbot-window');
                  const closeBtn = document.getElementById('chatbot-close');
                  const sendBtn = document.getElementById('chatbot-send');
                  const input = document.getElementById('chatbot-input');
                  const messages = document.getElementById('chatbot-messages');
                  
                  if (!button || !window || !messages) {
                    console.error('[ChatBot] Elementos no encontrados');
                    return;
                  }
                  
                  // Mantener historial de conversación con persistencia en localStorage
                  const STORAGE_KEY = 'konsul-chatbot-history';
                  let conversationHistory = [];
                  
                  // Agregar mensaje solo a la UI (sin guardar en historial)
                  function addMessageToUI(text, isUser, scroll = true) {
                    if (!messages) return;
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.style.marginBottom = '12px';
                    messageDiv.style.display = 'flex';
                    messageDiv.style.justifyContent = isUser ? 'flex-end' : 'flex-start';
                    
                    const bubble = document.createElement('div');
                    bubble.style.backgroundColor = isUser ? '#2563eb' : 'white';
                    bubble.style.color = isUser ? 'white' : 'black';
                    bubble.style.padding = '12px';
                    bubble.style.borderRadius = '8px';
                    bubble.style.maxWidth = '80%';
                    bubble.style.fontSize = '14px';
                    bubble.textContent = text;
                    
                    messageDiv.appendChild(bubble);
                    messages.appendChild(messageDiv);
                    if (scroll) {
                      messages.scrollTop = messages.scrollHeight;
                    }
                  }
                  
                  // Guardar historial en localStorage
                  function saveHistory() {
                    try {
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
                    } catch (e) {
                      console.warn('[ChatBot] Error guardando historial:', e);
                    }
                  }
                  
                  // Cargar historial desde localStorage al iniciar
                  function loadHistory() {
                    try {
                      const saved = localStorage.getItem(STORAGE_KEY);
                      if (saved) {
                        conversationHistory = JSON.parse(saved);
                        // Renderizar mensajes guardados
                        conversationHistory.forEach(msg => {
                          if (msg.role === 'user' || msg.role === 'assistant') {
                            addMessageToUI(msg.content, msg.role === 'user', false);
                          }
                        });
                        // Hacer scroll al final después de cargar todos los mensajes
                        setTimeout(() => {
                          if (messages) {
                            messages.scrollTop = messages.scrollHeight;
                          }
                        }, 100);
                      }
                    } catch (e) {
                      console.warn('[ChatBot] Error cargando historial:', e);
                    }
                  }
                  
                  function addMessage(text, isUser) {
                    addMessageToUI(text, isUser);
                    
                    // Agregar al historial
                    conversationHistory.push({
                      role: isUser ? 'user' : 'assistant',
                      content: text
                    });
                    
                    // Mantener solo los últimos 20 mensajes para no sobrecargar
                    if (conversationHistory.length > 20) {
                      conversationHistory = conversationHistory.slice(-20);
                    }
                    
                    // Guardar en localStorage
                    saveHistory();
                  }
                  
                  function toggleChat() {
                    if (!window) return;
                    const isVisible = window.style.display !== 'none';
                    window.style.display = isVisible ? 'none' : 'flex';
                    console.log('[ChatBot] Chat toggled, visible:', !isVisible);
                  }
                  
                  // Cargar historial al iniciar
                  loadHistory();
                  
                  // Configurar event listeners
                  if (button) {
                    button.addEventListener('click', toggleChat);
                  }
                  if (closeBtn) {
                    closeBtn.addEventListener('click', toggleChat);
                  }
                  if (sendBtn && input) {
                    sendBtn.addEventListener('click', sendMessage);
                    input.addEventListener('keypress', function(e) {
                      if (e.key === 'Enter') {
                        sendMessage();
                      }
                    });
                  }
                  
                  console.log('[ChatBot] Event listeners agregados');
                  
                  async function sendMessage() {
                    if (!input || !messages) return;
                    const text = input.value.trim();
                    if (!text) return;
                    
                    addMessage(text, true);
                    input.value = '';
                    
                    // Mostrar "escribiendo..."
                    const typingDiv = document.createElement('div');
                    typingDiv.id = 'chatbot-typing';
                    typingDiv.style.marginBottom = '12px';
                    typingDiv.style.display = 'flex';
                    typingDiv.style.justifyContent = 'flex-start';
                    const typingBubble = document.createElement('div');
                    typingBubble.style.backgroundColor = 'white';
                    typingBubble.style.padding = '12px';
                    typingBubble.style.borderRadius = '8px';
                    typingBubble.textContent = 'Escribiendo...';
                    typingDiv.appendChild(typingBubble);
                    messages.appendChild(typingDiv);
                    messages.scrollTop = messages.scrollHeight;
                    
                    try {
                      // Enviar historial completo (sin el mensaje actual que ya se agregó)
                      const historyToSend = conversationHistory.slice(0, -1);
                      
                      const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          message: text,
                          conversationHistory: historyToSend
                        })
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        typingDiv.remove();
                        addMessage(errorData.message || errorData.error || 'Error al procesar el mensaje. Por favor, intenta nuevamente.', false);
                        console.error('[ChatBot] API Error:', errorData);
                        return;
                      }
                      
                      const data = await response.json();
                      typingDiv.remove();
                      const responseText = data.message || 'Lo siento, no pude procesar tu mensaje.';
                      addMessage(responseText, false);
                      
                      // Si hay acciones ejecutadas, mostrarlas también
                      if (data.actions && data.actions.length > 0) {
                        const actions = data.actions.filter(a => a.type !== 'error');
                        if (actions.length > 0) {
                          const actionMessages = actions.map(a => {
                            if (a.type === 'quote_created') return '✅ Cotización ' + a.data.id + ' creada';
                            if (a.type === 'invoice_created') return '✅ Factura ' + a.data.id + ' creada';
                            if (a.type === 'status_updated') return '✅ Estado actualizado';
                            if (a.type === 'email_sent') return '📧 ' + a.data.message;
                            return null;
                          }).filter(Boolean);
                          if (actionMessages.length > 0) {
                            setTimeout(() => {
                              addMessage(actionMessages.join('\\n'), false);
                              
                              // Disparar evento para actualizar la lista de cotizaciones
                              if (actions.some(a => a.type === 'quote_created' || a.type === 'invoice_created')) {
                                window.dispatchEvent(new CustomEvent('quoteCreated'));
                              }
                            }, 500);
                          }
                        }
                      }
                    } catch (error) {
                      typingDiv.remove();
                      addMessage('Error al enviar el mensaje. Por favor, intenta nuevamente.', false);
                      console.error('[ChatBot] Error:', error);
                    }
                  }
                }
                
                // Inicializar cuando el DOM esté listo
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initChatbot);
                } else {
                  // DOM ya está listo
                  setTimeout(initChatbot, 100);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
