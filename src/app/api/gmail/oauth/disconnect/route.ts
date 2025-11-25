import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    
    if (!authUser?.userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Desactivar integración
    await prisma.gmailIntegration.updateMany({
      where: { userId: authUser.userId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: "Gmail desconectado exitosamente"
    })
  } catch (error) {
    console.error("Error desconectando Gmail:", error)
    return NextResponse.json(
      { error: "Error al desconectar Gmail" },
      { status: 500 }
    )
  }
}

