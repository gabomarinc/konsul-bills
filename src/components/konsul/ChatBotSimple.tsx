"use client"

import { useState } from "react"
import { Bot } from "lucide-react"

export default function ChatBotSimple() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón flotante - SIEMPRE visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        aria-label="Abrir chatbot"
      >
        <Bot size={24} />
      </button>

      {/* Chat window - solo si está abierto */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            zIndex: 99999,
            display: 'flex',
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
              <Bot size={20} />
              <span style={{ fontWeight: 'bold' }}>Asistente IA</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages area */}
          <div
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
      )}
    </>
  )
}

