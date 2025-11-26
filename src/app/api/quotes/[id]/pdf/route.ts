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
    
    // Configuración de colores exactos del ejemplo
    const darkBlue: [number, number, number] = [30, 58, 138] // azul oscuro para encabezados de tabla
    const lightGray: [number, number, number] = [156, 163, 175] // gris claro para "COTIZACIÓN"
    const darkGray: [number, number, number] = [31, 41, 55] // gris oscuro para número
    const green: [number, number, number] = [34, 197, 94] // verde para total
    const textColor: [number, number, number] = [17, 24, 39] // casi negro para texto principal
    const grayText: [number, number, number] = [107, 114, 128] // gris para texto secundario

    // ========== HEADER ==========
    let yPos = 20
    
    // Logo a la izquierda (si existe)
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

    // "COTIZACIÓN" en gris claro a la derecha
    const pageWidth = doc.internal.pageSize.width
    doc.setFontSize(16)
    doc.setTextColor(...lightGray)
    doc.setFont("helvetica", "normal")
    doc.text("COTIZACIÓN", pageWidth - 20, yPos + 5, { align: "right" })
    
    // Número de cotización en gris oscuro más grande
    doc.setFontSize(18)
    doc.setTextColor(...darkGray)
    doc.setFont("helvetica", "bold")
    doc.text(quote.id, pageWidth - 20, yPos + 12, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA ==========
    yPos = 50
    const companyName = quote.Company.name
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, 20, yPos)
    
    yPos += 7
    // Si hay descripción o tagline, se puede agregar aquí
    // Por ahora solo mostramos la información disponible
    
    yPos += 3
    doc.setFontSize(10)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    if (settings?.emailFrom) {
      doc.text(`Email: ${settings.emailFrom}`, 20, yPos)
      yPos += 5
    }
    if (settings?.phone) {
      doc.text(`Phone: ${settings.phone}`, 20, yPos)
      yPos += 5
    }
    if (settings?.website) {
      doc.text(`Website: ${settings.website}`, 20, yPos)
      yPos += 5
    }
    
    const companyAddress = settings 
      ? [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.zip, settings.country]
          .filter(Boolean)
          .join(", ")
      : ""
    if (companyAddress) {
      doc.text(`Address: ${companyAddress}`, 20, yPos)
      yPos += 5
    }
    if (settings?.taxId) {
      doc.text(`Tax ID: ${settings.taxId}`, 20, yPos)
    }

    // ========== INFORMACIÓN DEL CLIENTE ==========
    const clientStartY = 50
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
      doc.setFontSize(10)
      doc.setTextColor(...grayText)
      doc.text(quote.Client.email, pageWidth - 20, clientY, { align: "right" })
    }
    if (quote.Client.phone) {
      clientY += 5
      doc.text(quote.Client.phone, pageWidth - 20, clientY, { align: "right" })
    }

    // ========== FECHAS ==========
    yPos = Math.max(yPos, clientY) + 20
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    
    // FECHA DE EMISIÓN
    doc.text("FECHA DE EMISIÓN:", 20, yPos)
    const issueDate = new Date(quote.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text(issueDate, 20 + 50, yPos)
    
    // VÁLIDA HASTA
    if (quote.dueDate) {
      yPos += 6
      doc.text("VÁLIDA HASTA:", 20, yPos)
      const dueDate = new Date(quote.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(dueDate, 20 + 50, yPos)
    }

    // ========== TABLA DE ITEMS ==========
    yPos += 15
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
      margin: { left: 20, right: 20 },
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
    const totalsX = pageWidth - 20
    doc.text("Subtotal:", totalsX - 60, finalY, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.subtotal) + ` ${quote.currency}`,
      totalsX,
      finalY,
      { align: "right" }
    )
    
    // Total en verde
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...green)
    doc.text("TOTAL:", totalsX - 60, finalY + 8, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.total) + ` ${quote.currency}`,
      totalsX,
      finalY + 8,
      { align: "right" }
    )

    // ========== NOTAS Y CONDICIONES ==========
    let notesY = finalY + 20
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
        const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '')
        doc.text(`• ${cleanLine}`, 20, notesY + (index * 5))
      })
    }

    // ========== FOOTER ==========
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.setTextColor(...grayText)
    doc.setFont("helvetica", "normal")
    
    // Texto del footer centrado
    const footerText1 = `${companyName} - Transformando ideas en soluciones digitales`
    doc.text(footerText1, pageWidth / 2, pageHeight - 15, { align: "center" })
    
    doc.text("Gracias por confiar en nosotros", pageWidth / 2, pageHeight - 10, { align: "center" })

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
