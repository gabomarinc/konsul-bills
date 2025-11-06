import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kônsul Bills - Simple",
  description: "Simple test layout",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: 'red', borderBottom: '2px solid red', paddingBottom: '10px' }}>
            Simple Layout - Working
          </h1>
          {children}
        </div>
      </body>
    </html>
  )
}















