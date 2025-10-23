import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          <header className="h-14 bg-white border-b flex items-center px-6">
            <h1 className="text-xl font-bold">Kônsul Bills - Test</h1>
          </header>
          
          <main className="p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}












