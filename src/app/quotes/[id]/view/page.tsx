import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { 
      Client: true, 
      QuoteItem: true,
      Company: {
        include: {
          CompanySettings: true
        }
      }
    },
  })
  
  if (!quote) return notFound()

  const settings = quote.Company.CompanySettings
  const companyName = quote.Company.name
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: quote.currency as "EUR" | "USD"
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const companyAddress = settings 
    ? [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.zip, settings.country]
        .filter(Boolean)
        .join(", ")
    : ""

  const clientAddress = [
    quote.Client.billingLine1,
    quote.Client.billingLine2,
    quote.Client.billingCity,
    quote.Client.billingState,
    quote.Client.billingZip,
    quote.Client.billingCountry
  ].filter(Boolean).join(", ")

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              {settings?.logoUrl && (
                <img 
                  src={settings.logoUrl} 
                  alt={companyName}
                  className="h-12 mb-4"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
              <p className="text-sm text-gray-600 mt-1">Soluciones Digitales Profesionales</p>
            </div>
            <div className="text-right">
              <p className="text-lg text-gray-400 font-normal">COTIZACIÓN</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{quote.id}</p>
            </div>
          </div>
        </div>

        {/* Company and Client Info */}
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">DE:</h2>
            <p className="text-base font-bold text-gray-900">{companyName}</p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {settings?.emailFrom && <p>{settings.emailFrom}</p>}
              {settings?.phone && <p>Tel: {settings.phone}</p>}
              {settings?.website && <p>{settings.website}</p>}
              {companyAddress && <p>{companyAddress}</p>}
              {settings?.taxId && <p>NIF/CIF: {settings.taxId}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">CLIENTE</h2>
            <p className="text-base font-bold text-gray-900">{quote.Client.name}</p>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              {quote.Client.email && <p>{quote.Client.email}</p>}
              {quote.Client.phone && <p>Tel: {quote.Client.phone}</p>}
              {clientAddress && <p>{clientAddress}</p>}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="px-8 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">FECHA DE EMISIÓN: </span>
              <span className="text-gray-900">{formatDate(quote.issueDate)}</span>
            </div>
            {quote.dueDate && (
              <div>
                <span className="font-semibold text-gray-700">VÁLIDA HASTA: </span>
                <span className="text-gray-900">{formatDate(quote.dueDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="px-8 py-6">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e3a8a] text-white">
                  <th className="px-4 py-3 text-left text-sm font-bold">DESCRIPCIÓN</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">CANT.</th>
                  <th className="px-4 py-3 text-right text-sm font-bold">PRECIO UNIT.</th>
                  <th className="px-4 py-3 text-right text-sm font-bold">TOTAL</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {quote.QuoteItem.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(item.qty * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(quote.subtotal)} {quote.currency}</span>
              </div>
              {quote.tax && quote.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Impuestos ({quote.tax}%):</span>
                  <span className="text-gray-900">
                    {formatCurrency(quote.subtotal * (quote.tax / 100))} {quote.currency}
                  </span>
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-gray-300">
                <div className="bg-green-100 rounded-lg px-4 py-3 flex justify-between items-center">
                  <span className="font-bold text-green-700">TOTAL:</span>
                  <span className="font-bold text-green-700 text-lg">
                    {formatCurrency(quote.total)} {quote.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="px-8 py-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Notas y Condiciones:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {quote.notes.split('\n').filter(line => line.trim()).map((line, index) => (
                <p key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{line.trim().replace(/^[•\-\*]\s*/, '')}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            {companyName} - Transformando ideas en soluciones digitales
          </p>
          <p className="text-sm text-gray-500 mt-1">Gracias por confiar en nosotros</p>
        </div>
      </div>
    </div>
  )
}

