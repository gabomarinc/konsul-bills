export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Spinner circular */}
        <div className="w-16 h-16 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
        
        {/* Punto central */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-teal-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

// Variante para componentes pequeños
export function LoadingSpinnerSmall() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

// Variante con texto
export function LoadingSpinnerWithText({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-teal-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-slate-600 font-medium">{text}</p>
    </div>
  )
}

// Variante skeleton para listas
export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-slate-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  )
}





