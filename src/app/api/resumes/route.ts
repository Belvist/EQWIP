import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id }
    })

    if (!candidate) {
      return NextResponse.json({ resumes: [] })
    }

    const resumes = await db.resume.findMany({
      where: { candidateId: candidate.id },
      select: { id: true, title: true, updatedAt: true, isDefault: true, data: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
    })

    return NextResponse.json({ resumes })
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 400 })
    }

    const body = await request.json()
    let { title, data, isDefault } = body || {}

    // Backward compatibility: if client sent raw resume object
    // (without { title, data }), treat whole body as data
    if (!data && body && typeof body === 'object' && (body.personal || body.experience || body.education)) {
      data = body
      title = title || body?.personal?.fullName || `Резюме ${new Date().toLocaleDateString('ru-RU')}`
    }

    if (!title || !data) {
      return NextResponse.json({ error: 'Title and data are required' }, { status: 400 })
    }

    if (isDefault) {
      await db.resume.updateMany({
        where: { candidateId: candidate.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const resume = await db.resume.create({
      data: {
        candidateId: candidate.id,
        title,
        data,
        isDefault: !!isDefault
      },
      select: { id: true, title: true, updatedAt: true, isDefault: true, data: true }
    })

    return NextResponse.json(resume)
  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

