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
    
    // Configuración de colores limpios y profesionales
    const primaryColor: [number, number, number] = [30, 58, 138] // azul oscuro profesional
    const accentColor: [number, number, number] = [59, 130, 246] // azul claro
    const successColor: [number, number, number] = [34, 197, 94] // verde para total
    const dangerColor: [number, number, number] = [220, 38, 38] // rojo para pendiente
    const textColor: [number, number, number] = [17, 24, 39] // texto principal
    const grayText: [number, number, number] = [107, 114, 128] // texto secundario
    const lightGray: [number, number, number] = [243, 244, 246] // fondo gris claro
    const lightGreen: [number, number, number] = [220, 252, 231] // fondo verde claro para total
    const cardBg: [number, number, number] = [255, 255, 255] // fondo blanco
    const tableHeaderBg: [number, number, number] = [30, 58, 138] // fondo header tabla azul oscuro
    const tableRowBg: [number, number, number] = [249, 250, 251] // fondo filas alternas

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20

    // ========== HEADER LIMPIO ==========
    let yPos = 20
    
    // Logo a la izquierda
    if (logoUrl) {
      try {
        const base64Data = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl
        const imageType = logoUrl.startsWith('data:image/png') ? 'PNG' : 
                         logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        doc.addImage(base64Data, imageType, margin, yPos, 50, 25)
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    // Título "FACTURA" y número en el lado derecho
    const headerRightX = pageWidth - margin
    
    doc.setFontSize(20)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text("FACTURA", headerRightX, yPos + 5, { align: "right" })
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.id, headerRightX, yPos + 12, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA ==========
    yPos = 55
    const companyName = invoice.Company.name
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, margin, yPos)
    
    // Tagline o descripción de la empresa (si existe)
    yPos += 7
    doc.setFontSize(10)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    doc.text("Soluciones Digitales Profesionales", margin, yPos)
    
    yPos += 6
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
      doc.text(info, margin, yPos + (index * 5))
    })
    
    const companyInfoHeight = companyInfo.length * 5 + 15

    // ========== INFORMACIÓN DEL CLIENTE ==========
    const clientStartY = 55
    let clientY = clientStartY
    
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE", pageWidth - margin, clientY, { align: "right" })
    
    clientY += 7
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.Client.name, pageWidth - margin, clientY, { align: "right" })
    
    clientY += 6
    doc.setFontSize(10)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    const clientInfo: string[] = []
    if (invoice.Client.email) clientInfo.push(invoice.Client.email)
    if (invoice.Client.phone) clientInfo.push(`Tel: ${invoice.Client.phone}`)
    
    // Construir dirección del cliente
    const clientAddress = [
      invoice.Client.billingLine1,
      invoice.Client.billingLine2,
      invoice.Client.billingCity,
      invoice.Client.billingState,
      invoice.Client.billingZip,
      invoice.Client.billingCountry
    ].filter(Boolean).join(", ")
    if (clientAddress) clientInfo.push(clientAddress)
    
    clientInfo.forEach((info, index) => {
      doc.text(info, pageWidth - margin, clientY + (index * 5), { align: "right" })
    })

    // ========== FECHAS ==========
    yPos = Math.max(yPos + companyInfoHeight, clientStartY + clientInfo.length * 5 + 10) + 15
    
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    
    const issueDate = new Date(invoice.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text("FECHA DE EMISIÓN:", margin, yPos)
    doc.text(issueDate, margin + 50, yPos)
    
    if (invoice.dueDate) {
      yPos += 6
      const dueDate = new Date(invoice.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text("VENCIMIENTO:", margin, yPos)
      doc.text(dueDate, margin + 50, yPos)
    }

    // ========== TABLA DE ITEMS ==========
    yPos += 15
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
      theme: "plain",
      headStyles: {
        fillColor: tableHeaderBg,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 100, halign: "left" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" }
      },
      margin: { left: margin, right: margin },
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      }
    })

    // ========== TOTALES ==========
    const finalY = (doc as any).lastAutoTable.finalY + 15
    
    // Subtotal
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    const totalsX = pageWidth - margin
    doc.text("Subtotal:", totalsX - 60, finalY, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(invoice.subtotal) + ` ${invoice.currency}`,
      totalsX,
      finalY,
      { align: "right" }
    )
    
    // Impuestos si aplica
    if (invoice.tax > 0) {
      doc.text(`Impuestos (${invoice.tax}%):`, totalsX - 60, finalY + 6, { align: "right" })
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: invoice.currency as "EUR" | "USD"
        }).format(invoice.taxAmount) + ` ${invoice.currency}`,
        totalsX,
        finalY + 6,
        { align: "right" }
      )
    }
    
    // Total en caja verde clara
    const totalY = invoice.tax > 0 ? finalY + 14 : finalY + 8
    doc.setFillColor(...lightGreen)
    doc.roundedRect(totalsX - 80, totalY - 5, 75, 12, 4, 4, 'F')
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...successColor)
    doc.text("TOTAL:", totalsX - 60, totalY + 2, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(invoice.total) + ` ${invoice.currency}`,
      totalsX,
      totalY + 2,
      { align: "right" }
    )
    
    // Balance pendiente si aplica
    if (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...dangerColor)
      doc.text("PENDIENTE:", totalsX - 60, totalY + 8, { align: "right" })
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: invoice.currency as "EUR" | "USD"
        }).format(invoice.balanceDue) + ` ${invoice.currency}`,
        totalsX,
        totalY + 8,
        { align: "right" }
      )
    }

    // ========== NOTAS Y CONDICIONES ==========
    let notesY = totalY + (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total ? 20 : 15)
    if (invoice.notes) {
      doc.setFontSize(11)
      doc.setTextColor(...textColor)
      doc.setFont("helvetica", "bold")
      doc.text("Notas y Condiciones:", margin, notesY)
      
      notesY += 7
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayText)
      
      // Dividir notas por líneas y agregar bullet points
      const notesLines = invoice.notes.split('\n').filter(line => line.trim())
      notesLines.forEach((line, index) => {
        const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '')
        doc.text(`• ${cleanLine}`, margin, notesY + (index * 5))
      })
    }

    // ========== FOOTER ==========
    const footerY = pageHeight - 15
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    // Texto del footer centrado
    const footerText1 = `${companyName} - Transformando ideas en soluciones digitales`
    doc.text(footerText1, pageWidth / 2, footerY, { align: "center" })
    
    doc.text("Gracias por confiar en nosotros", pageWidth / 2, footerY + 5, { align: "center" })

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
