"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface OnboardingContextType {
  hasCompletedOnboarding: boolean
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void
  completeOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya completó el onboarding
    const onboardingCompleted = localStorage.getItem("onboardingCompleted")
    if (onboardingCompleted === "true") {
      setHasCompletedOnboarding(true)
    } else {
      // Si es la primera vez, mostrar el onboarding automáticamente
      setShowOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
    setShowOnboarding(false)
    localStorage.setItem("onboardingCompleted", "true")
  }

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}

