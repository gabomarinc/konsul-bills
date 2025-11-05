import { prisma } from '@/lib/prisma'
import { nextHumanId } from '@/lib/ids'
import { nanoid } from 'nanoid'

export type RecurringInvoiceGenerationResult = {
  generated: string[]
  errors: Array<{
    recurringId: string
    error: string
  }>
}

/**
 * Genera facturas a partir de facturas recurrentes que deben ejecutarse hoy
 */
export async function generateRecurringInvoices(): Promise<RecurringInvoiceGenerationResult> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const results: RecurringInvoiceGenerationResult = {
    generated: [],
    errors: []
  }

  try {
    // Buscar facturas recurrentes activas que deben ejecutarse hoy o antes
    const recurringInvoices = await prisma.recurringInvoice.findMany({
      where: {
        isActive: true,
        nextRunDate: {
          lte: today
        }
      },
      include: {
        RecurringItem: true,
        Client: true,
        Company: {
          include: {
            CompanySettings: true
          }
        }
      }
    })

    console.log(`[Recurring Invoices] Found ${recurringInvoices.length} invoices to generate`)

    for (const recurring of recurringInvoices) {
      try {
        // Generar ID para la factura
        const invoiceId = await nextHumanId({
          companyId: recurring.companyId,
          type: 'INVOICE',
          prefix: recurring.Company.CompanySettings?.invoicePrefix ?? 'INV-',
          padding: recurring.Company.CompanySettings?.numberPadding ?? 5
        })

        // Calcular fecha de vencimiento
        const dueDate = new Date(today)
        dueDate.setDate(dueDate.getDate() + recurring.dueInDays)

        // Crear la factura
        await prisma.invoice.create({
          data: {
            id: invoiceId,
            companyId: recurring.companyId,
            clientId: recurring.clientId,
            title: recurring.title,
            issueDate: today,
            dueDate: dueDate,
            currency: recurring.currency,
            tax: recurring.tax,
            subtotal: recurring.subtotal,
            taxAmount: recurring.taxAmount,
            total: recurring.total,
            balanceDue: recurring.total,
            status: 'DRAFT',
            notes: recurring.notes ? `${recurring.notes}\n\n(Generada automáticamente)` : 'Generada automáticamente desde factura recurrente',
            updatedAt: new Date(),
            InvoiceItem: {
              create: recurring.RecurringItem.map(item => ({
                id: `item_${nanoid(16)}`,
                description: item.description,
                qty: item.qty,
                price: item.price
              }))
            }
          }
        })

        // Calcular próxima fecha de ejecución
        const nextRun = calculateNextRunDate(
          recurring.frequency,
          recurring.intervalValue,
          recurring.dayOfMonth,
          recurring.nextRunDate
        )

        // Verificar si debe desactivarse
        const shouldDeactivate = recurring.endDate && nextRun > recurring.endDate

        // Actualizar la factura recurrente
        await prisma.recurringInvoice.update({
          where: { id: recurring.id },
          data: {
            lastRunDate: today,
            nextRunDate: nextRun,
            isActive: shouldDeactivate ? false : true,
            updatedAt: new Date()
          }
        })

        results.generated.push(invoiceId)
        console.log(`[Recurring Invoices] ✅ Generated invoice ${invoiceId} from recurring ${recurring.id}`)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          recurringId: recurring.id,
          error: errorMessage
        })
        console.error(`[Recurring Invoices] ❌ Error generating invoice for recurring ${recurring.id}:`, error)
      }
    }

    console.log(`[Recurring Invoices] Summary: ${results.generated.length} generated, ${results.errors.length} errors`)

  } catch (error) {
    console.error('[Recurring Invoices] Fatal error:', error)
    throw error
  }

  return results
}

/**
 * Calcula la próxima fecha de ejecución basada en la frecuencia
 */
function calculateNextRunDate(
  frequency: string,
  interval: number,
  dayOfMonth: number | null,
  currentDate: Date
): Date {
  const next = new Date(currentDate)
  
  switch (frequency) {
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval)
      if (dayOfMonth) {
        // Ajustar al día del mes especificado
        const daysInMonth = getDaysInMonth(next)
        next.setDate(Math.min(dayOfMonth, daysInMonth))
      }
      break
      
    case 'WEEKLY':
      next.setDate(next.getDate() + (7 * interval))
      break
      
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval)
      break
      
    default:
      // Por defecto, mensual
      next.setMonth(next.getMonth() + interval)
  }
  
  return next
}

/**
 * Obtiene el número de días en un mes
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Función auxiliar para probar el generador manualmente
 */
export async function testRecurringInvoices() {
  console.log('🧪 Testing recurring invoices generator...')
  const result = await generateRecurringInvoices()
  console.log('📊 Test results:', result)
  return result
}







