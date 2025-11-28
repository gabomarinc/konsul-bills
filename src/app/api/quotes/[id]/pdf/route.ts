import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await getUserCompanyFromRequest(req)
    
    // Obtener la cotización con todos los datos necesarios
    const quote = await prisma.quote.findFirst({
      where: { 
        id: id,
        companyId: company.id
      },
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

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    const settings = quote.Company.CompanySettings
    const logoUrl = settings?.logoUrl

    // Crear PDF
    const doc = new jsPDF()
    
    // Configuración de colores modernos y vibrantes
    const primaryColor: [number, number, number] = [99, 102, 241] // índigo moderno
    const accentColor: [number, number, number] = [139, 92, 246] // púrpura moderno
    const successColor: [number, number, number] = [16, 185, 129] // verde esmeralda
    const textColor: [number, number, number] = [15, 23, 42] // texto principal oscuro
    const grayText: [number, number, number] = [100, 116, 139] // texto secundario
    const lightGray: [number, number, number] = [248, 250, 252] // fondo gris muy claro
    const cardBg: [number, number, number] = [255, 255, 255] // fondo blanco para tarjetas
    const tableHeaderBg: [number, number, number] = [99, 102, 241] // fondo header tabla
    const tableRowBg: [number, number, number] = [248, 250, 252] // fondo filas alternas

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    // ========== HEADER MODERNO CON BORDES REDONDEADOS ==========
    // Fondo del header con color moderno
    doc.setFillColor(...primaryColor)
    doc.roundedRect(0, 0, pageWidth, 60, 0, 0, 'F')
    
    let yPos = 18
    
    // Logo mejorado con fondo blanco redondeado
    if (logoUrl) {
      try {
        const base64Data = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl
        const imageType = logoUrl.startsWith('data:image/png') ? 'PNG' : 
                         logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        // Fondo blanco redondeado para el logo
        doc.setFillColor(...cardBg)
        doc.roundedRect(margin - 5, yPos - 5, 70, 35, 8, 8, 'F')
        // Logo más grande: 60x30
        doc.addImage(base64Data, imageType, margin, yPos, 60, 30)
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    // Título "COTIZACIÓN" y número en el lado derecho con fondo blanco redondeado
    const headerRightX = pageWidth - margin
    
    // Fondo blanco redondeado para el título
    doc.setFillColor(...cardBg)
    doc.roundedRect(pageWidth - 140, yPos - 5, 120, 35, 12, 12, 'F')
    
    doc.setFontSize(28)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("COTIZACIÓN", headerRightX, yPos + 8, { align: "right" })
    
    doc.setFontSize(12)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text(`#${quote.id}`, headerRightX, yPos + 20, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA Y CLIENTE (TARJETAS MODERNAS) ==========
    yPos = 75
    
    const companyName = quote.Company.name
    const leftColumnX = margin
    const rightColumnX = pageWidth / 2 + 15
    const cardWidth = (pageWidth - (margin * 3)) / 2
    
    // Columna izquierda: Tarjeta de información de la empresa
    const companyInfo: string[] = []
    if (settings?.emailFrom) companyInfo.push(settings.emailFrom)
    if (settings?.phone) companyInfo.push(`Tel: ${settings.phone}`)
    if (settings?.website) companyInfo.push(settings.website)
    
    const companyAddress = settings 
      ? [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.zip, settings.country]
          .filter(Boolean)
          .join(", ")
      : ""
    if (companyAddress) companyInfo.push(companyAddress)
    if (settings?.taxId) companyInfo.push(`NIF/CIF: ${settings.taxId}`)
    
    const companyCardHeight = 25 + (companyInfo.length * 5)
    
    // Tarjeta empresa con bordes redondeados
    doc.setFillColor(...cardBg)
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1.5)
    doc.roundedRect(leftColumnX, yPos - 10, cardWidth, companyCardHeight, 12, 12, 'FD')
    
    // Título de la tarjeta
    doc.setFontSize(11)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("DE:", leftColumnX + 10, yPos)
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, leftColumnX + 10, yPos + 8)
    
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    companyInfo.forEach((info, index) => {
      doc.text(info, leftColumnX + 10, yPos + 15 + (index * 5))
    })

    // Columna derecha: Tarjeta de información del cliente
    const clientInfo: string[] = []
    if (quote.Client.email) clientInfo.push(quote.Client.email)
    if (quote.Client.phone) clientInfo.push(`Tel: ${quote.Client.phone}`)
    
    // Construir dirección del cliente
    const clientAddress = [
      quote.Client.billingLine1,
      quote.Client.billingLine2,
      quote.Client.billingCity,
      quote.Client.billingState,
      quote.Client.billingZip,
      quote.Client.billingCountry
    ].filter(Boolean).join(", ")
    if (clientAddress) clientInfo.push(clientAddress)
    
    const clientCardHeight = 25 + (clientInfo.length * 5)
    
    // Tarjeta cliente con bordes redondeados
    doc.setFillColor(...cardBg)
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(1.5)
    doc.roundedRect(rightColumnX, yPos - 10, cardWidth, clientCardHeight, 12, 12, 'FD')
    
    doc.setFontSize(11)
    doc.setTextColor(...accentColor)
    doc.setFont("helvetica", "bold")
    doc.text("PARA:", rightColumnX + 10, yPos)
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(quote.Client.name, rightColumnX + 10, yPos + 8)
    
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    clientInfo.forEach((info, index) => {
      doc.text(info, rightColumnX + 10, yPos + 15 + (index * 5))
    })

    // ========== FECHAS Y DETALLES (TARJETA MODERNA) ==========
    yPos = Math.max(yPos + companyCardHeight, yPos + clientCardHeight) + 15
    
    // Tarjeta de fechas con bordes redondeados
    const datesCardHeight = quote.dueDate ? 28 : 22
    doc.setFillColor(...lightGray)
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1)
    doc.roundedRect(margin, yPos - 8, pageWidth - (margin * 2), datesCardHeight, 12, 12, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    const issueDate = new Date(quote.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text(`📅 Fecha de Emisión: ${issueDate}`, margin + 10, yPos)
    
    if (quote.dueDate) {
      const dueDate = new Date(quote.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`⏰ Válida hasta: ${dueDate}`, margin + 10, yPos + 7)
    }
    
    doc.setFontSize(10)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text(`💰 Moneda: ${quote.currency}`, pageWidth - margin - 10, yPos, { align: "right" })

    // ========== TABLA DE ITEMS MODERNA SIN LÍNEAS ==========
    yPos += 20
    
    // Contenedor de la tabla con bordes redondeados
    const tableStartY = yPos
    const rowHeight = 18
    const headerHeight = 25
    const tableWidth = pageWidth - (margin * 2)
    const tableData = quote.QuoteItem.map(item => ({
      description: item.description,
      qty: item.qty,
      price: item.price,
      total: item.qty * item.price
    }))
    
    const tableHeight = headerHeight + (tableData.length * rowHeight) + 10
    
    // Fondo de la tabla con bordes redondeados
    doc.setFillColor(...cardBg)
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(2)
    doc.roundedRect(margin, tableStartY - 5, tableWidth, tableHeight, 12, 12, 'FD')
    
    // Header de la tabla con fondo de color
    doc.setFillColor(...tableHeaderBg)
    doc.roundedRect(margin + 2, tableStartY - 3, tableWidth - 4, headerHeight, 10, 10, 'F')
    
    // Texto del header
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("DESCRIPCIÓN", margin + 10, tableStartY + 8)
    doc.text("CANT.", margin + 100, tableStartY + 8, { align: "center" })
    doc.text("PRECIO UNIT.", margin + 130, tableStartY + 8, { align: "right" })
    doc.text("TOTAL", margin + tableWidth - 10, tableStartY + 8, { align: "right" })
    
    // Filas de la tabla sin líneas, solo con fondos alternados
    tableData.forEach((item, index) => {
      const rowY = tableStartY + headerHeight + (index * rowHeight)
      const isEven = index % 2 === 0
      
      // Fondo alternado con bordes redondeados en las esquinas
      if (!isEven) {
        doc.setFillColor(...tableRowBg)
        doc.roundedRect(margin + 2, rowY - 2, tableWidth - 4, rowHeight, 8, 8, 'F')
      }
      
      // Texto de las filas
      doc.setFontSize(10)
      doc.setTextColor(...textColor)
      doc.setFont("helvetica", "normal")
      doc.text(item.description, margin + 10, rowY + 8)
      
      doc.text(item.qty.toString(), margin + 100, rowY + 8, { align: "center" })
      
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: quote.currency as "EUR" | "USD"
        }).format(item.price),
        margin + 130,
        rowY + 8,
        { align: "right" }
      )
      
      doc.setFont("helvetica", "bold")
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: quote.currency as "EUR" | "USD"
        }).format(item.total),
        margin + tableWidth - 10,
        rowY + 8,
        { align: "right" }
      )
    })
    
    // Actualizar yPos para la siguiente sección
    yPos = tableStartY + tableHeight

    // ========== TOTALES MODERNOS CON TARJETA ==========
    const finalY = yPos + 15
    
    const totalsX = pageWidth - margin
    const totalsStartX = totalsX - 100
    const totalsCardWidth = 110
    
    // Calcular altura de la tarjeta de totales
    let totalsHeight = 35
    if (quote.tax && quote.tax > 0) totalsHeight += 8
    
    // Tarjeta de totales con bordes redondeados y fondo destacado
    doc.setFillColor(...successColor)
    doc.setDrawColor(...successColor)
    doc.setLineWidth(2)
    doc.roundedRect(totalsStartX - 10, finalY - 8, totalsCardWidth, totalsHeight, 15, 15, 'FD')
    
    // Fondo blanco interno
    doc.setFillColor(...cardBg)
    doc.roundedRect(totalsStartX - 8, finalY - 6, totalsCardWidth - 4, totalsHeight - 4, 12, 12, 'F')
    
    // Subtotal
    doc.setFontSize(10)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsStartX, finalY, { align: "right" })
    doc.setTextColor(...textColor)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.subtotal),
      totalsX - 2,
      finalY,
      { align: "right" }
    )
    
    // Impuestos si aplica
    if (quote.tax && quote.tax > 0) {
      const taxAmount = quote.subtotal * (quote.tax / 100)
      doc.setTextColor(...grayText)
      doc.text(`Impuestos (${quote.tax}%):`, totalsStartX, finalY + 7, { align: "right" })
      doc.setTextColor(...textColor)
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: quote.currency as "EUR" | "USD"
        }).format(taxAmount),
        totalsX - 2,
        finalY + 7,
        { align: "right" }
      )
    }
    
    // Línea decorativa
    doc.setDrawColor(...successColor)
    doc.setLineWidth(1.5)
    const separatorY = quote.tax && quote.tax > 0 ? finalY + 13 : finalY + 9
    doc.roundedRect(totalsStartX - 8, separatorY, totalsCardWidth - 4, 0.5, 0.5, 0.5, 'F')
    
    // Total destacado con fondo de color
    const totalY = quote.tax && quote.tax > 0 ? finalY + 20 : finalY + 16
    doc.setFillColor(...successColor)
    doc.roundedRect(totalsStartX - 8, totalY - 4, totalsCardWidth - 4, 12, 8, 8, 'F')
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text("TOTAL:", totalsStartX, totalY + 2, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.total),
      totalsX - 2,
      totalY + 2,
      { align: "right" }
    )

    // ========== NOTAS Y CONDICIONES (TARJETA MODERNA) ==========
    let notesY = totalY + 20
    if (quote.notes) {
      const notesLines = quote.notes.split('\n').filter(line => line.trim())
      const notesHeight = 20 + (notesLines.length * 6)
      
      // Tarjeta de notas con bordes redondeados
      doc.setFillColor(...lightGray)
      doc.setDrawColor(...accentColor)
      doc.setLineWidth(1.5)
      doc.roundedRect(margin, notesY - 8, pageWidth - (margin * 2), notesHeight, 12, 12, 'FD')
      
      doc.setFontSize(12)
      doc.setTextColor(...accentColor)
      doc.setFont("helvetica", "bold")
      doc.text("📝 Notas y Condiciones", margin + 10, notesY)
      
      notesY += 12
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...textColor)
      
      // Dividir notas por líneas y agregar bullet points
      notesLines.forEach((line, index) => {
        const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '')
        // Manejar texto largo con word wrap
        const splitText = doc.splitTextToSize(`• ${cleanLine}`, pageWidth - (margin * 2) - 20)
        splitText.forEach((textLine: string, lineIndex: number) => {
          doc.text(textLine, margin + 15, notesY + (index * 6) + (lineIndex * 6))
        })
      })
    }

    // ========== FOOTER MODERNO CON BORDES REDONDEADOS ==========
    const footerY = pageHeight - 30
    
    // Tarjeta de footer con bordes redondeados
    doc.setFillColor(...lightGray)
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1)
    doc.roundedRect(margin, footerY - 5, pageWidth - (margin * 2), 25, 12, 12, 'FD')
    
    doc.setFontSize(9)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    
    // Texto del footer centrado
    const footerText1 = `${companyName} - Transformando ideas en soluciones digitales`
    doc.text(footerText1, pageWidth / 2, footerY + 8, { align: "center" })
    
    doc.setFontSize(8)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text("Gracias por confiar en nosotros", pageWidth / 2, footerY + 15, { align: "center" })
    
    // Número de página
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...grayText)
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: "center" })
    }

    // Generar respuesta
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotizacion-${quote.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    )
  }
}
