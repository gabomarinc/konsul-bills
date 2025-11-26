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
    const primaryColor: [number, number, number] = [59, 130, 246] // blue-500
    const textColor: [number, number, number] = [15, 23, 42] // slate-900
    const lightGray: [number, number, number] = [241, 245, 249] // slate-100

    // Header con logo
    let yPos = 20
    
    if (logoUrl) {
      try {
        // Extraer el tipo de imagen y los datos base64
        const base64Data = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl
        const imageType = logoUrl.startsWith('data:image/png') ? 'PNG' : 
                         logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG'
        
        // Agregar imagen al PDF
        doc.addImage(base64Data, imageType, 20, yPos, 40, 15)
        yPos = 40
      } catch (error) {
        console.error("Error loading logo:", error)
        // Continuar sin logo si hay error
      }
    }

    // Información de la empresa
    const companyName = quote.Company.name
    const companyAddress = settings 
      ? [settings.addressLine1, settings.addressLine2, settings.city, settings.state, settings.zip, settings.country]
          .filter(Boolean)
          .join(", ")
      : ""
    const companyTaxId = settings?.taxId || ""

    // Título
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.text("COTIZACIÓN", 20, yPos)
    
    yPos += 10
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    doc.text(`Número: ${quote.id}`, 20, yPos)
    
    yPos += 5
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Fecha: ${new Date(quote.issueDate).toLocaleDateString("es-ES")}`, 20, yPos)
    if (quote.dueDate) {
      yPos += 5
      doc.text(`Vencimiento: ${new Date(quote.dueDate).toLocaleDateString("es-ES")}`, 20, yPos)
    }

    yPos += 15

    // Información de la empresa (lado izquierdo)
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text("De:", 20, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 5
    doc.text(companyName, 20, yPos)
    if (companyAddress) {
      yPos += 5
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(companyAddress, 20, yPos)
    }
    if (companyTaxId) {
      yPos += 5
      doc.text(`ID Fiscal: ${companyTaxId}`, 20, yPos)
    }

    // Información del cliente (lado derecho)
    const clientX = 120
    let clientY = yPos - 20
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text("Para:", clientX, clientY)
    doc.setFont("helvetica", "normal")
    clientY += 5
    doc.text(quote.Client.name, clientX, clientY)
    if (quote.Client.email) {
      clientY += 5
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(quote.Client.email, clientX, clientY)
    }
    if (quote.Client.phone) {
      clientY += 5
      doc.text(quote.Client.phone, clientX, clientY)
    }

    // Título de la cotización
    yPos = Math.max(yPos, clientY) + 15
    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "bold")
    doc.text(quote.title, 20, yPos)
    yPos += 10

    // Tabla de items
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
      head: [["Descripción", "Cantidad", "Precio", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" }
      },
      margin: { left: 20, right: 20 }
    })

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    
    const totalsX = 150
    doc.text("Subtotal:", totalsX - 60, finalY)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.subtotal),
      totalsX,
      finalY,
      { align: "right" }
    )
    
    doc.text(`Impuestos (${quote.tax}%):`, totalsX - 60, finalY + 5)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.taxAmount),
      totalsX,
      finalY + 5,
      { align: "right" }
    )
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Total:", totalsX - 60, finalY + 12)
    doc.text(
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: quote.currency as "EUR" | "USD"
      }).format(quote.total),
      totalsX,
      finalY + 12,
      { align: "right" }
    )

    // Notas
    if (quote.notes) {
      const notesY = finalY + 25
      doc.setFontSize(10)
      doc.setTextColor(...textColor)
      doc.setFont("helvetica", "bold")
      doc.text("Notas:", 20, notesY)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      const splitNotes = doc.splitTextToSize(quote.notes, 170)
      doc.text(splitNotes, 20, notesY + 5)
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-ES")} - ${companyName}`,
      20,
      pageHeight - 10,
      { align: "left" }
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

