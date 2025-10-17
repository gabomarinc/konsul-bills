'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.auth.signIn}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t.auth.dontHaveAccount}{' '}
            <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              {t.auth.createAccount}
            </a>
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t.auth.signIn}</CardTitle>
            <CardDescription>
              {t.auth.welcomeBack}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t.auth.email}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder={t.auth.email}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t.auth.password}
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder={t.auth.password}
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? `${t.common.loading}` : t.auth.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
