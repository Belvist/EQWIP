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

    const employer = await db.employerProfile.findFirst({ where: { userId: user.id } })
    if (!employer && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      notifyOnUniversityPost: employer?.notifyOnUniversityPost || false
    })
  } catch (error) {
    console.error('Error fetching employer settings:', error)
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
    const { notifyOnUniversityPost } = body

    const employer = await db.employerProfile.findFirst({ where: { userId: user.id } })
    if (!employer && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    }

    if (employer) {
      await db.employerProfile.update({
        where: { id: employer.id },
        data: { notifyOnUniversityPost: Boolean(notifyOnUniversityPost) }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating employer settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
