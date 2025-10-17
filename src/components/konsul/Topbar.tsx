'use client'

import { useAuth } from "@/contexts/AuthContext"
import { useLanguage, useTranslation } from "@/contexts/LanguageContext"
import { LogOut, User, Languages } from "lucide-react"

export default function Topbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  const toggleLanguage = () => {
    setLocale(locale === 'es' ? 'en' : 'es')
  }

  if (!user) {
    return (
      <header className="h-14 bg-white border-b flex items-center justify-between px-6">
        <span className="text-gray-500">{t.auth.signIn}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title={t.settings.language}
          >
            <Languages className="w-4 h-4" />
            <span className="font-medium">{locale === 'es' ? 'ES' : 'EN'}</span>
          </button>
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-700">
            {t.auth.signIn}
          </a>
        </div>
      </header>
    )
  }

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-gray-600" />
        <span className="text-gray-700">
          {t.dashboard.welcome}, {user.name} 👋
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.email}</span>
        
        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title={t.settings.language}
        >
          <Languages className="w-4 h-4" />
          <span className="font-medium">{locale === 'es' ? 'ES' : 'EN'}</span>
        </button>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t.nav.logout}
        </button>
      </div>
    </header>
  )
}
