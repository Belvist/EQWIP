import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RealtimeManager } from '@/lib/realtime'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const text = (body?.text as string) || 'Здравствуйте!'

    // Employer user
    const employerUserId = (session.user as any).id as string
    const employer = await db.employerProfile.findUnique({ where: { userId: employerUserId } })
    if (!employer) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 403 })
    }

    // Candidate user
    const candidate = await db.candidateProfile.findUnique({
      where: { id: params.id },
      include: { user: true }
    })
    if (!candidate?.user) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Create placeholder application thread if needed
    let application = await db.application.findFirst({
      where: { candidateId: candidate.id, job: { employerId: employer.id } },
      orderBy: { createdAt: 'desc' }
    })
    if (!application) {
      // create draft application under any employer job to open chat thread
      const job = await db.job.findFirst({ where: { employerId: employer.id }, orderBy: { createdAt: 'desc' } })
      if (!job) {
        return NextResponse.json({ error: 'No jobs to attach a chat' }, { status: 400 })
      }
      application = await db.application.create({
        data: { candidateId: candidate.id, jobId: job.id, status: 'PENDING', coverLetter: '' }
      })
    }

    // Persist message
    const message = await db.message.create({
      data: {
        senderId: employerUserId,
        receiverId: candidate.user.id,
        applicationId: application.id,
        content: text
      }
    })

    try {
      await RealtimeManager.getInstance().notifyNewMessage(message.id)
    } catch {}

    return NextResponse.json({ success: true, applicationId: application.id, messageId: message.id })
  } catch (error) {
    console.error('Send candidate message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


