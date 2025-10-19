import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resume = await db.resume.findFirst({
      where: { id: params.id, candidate: { userId: (session.user as any).id } },
      include: { candidate: { select: { id: true } } }
    })
    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(resume)
  } catch (e) {
    console.error('GET /api/resumes/[id] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const { isDefault, title, data } = body || {}

    const candidate = await db.candidateProfile.findUnique({ where: { userId: (session.user as any).id } })
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 400 })

    // Ensure the resume belongs to this user
    const existing = await db.resume.findFirst({ where: { id: params.id, candidate: { userId: (session.user as any).id } } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isDefault === true) {
      await db.resume.updateMany({ where: { candidateId: candidate.id, isDefault: true }, data: { isDefault: false } })
    }

    const updated = await db.resume.update({
      where: { id: params.id },
      data: {
        ...(typeof title === 'string' ? { title } : {}),
        ...(isDefault === true ? { isDefault: true } : {}),
        ...(data && typeof data === 'object' ? { data } : {}),
      },
      select: { id: true, title: true, updatedAt: true, isDefault: true, data: true },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/resumes/[id] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resume = await db.resume.findFirst({ where: { id: params.id, candidate: { userId: (session.user as any).id } } })
    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.resume.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/resumes/[id] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


