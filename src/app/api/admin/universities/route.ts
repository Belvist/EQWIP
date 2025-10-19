import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await db.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } })
    const role = String(me?.role || '')
    if (role !== 'ADMIN' && role !== 'MODERATOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const univs = await db.university.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    })

    const items = await Promise.all(univs.map(async (u) => {
      const internships = await db.internshipPosting.count({ where: { universityId: u.id } })
      const students = 0 // placeholder (no student model yet)
      const activityScore = Math.min(100, Math.round((internships / Math.max(1, internships + 1)) * 100))
      return { id: u.id, name: u.name, internships, students, activityScore }
    }))

    const totalInternships = await db.internshipPosting.count()
    const totalStudents = 0

    return NextResponse.json({ items, total: items.length, totalInternships, totalStudents })
  } catch (e) {
    console.error('GET /api/admin/universities error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


