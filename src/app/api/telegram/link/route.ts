import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/api-auth'
import { linkTelegramUser } from '@/lib/telegram'

/**
 * POST /api/telegram/link
 * Vincula un usuario de Telegram con un usuario del sistema
 * Requiere: token de vinculación en el body
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { telegramId, username, firstName, lastName } = body

    if (!telegramId) {
      return NextResponse.json(
        { error: 'telegramId es requerido' },
        { status: 400 }
      )
    }

    // Vincular usuario de Telegram
    const telegramUser = await linkTelegramUser(
      String(telegramId),
      user.userId,
      username,
      firstName,
      lastName
    )

    return NextResponse.json({
      success: true,
      telegramUser: {
        id: telegramUser.id,
        telegramId: telegramUser.telegramId,
        username: telegramUser.username
      }
    })
  } catch (error) {
    console.error('Error vinculando usuario de Telegram:', error)
    return NextResponse.json(
      { error: 'Error al vincular usuario de Telegram' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/telegram/link
 * Obtiene el estado de vinculación del usuario actual
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { getTelegramUser } = await import('@/lib/telegram')
    const { prisma } = await import('@/lib/prisma')
    
    const telegramUser = await prisma.telegramUser.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    })

    return NextResponse.json({
      linked: !!telegramUser,
      telegramUser: telegramUser || null
    })
  } catch (error) {
    console.error('Error obteniendo estado de vinculación:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado de vinculación' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/telegram/link
 * Desvincula el usuario de Telegram del usuario actual
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(req)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    
    await prisma.telegramUser.deleteMany({
      where: { userId: user.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error desvinculando usuario de Telegram:', error)
    return NextResponse.json(
      { error: 'Error al desvincular usuario de Telegram' },
      { status: 500 }
    )
  }
}

