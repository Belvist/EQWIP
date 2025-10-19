import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Allow only users who want to register as UNIVERSITY
    // In signup flow user.role should be UNIVERSITY; fallback: allow ADMIN
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN') return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const body = await request.json()
    const created = await db.university.create({ data: { name: String(body.name || ''), website: body.website || null, contactEmail: body.contactEmail || null, userId: user.id } })
    return NextResponse.json({ data: created })
  } catch (error) {
    console.error('Error creating university:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


