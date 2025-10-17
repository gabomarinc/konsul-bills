"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    const newErrors = { ...errors }
    
    if (field === 'name') {
      if (value.trim().length < 2 && value.length > 0) {
        newErrors.name = t.validation.minLength.replace('{min}', '2')
      } else {
        delete newErrors.name
      }
    }
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value.length > 0 && !emailRegex.test(value)) {
        newErrors.email = t.validation.invalidEmail
      } else {
        delete newErrors.email
      }
    }
    
    if (field === 'password') {
      if (value.length > 0 && value.length < 6) {
        newErrors.password = t.auth.passwordMinLength
      } else if (value.length > 100) {
        newErrors.password = t.validation.maxLength.replace('{max}', '100')
      } else {
        delete newErrors.password
      }
      
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = t.auth.passwordsDontMatch
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        delete newErrors.confirmPassword
      }
    }
    
    if (field === 'confirmPassword') {
      if (value.length > 0 && value !== formData.password) {
        newErrors.confirmPassword = t.auth.passwordsDontMatch
      } else {
        delete newErrors.confirmPassword
      }
    }
    
    setErrors(newErrors)
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error(t.validation.required)
      return false
    }

    if (formData.name.trim().length < 2) {
      toast.error(t.validation.minLength.replace('{min}', '2'))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t.validation.invalidEmail)
      return false
    }

    if (formData.password.length < 6) {
      toast.error(t.auth.passwordMinLength)
      return false
    }

    if (formData.password.length > 100) {
      toast.error(t.validation.maxLength.replace('{max}', '100'))
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t.auth.passwordsDontMatch)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.auth.registerError)
      }

      toast.success(`${t.common.success}! ${t.auth.signIn}.`)
      router.push("/auth/signin")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : t.auth.registerError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t.auth.createAccount}
          </h1>
          <p className="text-slate-600">
            {t.auth.joinUs}
          </p>
        </div>

        <Card className="p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                {t.auth.fullName}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={t.auth.fullName}
                  className={`pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={t.auth.email}
                  className={`pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={t.auth.password}
                  className={`pl-10 pr-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
              <p className="text-xs text-slate-500">{t.auth.passwordMinLength}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                {t.auth.confirmPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder={t.auth.confirmPassword}
                  className={`pl-10 pr-12 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t.auth.passwordsMatch}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? t.common.loading : t.auth.createAccount}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              {t.auth.alreadyHaveAccount}{" "}
              <Link 
                href="/auth/signin" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {t.auth.signIn}
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.auth.joinUs}
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
