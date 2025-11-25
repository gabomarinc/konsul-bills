import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser?.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { id } = await params
    const pending = await prisma.pendingQuote.findFirst({
      where: { id, userId: authUser.userId }
    })

    if (!pending) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.pendingQuote.update({
      where: { id },
      data: {
        status: "discarded",
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error descartando pending quote:", error)
    return NextResponse.json({ error: "No se pudo descartar" }, { status: 500 })
  }
}

