import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser?.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const search = req.nextUrl.searchParams
    const status = (search.get("status") || "pending").toLowerCase()

    const pending = await prisma.pendingQuote.findMany({
      where: {
        userId: authUser.userId,
        status: status === "all" ? undefined : status
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json({ data: pending })
  } catch (error) {
    console.error("Error obteniendo pending quotes:", error)
    return NextResponse.json(
      { error: "Error al obtener cotizaciones detectadas" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    if (!authUser?.userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const pending = await prisma.pendingQuote.findFirst({
      where: { id, userId: authUser.userId }
    })

    if (!pending) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updated = await prisma.pendingQuote.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("Error actualizando pending quote:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

