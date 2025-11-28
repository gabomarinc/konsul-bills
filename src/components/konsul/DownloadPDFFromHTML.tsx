"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { toast } from "sonner"

interface DownloadPDFFromHTMLProps {
  documentId: string
  type: "quote" | "invoice"
  containerId?: string
}

export default function DownloadPDFFromHTML({ 
  documentId, 
  type,
  containerId = "pdf-content"
}: DownloadPDFFromHTMLProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true)
      toast.loading("Generando PDF...")

      // Obtener el elemento a capturar
      const element = document.getElementById(containerId)
      if (!element) {
        throw new Error("No se encontró el contenido para exportar")
      }

      // Configurar opciones de html2canvas con escala más baja para tamaño adecuado
      const canvas = await html2canvas(element, {
        scale: 1.5, // Balance entre calidad y tamaño
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      })

      // Dimensiones del PDF A4 en mm
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      
      // Obtener dimensiones reales del elemento (sin el scale del canvas)
      const elementWidthPx = element.offsetWidth
      const elementHeightPx = element.scrollHeight
      
      // Convertir píxeles a mm para jsPDF (jsPDF usa 72 DPI = 0.352778 mm/px)
      // Pero html2canvas a scale 1.5 genera más píxeles, así que ajustamos
      const scale = 1.5
      const pxToMm = 0.352778 / scale // Ajustar por el scale usado
      
      // Dimensiones del contenido en mm
      const contentWidthMm = elementWidthPx * pxToMm
      const contentHeightMm = elementHeightPx * pxToMm
      
      // Calcular escala para que quepa en A4 con márgenes
      const margin = 15 // mm de margen en cada lado
      const availableWidth = pdfWidth - (margin * 2)
      const availableHeight = pdfHeight - (margin * 2)
      
      const widthRatio = availableWidth / contentWidthMm
      const heightRatio = availableHeight / contentHeightMm
      const ratio = Math.min(widthRatio, heightRatio)
      
      const scaledWidth = contentWidthMm * ratio
      const scaledHeight = contentHeightMm * ratio
      
      // Crear PDF en formato A4
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })

      // Agregar imagen al PDF
      const imgData = canvas.toDataURL("image/png", 1.0)
      const xOffset = (pdfWidth - scaledWidth) / 2
      pdf.addImage(imgData, "PNG", xOffset, margin, scaledWidth, scaledHeight)
      
      // Si el contenido es más alto que una página, agregar páginas adicionales
      let currentY = margin
      let remainingHeight = scaledHeight
      
      while (remainingHeight > availableHeight) {
        // Agregar nueva página
        pdf.addPage()
        currentY = margin - (scaledHeight - remainingHeight)
        remainingHeight -= availableHeight
        
        // Agregar la parte restante de la imagen
        pdf.addImage(imgData, "PNG", xOffset, currentY, scaledWidth, scaledHeight)
      }

      // Descargar PDF
      const fileName = `${type === "quote" ? "cotizacion" : "factura"}-${documentId}.pdf`
      pdf.save(fileName)

      toast.dismiss()
      toast.success(`PDF de ${type === "quote" ? "cotización" : "factura"} descargado`)
    } catch (error) {
      console.error("Error generando PDF:", error)
      toast.dismiss()
      toast.error("Error al generar el PDF")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      onClick={handleDownloadPDF} 
      disabled={isGenerating}
      className="fixed bottom-8 right-8 z-50 shadow-lg rounded-full h-14 w-14 p-0"
      size="lg"
    >
      <Download className="h-6 w-6" />
      <span className="sr-only">Descargar PDF</span>
    </Button>
  )
}

