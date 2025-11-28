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
    
    // Obtener la factura con todos los datos necesarios
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: id,
        companyId: company.id
      },
      include: { 
        Client: true, 
        InvoiceItem: true,
        Company: {
          include: {
            CompanySettings: true
          }
        }
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const settings = invoice.Company.CompanySettings
    const logoUrl = settings?.logoUrl

    // Crear PDF
    const doc = new jsPDF()
    
    // Configuración de colores modernos
    const primaryColor: [number, number, number] = [30, 58, 138] // azul primario
    const accentColor: [number, number, number] = [59, 130, 246] // azul claro
    const successColor: [number, number, number] = [34, 197, 94] // verde para total
    const dangerColor: [number, number, number] = [220, 38, 38] // rojo para pendiente
    const textColor: [number, number, number] = [17, 24, 39] // texto principal
    const grayText: [number, number, number] = [107, 114, 128] // texto secundario
    const lightGray: [number, number, number] = [243, 244, 246] // fondo gris claro
    const borderColor: [number, number, number] = [229, 231, 235] // bordes

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    // ========== HEADER MODERNO CON FONDO ==========
    // Fondo del header
    doc.setFillColor(...lightGray)
    doc.rect(0, 0, pageWidth, 50, 'F')
    
    // Borde inferior del header
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    doc.line(0, 50, pageWidth, 50)
    
    let yPos = 15
    
    // Logo mejorado (más grande y centrado verticalmente)
    if (logoUrl) {
      try {
        const base64Data = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl
        const imageType = logoUrl.startsWith('data:image/png') ? 'PNG' : 
                         logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        // Logo más grande: 60x30, centrado verticalmente en el header
        doc.addImage(base64Data, imageType, margin, yPos, 60, 30)
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    // Título "FACTURA" y número en el lado derecho
    const headerRightX = pageWidth - margin
    
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("FACTURA", headerRightX, yPos + 8, { align: "right" })
    
    doc.setFontSize(14)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text(`#${invoice.id}`, headerRightX, yPos + 18, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA Y CLIENTE (DISEÑO DE DOS COLUMNAS) ==========
    yPos = 65
    
    const companyName = invoice.Company.name
    const leftColumnX = margin
    const rightColumnX = pageWidth / 2 + 10
    
    // Columna izquierda: Información de la empresa
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("DE:", leftColumnX, yPos)
    
    yPos += 8
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, leftColumnX, yPos)
    
    yPos += 7
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
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
    
    companyInfo.forEach((info, index) => {
      doc.text(info, leftColumnX, yPos + (index * 5))
    })
    
    const companyInfoHeight = companyInfo.length * 5 + 5

    // Columna derecha: Información del cliente
    let clientY = 65
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("PARA:", rightColumnX, clientY)
    
    clientY += 8
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.Client.name, rightColumnX, clientY)
    
    clientY += 7
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    const clientInfo: string[] = []
    if (invoice.Client.email) clientInfo.push(invoice.Client.email)
    if (invoice.Client.phone) clientInfo.push(`Tel: ${invoice.Client.phone}`)
    if (invoice.Client.address) clientInfo.push(invoice.Client.address)
    
    clientInfo.forEach((info, index) => {
      doc.text(info, rightColumnX, clientY + (index * 5))
    })

    // ========== FECHAS Y DETALLES (EN UNA LÍNEA) ==========
    yPos = Math.max(65 + companyInfoHeight, 65 + clientInfo.length * 5) + 15
    
    // Fondo gris claro para la sección de fechas
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, yPos - 8, pageWidth - (margin * 2), 20, 3, 3, 'F')
    
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    const issueDate = new Date(invoice.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text(`Fecha de Emisión: ${issueDate}`, margin + 5, yPos)
    
    if (invoice.dueDate) {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Vencimiento: ${dueDate}`, margin + 5, yPos + 6)
    }
    
    doc.setFontSize(9)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(`Moneda: ${invoice.currency}`, pageWidth - margin - 5, yPos, { align: "right" })
    
    // Estado de la factura
    if (invoice.status) {
      const statusText = invoice.status.toUpperCase()
      const statusColor = invoice.status === 'paid' ? successColor : 
                         invoice.status === 'pending' ? dangerColor : grayText
      doc.setTextColor(...statusColor)
      doc.text(`Estado: ${statusText}`, pageWidth - margin - 5, yPos + 6, { align: "right" })
    }

    // ========== TABLA DE ITEMS MODERNA ==========
    yPos += 18
    const tableData = invoice.InvoiceItem.map(item => [
      item.description,
      item.qty.toString(),
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(item.price),
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(item.qty * item.price)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "TOTAL"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
        halign: "left"
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 10,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 100, halign: "left" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right", fontStyle: "bold" }
      },
      margin: { left: margin, right: margin },
      styles: {
        lineColor: borderColor,
        lineWidth: 0.5
      }
    })

    // ========== TOTALES MODERNOS ==========
    const finalY = (doc as any).lastAutoTable.finalY + 20
    
    const totalsX = pageWidth - margin
    const totalsStartX = totalsX - 80
    
    // Calcular altura de la sección de totales
    let totalsHeight = 30
    if (invoice.tax > 0) totalsHeight += 6
    if (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total) totalsHeight += 8
    
    // Fondo para la sección de totales
    doc.setFillColor(...lightGray)
    doc.roundedRect(totalsStartX - 10, finalY - 8, 90, totalsHeight, 3, 3, 'F')
    
    // Subtotal
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsStartX, finalY, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(invoice.subtotal),
      totalsX,
      finalY,
      { align: "right" }
    )
    
    // Impuestos si aplica
    if (invoice.tax > 0) {
      doc.text(`Impuestos (${invoice.tax}%):`, totalsStartX, finalY + 6, { align: "right" })
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: invoice.currency as "EUR" | "USD"
        }).format(invoice.taxAmount),
        totalsX,
        finalY + 6,
        { align: "right" }
      )
    }
    
    // Línea separadora
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    const separatorY = invoice.tax > 0 ? finalY + 12 : finalY + 6
    doc.line(totalsStartX - 10, separatorY, totalsX, separatorY)
    
    // Total destacado
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...successColor)
    const totalY = invoice.tax > 0 ? finalY + 20 : finalY + 14
    doc.text("TOTAL:", totalsStartX, totalY, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(invoice.total),
      totalsX,
      totalY,
      { align: "right" }
    )
    
    // Balance pendiente si aplica
    if (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(...dangerColor)
      doc.text("PENDIENTE:", totalsStartX, totalY + 8, { align: "right" })
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: invoice.currency as "EUR" | "USD"
        }).format(invoice.balanceDue),
        totalsX,
        totalY + 8,
        { align: "right" }
      )
    }

    // ========== NOTAS Y CONDICIONES ==========
    let notesY = totalY + (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total ? 20 : 15)
    if (invoice.notes) {
      doc.setFontSize(11)
      doc.setTextColor(...primaryColor)
      doc.setFont("helvetica", "bold")
      doc.text("Notas y Condiciones", margin, notesY)
      
      // Línea decorativa
      doc.setDrawColor(...accentColor)
      doc.setLineWidth(1)
      doc.line(margin, notesY + 2, margin + 50, notesY + 2)
      
      notesY += 10
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...textColor)
      
      // Dividir notas por líneas y agregar bullet points
      const notesLines = invoice.notes.split('\n').filter(line => line.trim())
      notesLines.forEach((line, index) => {
        const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '')
        // Manejar texto largo con word wrap
        const splitText = doc.splitTextToSize(`• ${cleanLine}`, pageWidth - (margin * 2) - 10)
        splitText.forEach((textLine: string, lineIndex: number) => {
          doc.text(textLine, margin + 5, notesY + (index * 5) + (lineIndex * 5))
        })
      })
    }

    // ========== FOOTER MODERNO ==========
    const footerY = pageHeight - 25
    
    // Línea superior del footer
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    
    doc.setFontSize(8)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    // Texto del footer centrado
    const footerText1 = `${companyName} - Transformando ideas en soluciones digitales`
    doc.text(footerText1, pageWidth / 2, footerY + 8, { align: "center" })
    
    doc.text("Gracias por confiar en nosotros", pageWidth / 2, footerY + 13, { align: "center" })
    
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
        "Content-Disposition": `attachment; filename="factura-${invoice.id}.pdf"`,
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
