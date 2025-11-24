"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/contexts/LanguageContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  User, 
  Building2, 
  Bell, 
  Zap, 
  Shield, 
  Mail, 
  Smartphone,
  FileText,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  MessageCircle
} from "lucide-react"


export default function SettingsPage() {
  const { t } = useTranslation()
  const [profileSettings, setProfileSettings] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phone: "",
    timezone: "Europe/Madrid"
  })

  const [businessSettings, setBusinessSettings] = useState({
    businessAddress: "",
    taxId: "",
    defaultCurrency: "EUR",
    defaultTaxRate: 21.00,
    defaultPaymentTerms: "Net 30 días"
  })

  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    quoteStatusUpdates: true,
    paymentReminders: true,
    weeklyReports: false,
    marketingUpdates: false
  })

  const [integrations, setIntegrations] = useState({
    gmail: false,
    geminiAI: true,
    stripe: false
  })

  const [stripeSettings, setStripeSettings] = useState({
    enabled: false,
    secretKey: "",
    publishableKey: ""
  })

  const [stripeDialogOpen, setStripeDialogOpen] = useState(false)

  const [telegramSettings, setTelegramSettings] = useState({
    linked: false,
    telegramId: "",
    username: "",
    firstName: "",
    lastName: ""
  })

  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false)
  const [telegramIdInput, setTelegramIdInput] = useState("")


  // Cargar datos iniciales
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingData(true)
        
        // Cargar perfil
        const profileResponse = await fetch("/api/settings/profile", {
          credentials: "include"
        })
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setProfileSettings({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            email: profileData.email || "",
            companyName: profileData.companyName || "",
            phone: profileData.phone || "",
            timezone: profileData.timezone || "Europe/Madrid"
          })
        }

        // Cargar configuración de negocio
        const businessResponse = await fetch("/api/settings/business", {
          credentials: "include"
        })
        if (businessResponse.ok) {
          const businessData = await businessResponse.json()
          setBusinessSettings({
            businessAddress: businessData.businessAddress || "",
            taxId: businessData.taxId || "",
            defaultCurrency: businessData.defaultCurrency || "EUR",
            defaultTaxRate: businessData.defaultTaxRate ?? 21.00,
            defaultPaymentTerms: businessData.defaultPaymentTerms || "Net 30 días"
          })
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoadingData(false)
      }
    }

    loadSettings()
  }, [])

  const handleProfileUpdate = async () => {
    try {
      setLoadingProfile(true)
      
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileSettings)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar perfil")
      }

      alert("✅ Perfil actualizado exitosamente")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      alert(`Error: ${error.message || "Error al guardar perfil"}`)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleBusinessUpdate = async () => {
    try {
      setLoadingBusiness(true)
      
      const response = await fetch("/api/settings/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(businessSettings)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar configuración")
      }

      alert("✅ Configuración de negocio guardada exitosamente")
    } catch (error: any) {
      console.error("Error updating business settings:", error)
      alert(`Error: ${error.message || "Error al guardar configuración"}`)
    } finally {
      setLoadingBusiness(false)
    }
  }

  const handleIntegrationToggle = (integration: string) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: !prev[integration as keyof typeof prev]
    }))
  }

  const handleStripeSave = async () => {
    try {
      const response = await fetch("/api/stripe/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          secretKey: stripeSettings.secretKey,
          publishableKey: stripeSettings.publishableKey,
          enabled: true
        })
      })

      if (!response.ok) {
        throw new Error("Error al guardar configuración")
      }

      setStripeSettings(prev => ({ ...prev, enabled: true }))
      setStripeDialogOpen(false)
      console.log("Stripe configurado exitosamente")
    } catch (error) {
      console.error("Error saving Stripe config:", error)
      alert("Error al guardar configuración de Stripe")
    }
  }

  // Cargar estado de Telegram al montar el componente
  useEffect(() => {
    const loadTelegramStatus = async () => {
      try {
        const response = await fetch("/api/telegram/link", {
          credentials: "include"
        })
        if (response.ok) {
          const data = await response.json()
          setTelegramSettings({
            linked: data.linked,
            telegramId: data.telegramUser?.telegramId || "",
            username: data.telegramUser?.username || "",
            firstName: data.telegramUser?.firstName || "",
            lastName: data.telegramUser?.lastName || ""
          })
        }
      } catch (error) {
        console.error("Error loading Telegram status:", error)
      }
    }
    loadTelegramStatus()
  }, [])

  const handleTelegramLink = async () => {
    if (!telegramIdInput.trim()) {
      alert("Por favor, ingresa tu Telegram ID")
      return
    }

    try {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          telegramId: telegramIdInput.trim(),
          username: telegramSettings.username,
          firstName: telegramSettings.firstName,
          lastName: telegramSettings.lastName
        })
      })

      if (!response.ok) {
        throw new Error("Error al vincular cuenta")
      }

      const data = await response.json()
      setTelegramSettings({
        linked: true,
        telegramId: data.telegramUser.telegramId,
        username: data.telegramUser.username || "",
        firstName: telegramSettings.firstName,
        lastName: telegramSettings.lastName
      })
      setTelegramDialogOpen(false)
      setTelegramIdInput("")
      alert("✅ Cuenta de Telegram vinculada exitosamente")
    } catch (error) {
      console.error("Error linking Telegram:", error)
      alert("Error al vincular cuenta de Telegram")
    }
  }

  const handleTelegramUnlink = async () => {
    if (!confirm("¿Estás seguro de que quieres desvincular tu cuenta de Telegram?")) {
      return
    }

    try {
      const response = await fetch("/api/telegram/link", {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Error al desvincular cuenta")
      }

      setTelegramSettings({
        linked: false,
        telegramId: "",
        username: "",
        firstName: "",
        lastName: ""
      })
      alert("✅ Cuenta de Telegram desvinculada")
    } catch (error) {
      console.error("Error unlinking Telegram:", error)
      alert("Error al desvincular cuenta de Telegram")
    }
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Building2 className="h-6 w-6 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{t.settings.title}</h1>
          </div>
          <p className="text-slate-600 text-lg">{t.settings.subtitle}</p>
          
          <div className="mt-6">
            <p className="text-slate-600 mb-4 text-center">
              {t.settings.completeProfileText}
            </p>
            <Button
              type="button"
              onClick={() => console.log("Onboarding clicked")}
              disabled
              className="relative h-12 w-full rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all opacity-60 cursor-not-allowed"
            >
              <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 shadow ring-1 ring-amber-500/40">
                En Desarrollo
              </span>
              {t.settings.completeProfileTitle}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t.settings.profileSettings}</h2>
                  <p className="text-slate-600 text-sm">{t.settings.profileSubtitle}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.settings.firstName}</label>
                    <Input
                      value={profileSettings.firstName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.settings.lastName}</label>
                    <Input
                      value={profileSettings.lastName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.emailAddress}</label>
                  <Input
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.companyName}</label>
                  <Input
                    value={profileSettings.companyName}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.phone}</label>
                  <Input
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.timezone}</label>
                  <select
                    value={profileSettings.timezone}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/Madrid">Madrid (CET)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="America/Mexico_City">Mexico City (CST)</option>
                    <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={handleProfileUpdate} 
                className="mt-6 w-full bg-teal-600 hover:bg-teal-700"
                disabled={loadingProfile || loadingData}
              >
                {loadingProfile ? "Guardando..." : t.settings.updateProfile}
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t.settings.notificationsTitle}</h2>
                  <p className="text-slate-600 text-sm">{t.settings.notificationsSubtitle}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{t.settings.emailNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-600">{t.settings.emailNotificationsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{t.settings.pushNotifications}</span>
                      </div>
                      <p className="text-sm text-slate-600">{t.settings.pushNotificationsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">{t.settings.emailPreferences}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="quoteStatus"
                        checked={notifications.quoteStatusUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, quoteStatusUpdates: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="quoteStatus">{t.settings.quoteStatusUpdates}</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="paymentReminders"
                        checked={notifications.paymentReminders}
                        onChange={(e) => setNotifications(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="paymentReminders">{t.settings.paymentReminders}</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="weeklyReports"
                        checked={notifications.weeklyReports}
                        onChange={(e) => setNotifications(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="weeklyReports">{t.settings.weeklyReports}</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="marketingUpdates"
                        checked={notifications.marketingUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, marketingUpdates: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="marketingUpdates">{t.settings.marketingUpdates}</label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t.settings.securityTitle}</h2>
                  <p className="text-slate-600 text-sm">{t.settings.securitySubtitle}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{t.settings.password}</h4>
                    <span className="text-sm text-slate-500">{t.settings.lastChanged}</span>
                  </div>
                  <Button variant="outline" size="sm">{t.settings.changePassword}</Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t.settings.twoFactor}</h4>
                  <p className="text-sm text-slate-600 mb-3">{t.settings.twoFactorDesc}</p>
                  <Button variant="outline" size="sm">{t.settings.enable2FA}</Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t.settings.businessSettings}</h2>
                  <p className="text-slate-600 text-sm">{t.settings.businessSubtitle}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.businessAddress}</label>
                  <Input
                    value={businessSettings.businessAddress}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.taxId}</label>
                  <Input
                    value={businessSettings.taxId}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.defaultCurrency}</label>
                  <select
                    value={businessSettings.defaultCurrency}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.defaultTaxRate}</label>
                  <Input
                    type="number"
                    value={businessSettings.defaultTaxRate}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setBusinessSettings(prev => ({ ...prev, defaultTaxRate: isNaN(value) ? 0 : value }))
                    }}
                    min="0"
                    max="100"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{t.settings.defaultPaymentTerms}</label>
                  <select
                    value={businessSettings.defaultPaymentTerms}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultPaymentTerms: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1"
                  >
                    <option value="Net 15 days">Net 15 días</option>
                    <option value="Net 30 days">Net 30 días</option>
                    <option value="Net 45 days">Net 45 días</option>
                    <option value="Net 60 days">Net 60 días</option>
                    <option value="Due on receipt">Vencimiento al recibir</option>
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={handleBusinessUpdate} 
                className="mt-6 w-full bg-teal-600 hover:bg-teal-700"
                disabled={loadingBusiness || loadingData}
              >
                {loadingBusiness ? "Guardando..." : t.settings.saveBusinessSettings}
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{t.settings.integrationsTitle}</h2>
                  <p className="text-slate-600 text-sm">{t.settings.integrationsSubtitle}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{t.settings.gmail}</h4>
                      <p className="text-sm text-slate-600">{t.settings.gmailDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={integrations.gmail ? "default" : "secondary"}>
                      {integrations.gmail ? t.settings.connected : t.settings.notConnected}
                    </Badge>
                    <Button
                      variant={integrations.gmail ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleIntegrationToggle("gmail")}
                    >
                      {integrations.gmail ? t.settings.disconnect : t.settings.connect}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{t.settings.geminiAI}</h4>
                      <p className="text-sm text-slate-600">{t.settings.geminiAIDesc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={integrations.geminiAI ? "default" : "secondary"}>
                      {integrations.geminiAI ? t.settings.connected : t.settings.notConnected}
                    </Badge>
                    <Button
                      variant={integrations.geminiAI ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleIntegrationToggle("geminiAI")}
                    >
                      {integrations.geminiAI ? t.settings.disconnect : t.settings.connect}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                {/* Stripe Integration */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">$</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Stripe</h4>
                      <p className="text-sm text-slate-600">Acepta pagos y cobra facturas automáticamente</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={stripeSettings.enabled ? "default" : "secondary"}>
                      {stripeSettings.enabled ? t.settings.connected : t.settings.notConnected}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      En Desarrollo
                    </Button>
                  </div>
                </div>

                {/* Telegram Integration */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">Telegram</h4>
                      <p className="text-sm text-slate-600">Crea facturas y cotizaciones desde Telegram</p>
                      {telegramSettings.linked && telegramSettings.username && (
                        <p className="text-xs text-slate-500 mt-1">@{telegramSettings.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={telegramSettings.linked ? "default" : "secondary"}>
                      {telegramSettings.linked ? "Vinculado" : "No vinculado"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      En Desarrollo
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-slate-600">{t.settings.comingSoon}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs">S</span>
                      </div>
                      <span className="text-sm text-slate-600">{t.settings.slack}</span>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs">$</span>
                      </div>
                      <span className="text-sm text-slate-600">{t.settings.quickbooks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">{t.settings.dataExport}</h4>
                  <p className="text-sm text-slate-600 mb-3">{t.settings.dataExportDesc}</p>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    {t.settings.exportDataButton}
                  </Button>
                </div>
                
                <div className="pt-6 border-t border-slate-200">
                  <h4 className="font-medium mb-2 text-red-600">{t.settings.dangerZone}</h4>
                  <p className="text-sm text-slate-600 mb-3">{t.settings.dangerZoneDesc}</p>
                  <Button variant="destructive" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t.settings.deleteAccount}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Telegram Link Dialog */}
        <Dialog open={telegramDialogOpen} onOpenChange={setTelegramDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Vincular cuenta de Telegram</DialogTitle>
                  <DialogDescription>
                    Conecta tu cuenta de Telegram para usar el bot
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="telegram-id" className="text-sm font-medium">
                  Tu Telegram ID
                </label>
                <Input
                  id="telegram-id"
                  type="text"
                  placeholder="123456789"
                  value={telegramIdInput}
                  onChange={(e) => setTelegramIdInput(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Para obtener tu ID, busca @userinfobot en Telegram y envía /start
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">¿Cómo obtener tu Telegram ID?</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Abre Telegram y busca <code className="bg-blue-100 px-1 rounded">@userinfobot</code></li>
                  <li>Envía el comando <code className="bg-blue-100 px-1 rounded">/start</code></li>
                  <li>El bot te mostrará tu ID (número)</li>
                  <li>Copia ese número y pégalo aquí</li>
                </ol>
                <a 
                  href="https://t.me/userinfobot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-2 inline-flex items-center gap-1"
                >
                  Abrir @userinfobot en Telegram
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setTelegramDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleTelegramLink}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!telegramIdInput.trim()}
              >
                Vincular cuenta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stripe Configuration Dialog */}
        <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Configurar Stripe</DialogTitle>
                  <DialogDescription>
                    Conecta tu cuenta de Stripe para aceptar pagos automáticamente
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="stripe-secret-key" className="text-sm font-medium">
                  Secret Key
                </label>
                <Input
                  id="stripe-secret-key"
                  type="password"
                  placeholder="sk_test_..."
                  value={stripeSettings.secretKey}
                  onChange={(e) => setStripeSettings(prev => ({ ...prev, secretKey: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  Encuentra tu Secret Key en tu Dashboard de Stripe
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="stripe-publishable-key" className="text-sm font-medium">
                  Publishable Key
                </label>
                <Input
                  id="stripe-publishable-key"
                  type="text"
                  placeholder="pk_test_..."
                  value={stripeSettings.publishableKey}
                  onChange={(e) => setStripeSettings(prev => ({ ...prev, publishableKey: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  Tu Publishable Key es pública y segura para usar en el frontend
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">¿Cómo obtener tus API Keys?</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Ve a tu Dashboard de Stripe</li>
                  <li>Click en &quot;Developers&quot; → &quot;API keys&quot;</li>
                  <li>Copia tus keys (usa Test keys para pruebas)</li>
                  <li>Pégalas aquí y guarda</li>
                </ol>
                <a 
                  href="https://dashboard.stripe.com/apikeys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-2 inline-flex items-center gap-1"
                >
                  Ir a Stripe Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStripeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleStripeSave}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!stripeSettings.secretKey || !stripeSettings.publishableKey}
              >
                Guardar y Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
