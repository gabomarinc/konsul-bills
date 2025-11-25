import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    
    if (!authUser?.userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Buscar integración de Gmail
    const integration = await prisma.gmailIntegration.findUnique({
      where: { userId: authUser.userId },
      include: {
        _count: {
          select: {
            PendingQuote: {
              where: {
                status: "pending"
              }
            }
          }
        }
      }
    })

    if (!integration || !integration.isActive) {
      return NextResponse.json({
        connected: false
      })
    }

    return NextResponse.json({
      connected: true,
      email: integration.email,
      lastSyncAt: integration.lastSyncAt?.toISOString(),
      pendingQuotes: integration._count.PendingQuote
    })
  } catch (error) {
    console.error("Error obteniendo estado de Gmail:", error)
    return NextResponse.json(
      { error: "Error al obtener estado de Gmail" },
      { status: 500 }
    )
  }
}

