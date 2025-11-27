"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  ExternalLink
} from "lucide-react"
// import ProfileOnboardingModal from "@/components/konsul/ProfileOnboardingModal"

// Tipo para los datos del onboarding
type OnboardingData = {
  role?: string
  yearsExperience?: number
  seniority?: string
  skills?: string
  location?: string
  availability?: string
  contributionType?: string
  certifications?: string
  portfolioUrl?: string
  billingMethod?: string
  currentHourlyRate?: number
  targetHourlyRate?: number
  currentProjectRate?: number
  targetProjectRate?: number
  lastProjectDetails?: string
  lastProjectRate?: number
  minProjectRate?: number
  marketAnalysis?: string
  pricingRecommendations?: string
}

export default function SettingsPage() {
  const [profileSettings, setProfileSettings] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@company.com",
    companyName: "Acme Inc.",
    phone: "+1 (555) 123-4567",
    timezone: "Eastern Standard Time"
  })

  const [businessSettings, setBusinessSettings] = useState({
    businessAddress: "123 Business St, Suite 100, New York, NY 10001",
    taxId: "12-3456789",
    defaultCurrency: "USD",
    defaultTaxRate: 10.00,
    defaultPaymentTerms: "Net 30 days"
  })

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
    geminiAI: true
  })

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)

  const handleProfileUpdate = () => {
    console.log("Updating profile:", profileSettings)
  }

  const handleBusinessUpdate = () => {
    console.log("Updating business settings:", businessSettings)
  }

  const handleIntegrationToggle = (integration: string) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: !prev[integration as keyof typeof prev]
    }))
  }

  const handleOnboardingComplete = (data: OnboardingData) => {
    console.log("Profile onboarding completed:", data)
    // TODO: Implementar guardado de datos del perfil
    // Aquí se pueden guardar los datos en la base de datos
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Building2 className="h-6 w-6 text-slate-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          </div>
          <p className="text-slate-600 text-lg">Manage your account settings and preferences</p>
          
          {/* Botón Complete Your Profile */}
          <div className="mt-6">
            <p className="text-slate-600 mb-4 text-center">
              To make your experience much better and more tailored to your industry and/or work, please fill out the form to complete your profile.
            </p>
            <Button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="relative h-12 w-full rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            >
              <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 shadow ring-1 ring-amber-500/40">
                NEW
              </span>
              Complete Your Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Profile Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Profile Settings</h2>
                  <p className="text-slate-600 text-sm">Update your personal information</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input
                      value={profileSettings.firstName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input
                      value={profileSettings.lastName}
                      onChange={(e) => setProfileSettings(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <Input
                    value={profileSettings.companyName}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={profileSettings.timezone}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1"
                  >
                    <option value="Eastern Standard Time">Eastern Standard Time</option>
                    <option value="Central Standard Time">Central Standard Time</option>
                    <option value="Mountain Standard Time">Mountain Standard Time</option>
                    <option value="Pacific Standard Time">Pacific Standard Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} className="mt-6 w-full bg-teal-600 hover:bg-teal-700">
                Update Profile
              </Button>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
                  <p className="text-slate-600 text-sm">Manage your notification preferences</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Email Notifications</span>
                      </div>
                      <p className="text-sm text-slate-600">Receive updates about quotes and invoices via email</p>
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
                        <span className="font-medium">Push Notifications</span>
                      </div>
                      <p className="text-sm text-slate-600">Get instant notifications in your browser</p>
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
                  <h4 className="font-medium mb-3">Email Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="quoteStatus"
                        checked={notifications.quoteStatusUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, quoteStatusUpdates: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="quoteStatus">Quote status updates</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="paymentReminders"
                        checked={notifications.paymentReminders}
                        onChange={(e) => setNotifications(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="paymentReminders">Payment reminders</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="weeklyReports"
                        checked={notifications.weeklyReports}
                        onChange={(e) => setNotifications(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="weeklyReports">Weekly reports</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="marketingUpdates"
                        checked={notifications.marketingUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, marketingUpdates: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="marketingUpdates">Marketing updates</label>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security & Privacy */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Security & Privacy</h2>
                  <p className="text-slate-600 text-sm">Manage your account security settings</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Password</h4>
                    <span className="text-sm text-slate-500">Last changed 3 months ago</span>
                  </div>
                  <Button variant="outline" size="sm">Change Password</Button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-slate-600 mb-3">Add an extra layer of security to your account</p>
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Business Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Business Settings</h2>
                  <p className="text-slate-600 text-sm">Configure your business details</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Address</label>
                  <Input
                    value={businessSettings.businessAddress}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Tax ID / EIN</label>
                  <Input
                    value={businessSettings.taxId}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Default Currency</label>
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
                  <label className="block text-sm font-medium mb-2">Default Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={businessSettings.defaultTaxRate}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Default Payment Terms</label>
                  <select
                    value={businessSettings.defaultPaymentTerms}
                    onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultPaymentTerms: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1"
                  >
                    <option value="Net 15 days">Net 15 days</option>
                    <option value="Net 30 days">Net 30 days</option>
                    <option value="Net 45 days">Net 45 days</option>
                    <option value="Net 60 days">Net 60 days</option>
                    <option value="Due on receipt">Due on receipt</option>
                  </select>
                </div>
              </div>
              
              <Button onClick={handleBusinessUpdate} className="mt-6 w-full bg-teal-600 hover:bg-teal-700">
                Save Business Settings
              </Button>
            </Card>

            {/* Integrations */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Integrations</h2>
                  <p className="text-slate-600 text-sm">Connect your favorite tools and services</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Gmail Integration */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Gmail</h4>
                      <p className="text-sm text-slate-600">Send quotes directly from Gmail</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={integrations.gmail ? "default" : "secondary"}>
                      {integrations.gmail ? "Connected" : "Not Connected"}
                    </Badge>
                    <Button
                      variant={integrations.gmail ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleIntegrationToggle("gmail")}
                    >
                      {integrations.gmail ? "Disconnect" : "Connect"}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                {/* Gemini AI Integration */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Gemini AI</h4>
                      <p className="text-sm text-slate-600">Smart quote generation and suggestions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={integrations.geminiAI ? "default" : "secondary"}>
                      {integrations.geminiAI ? "Connected" : "Not Connected"}
                    </Badge>
                    <Button
                      variant={integrations.geminiAI ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleIntegrationToggle("geminiAI")}
                    >
                      {integrations.geminiAI ? "Disconnect" : "Connect"}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                {/* Coming Soon Section */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-slate-600">Coming Soon</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs">S</span>
                      </div>
                      <span className="text-sm text-slate-600">Slack</span>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs">$</span>
                      </div>
                      <span className="text-sm text-slate-600">QuickBooks</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Data Export / Danger Zone */}
            <Card className="p-6">
              <div className="space-y-6">
                {/* Data Export */}
                <div>
                  <h4 className="font-medium mb-2">Data Export</h4>
                  <p className="text-sm text-slate-600 mb-3">Download a copy of your data</p>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
                
                {/* Danger Zone */}
                <div className="pt-6 border-t border-slate-200">
                  <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                  <p className="text-sm text-slate-600 mb-3">Permanently delete your account and all data</p>
                  <Button variant="destructive" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Profile Onboarding Modal */}
        {/* <ProfileOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={handleOnboardingComplete}
        /> */}
      </div>
  )
}
