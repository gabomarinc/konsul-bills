import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    )
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      email: user.email,
      name: user.name,
      companyId: user.companyId
    }
  })
}

