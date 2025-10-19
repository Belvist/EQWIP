import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const internship = await db.internshipPosting.findUnique({
      where: { id: params.id },
      include: {
        university: {
          include: {
            user: true
          }
        },
        applications: {
          include: {
            employer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!internship) {
      return NextResponse.json({ error: 'Стажировка не найдена' }, { status: 404 })
    }

    return NextResponse.json({ internship })
  } catch (error) {
    console.error('Error fetching internship:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const body = await request.json()
    const { isActive, ...updateData } = body

    // Check if user owns this internship or is admin
    const internship = await db.internshipPosting.findUnique({
      where: { id: params.id },
      include: { university: true }
    })

    if (!internship) {
      return NextResponse.json({ error: 'Стажировка не найдена' }, { status: 404 })
    }

    // Check if user has university profile or is admin
    const university = await db.university.findFirst({ where: { userId: user.id } })
    if (!university && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет прав для редактирования' }, { status: 403 })
    }

    if (user.role !== 'ADMIN' && university?.id !== internship.universityId) {
      return NextResponse.json({ error: 'Нет прав для редактирования' }, { status: 403 })
    }

    const updatedInternship = await db.internshipPosting.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ internship: updatedInternship })
  } catch (error) {
    console.error('Error updating internship:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Check if user owns this internship or is admin
    const internship = await db.internshipPosting.findUnique({
      where: { id: params.id },
      include: { university: true }
    })

    if (!internship) {
      return NextResponse.json({ error: 'Стажировка не найдена' }, { status: 404 })
    }

    // Check if user has university profile or is admin
    const university = await db.university.findFirst({ where: { userId: user.id } })
    if (!university && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет прав для удаления' }, { status: 403 })
    }

    if (user.role !== 'ADMIN' && university?.id !== internship.universityId) {
      return NextResponse.json({ error: 'Нет прав для удаления' }, { status: 403 })
    }

    await db.internshipPosting.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting internship:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
