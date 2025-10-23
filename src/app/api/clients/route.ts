import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserCompanyFromRequest } from "@/lib/api-auth"

/**
 * GET /api/clients
 * Obtiene todos los clientes de la compañía
 */
export async function GET(req: NextRequest) {
  try {
    const company = await getUserCompanyFromRequest(req)
    if (!company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({ data: clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}





