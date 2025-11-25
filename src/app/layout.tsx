import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { OnboardingProvider } from "@/contexts/OnboardingContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import OnboardingTrigger from "@/components/konsul/OnboardingTrigger"
import QueryProvider from "@/components/providers/QueryProvider"
import ChatBotScript from "@/components/konsul/ChatBotScript"

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
                
                {/* ChatBot Script - Inicialización del chatbot */}
                <ChatBotScript />
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
      </body>
    </html>
  )
}
