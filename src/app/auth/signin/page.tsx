'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const { t } = useTranslation()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error(t.validation.required)
      return
    }

    setIsLoading(true)
    
    try {
      const success = await login(email, password)
      
      if (success) {
        toast.success(`${t.auth.welcomeBack}!`)
        router.push('/dashboard')
      } else {
        toast.error(t.auth.loginError)
      }
    } catch (error) {
      toast.error(t.auth.loginError)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.auth.signIn}
          </h1>
          <p className="text-slate-600">
            {t.auth.dontHaveAccount}{' '}
            <Link 
              href="/auth/signup" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {t.auth.createAccount}
            </Link>
          </p>
        </div>

        <Card className="p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              {t.auth.signIn}
            </h2>
            <p className="text-slate-600">
              {t.auth.welcomeBack}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.email}
                  className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.password}
                  className="pl-10 pr-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? t.common.loading : t.auth.signIn}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </form>
        </Card>

        <div className="mt-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.auth.welcomeBack}
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{t.nav.quotes}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{t.nav.invoices}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{t.nav.dashboard}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
