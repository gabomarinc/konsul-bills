/**
 * Utilidades para envío de emails
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envía un email usando el servicio configurado
 * Por ahora es un placeholder - necesitas configurar un servicio de email
 * (Resend, SendGrid, Nodemailer, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implementar envío real de emails
  // Opciones:
  // 1. Resend (recomendado para Next.js)
  // 2. SendGrid
  // 3. Nodemailer con SMTP
  // 4. AWS SES
  
  console.log("[EMAIL] Enviando email:", {
    to: options.to,
    subject: options.subject
  })

  // Por ahora solo logueamos
  // En producción, implementar con Resend o similar
  return true
}

/**
 * Genera el HTML de una cotización para email
 */
export function generateQuoteEmailHTML(quote: {
  id: string
  title: string
  Client: { name: string; email?: string | null }
  total: number
  currency: string
  issueDate: Date
  dueDate?: Date | null
  QuoteItem: Array<{ description: string; qty: number; price: number }>
}): string {
  const itemsHTML = quote.QuoteItem.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} ${quote.currency}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.qty * item.price).toFixed(2)} ${quote.currency}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f9fafb; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; color: #2563eb; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cotización ${quote.id}</h1>
        </div>
        <div class="content">
          <p>Estimado/a ${quote.Client.name},</p>
          <p>Adjunto encontrará la cotización <strong>${quote.id}</strong> para ${quote.title}.</p>
          
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div class="total" style="text-align: right;">
            Total: ${quote.total.toFixed(2)} ${quote.currency}
          </div>
          
          ${quote.dueDate ? `<p><strong>Fecha de vencimiento:</strong> ${new Date(quote.dueDate).toLocaleDateString('es-ES')}</p>` : ''}
        </div>
        <div class="footer">
          <p>Este es un email automático de Konsul Bills</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Genera el HTML de una factura para email
 */
export function generateInvoiceEmailHTML(invoice: {
  id: string
  title: string
  Client: { name: string; email?: string | null }
  total: number
  currency: string
  issueDate: Date
  dueDate?: Date | null
  InvoiceItem: Array<{ description: string; qty: number; price: number }>
}): string {
  const itemsHTML = invoice.InvoiceItem.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} ${invoice.currency}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.qty * item.price).toFixed(2)} ${invoice.currency}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; border: 1px solid #ddd; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f9fafb; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .total { font-size: 18px; font-weight: bold; color: #059669; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Factura ${invoice.id}</h1>
        </div>
        <div class="content">
          <p>Estimado/a ${invoice.Client.name},</p>
          <p>Adjunto encontrará la factura <strong>${invoice.id}</strong> para ${invoice.title}.</p>
          
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div class="total" style="text-align: right;">
            Total: ${invoice.total.toFixed(2)} ${invoice.currency}
          </div>
          
          ${invoice.dueDate ? `<p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</p>` : ''}
        </div>
        <div class="footer">
          <p>Este es un email automático de Konsul Bills</p>
        </div>
      </div>
    </body>
    </html>
  `
}

