import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const statusFilter = searchParams.get('status') || undefined

    // If checking for a specific job and current candidate already applied
    if (jobId) {
      const candidate = await db.candidateProfile.findUnique({
        where: { userId: (session.user as any).id }
      })
      // Get applications for specific job
      const applications = await db.application.findMany({
        where: {
          jobId: jobId,
          candidateId: candidate?.id || ''
        },
        include: {}
      })

      return NextResponse.json({ applications })
    }

    // No jobId: return applications depending on role
    const role = (session.user as any).role
    if (role === 'EMPLOYER') {
      const employer = await db.employerProfile.findUnique({
        where: { userId: (session.user as any).id }
      })
      if (!employer) {
        return NextResponse.json({ applications: [] })
      }

      const applications = await db.application.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter as any } : {}),
          job: { employerId: employer.id },
        },
        include: {
          job: true,
          candidate: {
            include: {
              user: { select: { name: true, email: true, avatar: true } },
              skills: { include: { skill: true } },
              workExperience: true,
              education: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ applications })
    }

    // Candidate: return own applications
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id }
    })
    const applications = await db.application.findMany({
      where: {
        candidateId: candidate?.id || ''
      },
      include: {
        job: {
          include: {
            employer: { select: { id: true, companyName: true, logo: true, userId: true } }
          }
        },
        candidate: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, coverLetter, resumeId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Resolve candidate profile id from current user
    const candidate = await db.candidateProfile.findUnique({
      where: { userId: (session.user as any).id }
    })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 400 })
    }

    // Require resumeId and check ownership
    if (!resumeId || typeof resumeId !== 'string') {
      return NextResponse.json({ error: 'Resume is required' }, { status: 400 })
    }
    const resume = await db.resume.findFirst({ where: { id: String(resumeId), candidateId: candidate.id } })
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 400 })
    }

    // Check if user already applied
    const existingApplication = await db.application.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: candidate.id,
          jobId: jobId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Create new application
    const application = await db.application.create({
      data: {
        candidateId: candidate.id,
        jobId: jobId,
        coverLetter: coverLetter || '',
        resumeId: resumeId || null,
        status: 'PENDING'
      },
      include: {
        candidate: true
      }
    })

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const employer = await db.employerProfile.findUnique({
      where: { userId: (session.user as any).id }
    })
    if (!employer) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const { applicationId, status } = body || {}
    if (!applicationId || !status) {
      return NextResponse.json({ error: 'applicationId and status are required' }, { status: 400 })
    }

    // Ensure application belongs to employer
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    })
    if (!app || app.job.employerId !== employer.id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    // Update + notify
    const appForNotif = await db.application.findUnique({ where: { id: applicationId }, include: { candidate: true, job: true } })
    const ops: any[] = [
      db.application.update({ where: { id: applicationId }, data: { status } })
    ]
    if (appForNotif?.candidate?.userId) {
      ops.push(
        db.notification.create({
          data: {
            userId: appForNotif.candidate.userId,
            type: 'APPLICATION_STATUS',
            title: 'Статус отклика обновлён',
            message: `Ваш отклик на вакансию "${appForNotif.job?.title || 'Вакансия'}" изменён на ${status}.`
          }
        })
      )
    }
    await db.$transaction(ops)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}