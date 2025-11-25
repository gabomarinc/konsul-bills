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
        </div>
      </body>
    </html>
  )
}
