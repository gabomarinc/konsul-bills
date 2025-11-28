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

      // Configurar opciones de html2canvas para mejor calidad
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      })

      // Calcular dimensiones del PDF (A4)
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      
      // Calcular escala para que quepa en A4 manteniendo proporción
      const widthRatio = pdfWidth / imgWidth
      const heightRatio = pdfHeight / imgHeight
      const ratio = Math.min(widthRatio, heightRatio)
      
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio
      
      // Crear PDF en formato A4
      const pdf = new jsPDF({
        orientation: scaledHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4"
      })

      // Agregar imagen al PDF
      const imgData = canvas.toDataURL("image/png", 1.0)
      pdf.addImage(imgData, "PNG", 0, 0, scaledWidth, scaledHeight)
      
      // Si el contenido es más alto que una página, agregar páginas adicionales
      if (scaledHeight > pdfHeight) {
        let heightLeft = scaledHeight - pdfHeight
        let position = -pdfHeight
        
        while (heightLeft > 0) {
          position = position - pdfHeight
          pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, position, scaledWidth, scaledHeight)
          heightLeft -= pdfHeight
        }
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

