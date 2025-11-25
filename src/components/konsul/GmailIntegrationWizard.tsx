"use client"

import React, { useState, useEffect } from "react"
import { useTranslation } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Shield,
  Zap,
  Eye,
  Clock
} from "lucide-react"

type WizardStep = 1 | 2 | 3 | 4

interface GmailIntegrationWizardProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export default function GmailIntegrationWizard({ 
  open, 
  onClose, 
  onComplete 
}: GmailIntegrationWizardProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [isConnecting, setIsConnecting] = useState(false)

  // Debug: Log when open changes
  useEffect(() => {
    console.log("GmailIntegrationWizard open:", open)
  }, [open])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Redirigir a endpoint de OAuth
      window.location.href = "/api/gmail/oauth/connect"
    } catch (error) {
      console.error("Error connecting Gmail:", error)
      setIsConnecting(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setIsConnecting(false)
    onClose()
  }

  const steps = [
    {
      title: "Bienvenido",
      description: "Conecta tu Gmail para crear cotizaciones automáticamente",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Con esta integración podrás:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Detectar cotizaciones en tus correos automáticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Crear cotizaciones sin copiar y pegar información</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <span>Ahorrar tiempo y no perder oportunidades</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Seguridad y Privacidad",
      description: "Tus datos están protegidos",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">¿Qué permisos necesitamos?</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Solo lectura de correos (no podemos enviar ni modificar)</li>
                  <li>• Solo correos de los últimos 5 días</li>
                  <li>• Solo procesamos correos con palabras clave relacionadas</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-2">Tus datos están seguros</h4>
                <p className="text-sm text-green-800">
                  Los tokens de acceso se almacenan encriptados y solo se usan para leer correos. 
                  Puedes desconectar la integración en cualquier momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Cómo Funciona",
      description: "Proceso automático y sencillo",
      icon: Zap,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Sincronización Automática</h4>
                <p className="text-sm text-gray-600">
                  Cada 4 horas, revisamos tus correos de los últimos 5 días buscando cotizaciones.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Detección Inteligente</h4>
                <p className="text-sm text-gray-600">
                  Usamos IA para identificar y extraer datos de cotizaciones en tus correos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Preview y Confirmación</h4>
                <p className="text-sm text-gray-600">
                  Revisas los datos extraídos, los editas si es necesario, y confirmas para crear la cotización.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Conectar Gmail",
      description: "Último paso para activar la integración",
      icon: Mail,
      content: (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">¿Qué pasará ahora?</h4>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                  <li>Serás redirigido a Google para autorizar el acceso</li>
                  <li>Selecciona la cuenta de Gmail que quieres conectar</li>
                  <li>Autoriza los permisos de lectura</li>
                  <li>Serás redirigido de vuelta a la aplicación</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> La primera sincronización puede tardar unos minutos. 
                  Recibirás una notificación cuando se detecten nuevas cotizaciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep - 1]
  const Icon = currentStepData.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Icon className="h-6 w-6 text-blue-600" />
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Paso {currentStep} de {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card className="p-6 mb-6">
            {currentStepData.content}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handleBack}
              disabled={isConnecting}
            >
              {currentStep === 1 ? (
                "Cancelar"
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </>
              )}
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={isConnecting}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Conectar Gmail
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

