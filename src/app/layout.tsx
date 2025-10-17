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
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 text-gray-900`}
      >
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
      </body>
    </html>
  )
}
