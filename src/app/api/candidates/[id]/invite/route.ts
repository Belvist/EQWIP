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

    const employer = await db.employerProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: { jobs: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } }
    })
    if (!employer) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const jobId = body?.jobId || employer.jobs[0]?.id
    if (!jobId) {
      return NextResponse.json({ error: 'No active jobs to invite to' }, { status: 400 })
    }

    const candidate = await db.candidateProfile.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, name: true } } }
    })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Ensure job belongs to employer
    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job || job.employerId !== employer.id) {
      return NextResponse.json({ error: 'Job not found or not owned by employer' }, { status: 403 })
    }

    // Create application if not exists
    let application = await db.application.findUnique({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
    })
    if (!application) {
      application = await db.application.create({
        data: {
          candidateId: candidate.id,
          jobId,
          coverLetter: 'Приглашение от работодателя',
          status: 'REVIEWED'
        }
      })
    }

    // Create notification
    const note = await db.notification.create({
      data: {
        userId: candidate.user.id,
        type: 'INTERVIEW_INVITE',
        title: 'Приглашение на вакансию',
        message: `Вас пригласили на вакансию: ${job.title}`,
        isRead: false,
      }
    })

    // Realtime notify
    try {
      await RealtimeManager.getInstance().sendNotificationToUser({
        userId: candidate.user.id,
        type: 'INTERVIEW_INVITE' as any,
        title: 'Приглашение на вакансию',
        message: `Вас пригласили на вакансию: ${job.title}`,
        data: { applicationId: application.id, jobId: job.id }
      })
    } catch {}

    return NextResponse.json({ success: true, applicationId: application.id, notificationId: note.id })
  } catch (error) {
    console.error('Invite candidate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


