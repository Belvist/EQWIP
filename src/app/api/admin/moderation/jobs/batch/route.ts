import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only ADMIN
    const userId = (session.user as any).id
    const me = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!me || String(me.role) !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { jobIds, action, reason } = await request.json()
    
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'Invalid jobIds' }, { status: 400 })
    }

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    let result
    const timestamp = new Date()

    switch (action) {
      case 'approve':
        result = await db.job.updateMany({
          where: { id: { in: jobIds } },
          data: { 
            isActive: true,
            updatedAt: timestamp
          }
        })
        break

      case 'reject':
        result = await db.job.updateMany({
          where: { id: { in: jobIds } },
          data: { 
            isActive: false,
            updatedAt: timestamp
          }
        })
        break

      case 'delete':
        result = await db.job.deleteMany({
          where: { id: { in: jobIds } }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Логируем действие для аудита
    console.log(`Admin ${userId} performed ${action} on ${jobIds.length} jobs:`, {
      jobIds,
      reason,
      timestamp
    })

    return NextResponse.json({ 
      success: true, 
      affected: result.count,
      action,
      timestamp: timestamp.toISOString()
    })
  } catch (error) {
    console.error('Batch moderation action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
