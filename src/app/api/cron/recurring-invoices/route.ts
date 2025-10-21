import { NextRequest, NextResponse } from "next/server"
import { generateRecurringInvoices } from "@/lib/recurring-invoices"

/**
 * API Route para generar facturas recurrentes
 * Este endpoint será llamado por GitHub Actions (o Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar token de autenticación
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET
    
    if (!expectedToken) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Cron] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting recurring invoices generation...')
    const startTime = Date.now()

    // Generar facturas recurrentes
    const result = await generateRecurringInvoices()
    
    const duration = Date.now() - startTime
    console.log(`[Cron] Completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      generated: result.generated.length,
      invoices: result.generated,
      errors: result.errors.length,
      errorDetails: result.errors
    })
    
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para verificar que el cron está funcionando
 * Solo devuelve información básica sin ejecutar nada
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Recurring invoices cron endpoint is ready',
    timestamp: new Date().toISOString()
  })
}



