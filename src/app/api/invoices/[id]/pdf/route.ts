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
    
    // Configuración de colores exactos del ejemplo
    const darkBlue: [number, number, number] = [30, 58, 138] // azul oscuro para encabezados de tabla
    const lightGray: [number, number, number] = [156, 163, 175] // gris claro para "FACTURA"
    const darkGray: [number, number, number] = [31, 41, 55] // gris oscuro para número
    const green: [number, number, number] = [34, 197, 94] // verde para total
    const textColor: [number, number, number] = [17, 24, 39] // casi negro para texto principal
    const grayText: [number, number, number] = [107, 114, 128] // gris para texto secundario
    const red: [number, number, number] = [220, 38, 38] // rojo para pendiente

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

    // "FACTURA" en gris claro a la derecha
    const pageWidth = doc.internal.pageSize.width
    doc.setFontSize(16)
    doc.setTextColor(...lightGray)
    doc.setFont("helvetica", "normal")
    doc.text("FACTURA", pageWidth - 20, yPos + 5, { align: "right" })
    
    // Número de factura en gris oscuro más grande
    doc.setFontSize(18)
    doc.setTextColor(...darkGray)
    doc.setFont("helvetica", "bold")
    doc.text(invoice.id, pageWidth - 20, yPos + 12, { align: "right" })

    // ========== INFORMACIÓN DE LA EMPRESA ==========
    yPos = 50
    const companyName = invoice.Company.name
    
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(companyName, 20, yPos)
    
    yPos += 7
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
    doc.text(invoice.Client.name, pageWidth - 20, clientY, { align: "right" })
    
    if (invoice.Client.email) {
      clientY += 6
      doc.setFontSize(10)
      doc.setTextColor(...grayText)
      doc.text(invoice.Client.email, pageWidth - 20, clientY, { align: "right" })
    }
    if (invoice.Client.phone) {
      clientY += 5
      doc.text(invoice.Client.phone, pageWidth - 20, clientY, { align: "right" })
    }

    // ========== FECHAS ==========
    yPos = Math.max(yPos, clientY) + 20
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    
    // FECHA DE EMISIÓN
    doc.text("FECHA DE EMISIÓN:", 20, yPos)
    const issueDate = new Date(invoice.issueDate).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    doc.text(issueDate, 20 + 50, yPos)
    
    // VENCIMIENTO
    if (invoice.dueDate) {
      yPos += 6
      doc.text("VENCIMIENTO:", 20, yPos)
      const dueDate = new Date(invoice.dueDate).toLocaleDateString("es-ES", { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(dueDate, 20 + 50, yPos)
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
    
    // Total en verde
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...green)
    const totalY = invoice.tax > 0 ? finalY + 14 : finalY + 8
    doc.text("TOTAL:", totalsX - 60, totalY, { align: "right" })
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency as "EUR" | "USD"
      }).format(invoice.total) + ` ${invoice.currency}`,
      totalsX,
      totalY,
      { align: "right" }
    )
    
    // Balance pendiente si aplica
    if (invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...red)
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
      doc.text("Notas y Condiciones:", 20, notesY)
      
      notesY += 7
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayText)
      
      // Dividir notas por líneas y agregar bullet points
      const notesLines = invoice.notes.split('\n').filter(line => line.trim())
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
