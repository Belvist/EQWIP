import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is university or admin
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get notifications for university - both APPLICATION_STATUS and any other relevant types
    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        OR: [
          { type: 'APPLICATION_STATUS' },
          { title: { contains: 'заявка', mode: 'insensitive' } },
          { title: { contains: 'стажер', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching university notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
