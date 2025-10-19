import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    return NextResponse.json({ data: uni || null })
  } catch (e) {
    console.error('Error fetching university me:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const body = await request.json()
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    if (!uni) return NextResponse.json({ error: 'University not found' }, { status: 404 })
    const updated = await db.university.update({ where: { id: uni.id }, data: { name: body.name || uni.name, website: body.website || uni.website } })
    return NextResponse.json({ data: updated })
  } catch (e) {
    console.error('Error updating university me:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


