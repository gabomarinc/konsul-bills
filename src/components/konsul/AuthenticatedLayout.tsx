"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/contexts/LanguageContext"
import Topbar from "@/components/konsul/Topbar"
import ChatBot from "@/components/konsul/ChatBot"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [invoicesExpanded, setInvoicesExpanded] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-4">
        <h1 className="text-xl font-bold mb-6">Kônsul Bills</h1>
        <nav className="flex flex-col gap-2">
          <Link 
            href="/dashboard" 
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`}
          >
            {t.nav.dashboard}
          </Link>
          
          <Link 
            href="/quotes" 
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname.startsWith('/quotes') 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`}
          >
            {t.nav.quotes}
          </Link>
          
          {/* Facturas con sub-menú */}
          <div>
            <button
              onClick={() => setInvoicesExpanded(!invoicesExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                pathname.startsWith('/invoices') 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <span>{t.nav.invoices}</span>
              {invoicesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {invoicesExpanded && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                <Link 
                  href="/invoices" 
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/invoices' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.nav.allInvoices}
                </Link>
                <Link 
                  href="/invoices/recurring" 
                  className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    pathname.startsWith('/invoices/recurring') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">🔄</span>
                  {t.nav.recurringInvoices}
                </Link>
              </div>
            )}
          </div>
          
          <Link 
            href="/settings" 
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/settings' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`}
          >
            {t.nav.settings}
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>

      {/* ChatBot */}
      {user && <ChatBot />}
    </div>
  )
}
