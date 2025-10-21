"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos "frescos" por 30 segundos
            staleTime: 30 * 1000,
            // Refresca automáticamente al volver a la pestaña
            refetchOnWindowFocus: true,
            // Reintentar en caso de error
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}



