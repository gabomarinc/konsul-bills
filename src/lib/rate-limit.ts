/**
 * Rate limiter simple basado en memoria
 * Para producción, considera usar Redis o un servicio de rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const requests = new Map<string, RateLimitEntry>()

// Limpiar entradas antiguas cada 10 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of requests.entries()) {
    if (entry.resetTime < now) {
      requests.delete(key)
    }
  }
}, 10 * 60 * 1000)

interface RateLimitOptions {
  /**
   * Número máximo de requests permitidos en la ventana de tiempo
   */
  max?: number
  
  /**
   * Ventana de tiempo en milisegundos
   */
  windowMs?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Verifica si un identificador (IP, email, etc.) ha excedido el límite de requests
 * 
 * @param identifier - Identificador único (IP, email, user ID, etc.)
 * @param options - Opciones de rate limiting
 * @returns Resultado del rate limiting
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const max = options.max ?? parseInt(process.env.RATE_LIMIT_MAX || '10', 10)
  const windowMs = options.windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) // 15 minutos por defecto
  
  const now = Date.now()
  const entry = requests.get(identifier)

  if (!entry || entry.resetTime < now) {
    // Nueva ventana de tiempo
    const resetTime = now + windowMs
    requests.set(identifier, {
      count: 1,
      resetTime
    })
    
    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: resetTime
    }
  }

  // Incrementar contador
  entry.count++
  requests.set(identifier, entry)

  if (entry.count > max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      reset: entry.resetTime
    }
  }

  return {
    success: true,
    limit: max,
    remaining: max - entry.count,
    reset: entry.resetTime
  }
}

/**
 * Obtiene el identificador para rate limiting desde el request
 * Usa X-Forwarded-For si está disponible, sino usa una combinación de headers
 */
export function getRateLimitIdentifier(request: Request): string {
  // Intentar obtener la IP real desde headers de proxy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  // Fallback: usar combinación de user-agent y accept-language para tener algún identificador
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLang = request.headers.get('accept-language') || 'unknown'
  return `${userAgent.slice(0, 50)}-${acceptLang.slice(0, 20)}`
}









