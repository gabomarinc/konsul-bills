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
    
    // Configuración de colores
    const darkBlue: [number, number, number] = [30, 58, 138] // azul oscuro para encabezados
    const green: [number, number, number] = [34, 197, 94] // verde para total
    const textColor: [number, number, number] = [15, 23, 42] // slate-900
    const lightGray: [number, number, number] = [241, 245, 249] // slate-100
    const grayText: [number, number, number] = [100, 116, 139] // slate-500

    // ========== HEADER ==========
    let yPos = 20
    
    // Logo a la izquierda
    if (logoUrl) {
      try {
        const base64Data = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl
        const imageType = logoUrl.startsWith('data:image/png') ? 'PNG' : 
                         logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        doc.addImage(base64Data, imageType, 20, yPos, 50, 20)
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    // Título "COTIZACIÓN" y número a la derecha
    doc.setFontSize(28)
    doc.setTextColor(...darkBlue)
    doc.setFont("helvetica", "bold")
    const pageWidth = doc.internal.pageSize.width
    doc.text("COTIZACIÓN", pageWidth - 20, yPos + 8, { align: "right" })
    
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    doc.text(quote.id, pageWidth - 20, yPos + 15, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA ==========
    yPos = 45
    const companyName = quote.Company.name
    const companyAddress = settings 
      ? [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.zip, settings.country]
          .filter(Boolean)
          .join(", ")
      : ""
    
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, 20, yPos)
    
    yPos += 7
    if (settings?.emailFrom) {
      doc.setFontSize(10)
      doc.setTextColor(...grayText)
      doc.setFont("helvetica", "normal")
      doc.text(`Email: ${settings.emailFrom}`, 20, yPos)
      yPos += 5
    }
    if (settings?.phone) {
      doc.text(`Teléfono: ${settings.phone}`, 20, yPos)
      yPos += 5
    }
    if (settings?.website) {
      doc.text(`Website: ${settings.website}`, 20, yPos)
      yPos += 5
    }
    if (companyAddress) {
      doc.text(`Dirección: ${companyAddress}`, 20, yPos)
      yPos += 5
    }
    if (settings?.taxId) {
      doc.text(`ID Fiscal: ${settings.taxId}`, 20, yPos)
    }

    // ========== INFORMACIÓN DEL CLIENTE ==========
    const clientStartY = 45
    let clientY = clientStartY
    
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE", pageWidth - 20, clientY, { align: "right" })
    
    clientY += 7
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(quote.Client.name, pageWidth - 20, clientY, { align: "right" })
    
    if (quote.Client.email) {
      clientY += 6
      doc.setFontSize(9)
      doc.setTextColor(...grayText)
      doc.text(quote.Client.email, pageWidth - 20, clientY, { align: "right" })
    }
    if (quote.Client.phone) {
      clientY += 5
      doc.text(quote.Client.phone, pageWidth - 20, clientY, { align: "right" })
    }

    // ========== FECHAS ==========
    yPos = Math.max(yPos, clientY) + 15
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text("FECHA DE EMISIÓN:", 20, yPos)
    doc.setFont("helvetica", "normal")
    doc.text(new Date(quote.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 75, yPos)
    
    if (quote.dueDate) {
      yPos += 6
      doc.setFont("helvetica", "bold")
      doc.text("VÁLIDA HASTA:", 20, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(new Date(quote.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), 75, yPos)
    }

    // ========== TABLA DE ITEMS ==========
    yPos += 12
    const tableData = quote.QuoteItem.map(item => [
      item.description,
      item.qty.toString(),
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(item.price),
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(item.qty * item.price)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "TOTAL"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        fillColor: darkBlue,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "left"
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 10,
        halign: "left"
      },
      columnStyles: {
        0: { cellWidth: 100, halign: "left" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" }
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      }
    })

    // ========== TOTALES ==========
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    // Caja de totales con fondo gris claro
    const totalsBoxX = 120
    const totalsBoxY = finalY - 5
    const totalsBoxWidth = 70
    const totalsBoxHeight = 30
    
    doc.setFillColor(...lightGray)
    doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsBoxHeight, 3, 3, 'F')
    
    // Subtotal
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    doc.text("Subtotal:", totalsBoxX + 5, totalsBoxY + 8)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.subtotal),
      totalsBoxX + totalsBoxWidth - 5,
      totalsBoxY + 8,
      { align: "right" }
    )
    
    // Impuestos
    if (quote.tax > 0) {
      doc.text(`Impuestos (${quote.tax}%):`, totalsBoxX + 5, totalsBoxY + 14)
      doc.text(
        new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: quote.currency as "EUR" | "USD"
        }).format(quote.taxAmount),
        totalsBoxX + totalsBoxWidth - 5,
        totalsBoxY + 14,
        { align: "right" }
      )
    }
    
    // Total destacado en verde
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...green)
    doc.text("TOTAL", totalsBoxX + 5, totalsBoxY + 22)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.total),
      totalsBoxX + totalsBoxWidth - 5,
      totalsBoxY + 22,
      { align: "right" }
    )

    // ========== NOTAS Y CONDICIONES ==========
    let notesY = totalsBoxY + totalsBoxHeight + 15
    if (quote.notes) {
      doc.setFontSize(11)
      doc.setTextColor(...textColor)
      doc.setFont("helvetica", "bold")
      doc.text("Notas y Condiciones:", 20, notesY)
      
      notesY += 7
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayText)
      
      // Dividir notas por líneas y agregar bullet points
      const notesLines = quote.notes.split('\n').filter(line => line.trim())
      notesLines.forEach((line, index) => {
        const bullet = line.trim().startsWith('•') || line.trim().startsWith('-') ? '' : '• '
        doc.text(`${bullet}${line.trim()}`, 20, notesY + (index * 5))
      })
      
      notesY += notesLines.length * 5 + 5
    }

    // ========== FOOTER ==========
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    // Línea separadora
    doc.setDrawColor(...lightGray)
    doc.setLineWidth(0.5)
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25)
    
    // Texto del footer centrado
    const footerText = `${companyName} - Gracias por confiar en nosotros`
    doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" })
    
    doc.setFontSize(7)
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-ES")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )

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
