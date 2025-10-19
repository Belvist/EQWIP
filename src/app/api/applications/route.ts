import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { deepDecrypt } from '@/lib/crypto'
import fs from 'fs'
import path from 'path'

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
    const currentUserId = (session.user as any).id as string

    const augment = async (apps: any[]) => {
      const result: any[] = []
      for (const a of apps) {
        const appId = a.id as string
        // Последнее сообщение
        const last = await db.message.findFirst({
          where: { applicationId: appId },
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, senderId: true, receiverId: true }
        })
        const lastContent = last?.content ? (() => {
          const raw = String(last.content)
          let dec = deepDecrypt(raw, 5)
          if (dec === raw) {
            // удалить base64-подобные сегменты
            try { dec = dec.replace(/(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9+/=])/g, '') } catch { dec = dec.replace(/[A-Za-z0-9+/]{48,}={0,2}/g, '') }
          }
          dec = dec.replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/gi, '')
          dec = dec.trim()
          return dec || '[пусто]'
        })() : undefined
        // Непрочитанные для текущего пользователя
        const unreadCount = await db.message.count({
          where: { applicationId: appId, receiverId: currentUserId, isRead: false }
        })
        result.push({ ...a, _lastMessage: last ? { content: lastContent, createdAt: last.createdAt } : null, _unreadCount: unreadCount })
      }
      return result
    }

    // If checking for a specific job and current candidate already applied
    if (jobId) {
      const role = (session.user as any).role
      if (role === 'EMPLOYER') {
        // Работодатель: все отклики по конкретной вакансии, которая принадлежит ему
        const employer = await db.employerProfile.findUnique({
          where: { userId: (session.user as any).id }
        })
        if (!employer) return NextResponse.json({ applications: [] })
        const applications = await db.application.findMany({
          where: {
            jobId,
            job: { employerId: employer.id },
            ...(statusFilter ? { status: statusFilter as any } : {}),
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
        const enriched = await augment(applications)
        return NextResponse.json({ applications: enriched })
      }
      // Кандидат: свои отклики на эту вакансию
      const candidate = await db.candidateProfile.findUnique({
        where: { userId: (session.user as any).id }
      })
      const applications = await db.application.findMany({
        where: { jobId, candidateId: candidate?.id || '' },
        include: {}
      })
      const enriched = await augment(applications)
      return NextResponse.json({ applications: enriched })
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
    const enriched = await augment(applications)
    return NextResponse.json({ applications: enriched })
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

    // Require resumeId (quick win to avoid empty applications)
    if (!resumeId || typeof resumeId !== 'string') {
      return NextResponse.json({ error: 'Resume is required' }, { status: 400 })
    }
    // Ensure resume belongs to current candidate
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

    // Notify employer about new application (DB notification + Telegram if available)
    try {
      const job = await db.job.findUnique({ where: { id: jobId }, include: { employer: { select: { userId: true, companyName: true } } } })
      if (job?.employer?.userId) {
        // create DB notification for employer user
        await db.notification.create({
          data: {
            userId: job.employer.userId,
            type: 'APPLICATION_STATUS',
            title: 'Новый отклик',
            message: `Новый отклик на вакансию \"${job.title || 'Вакансия'}\"`
          }
        })

        // send telegram if bot token and chat id present
        try {
          const employerUser = await db.user.findUnique({ where: { id: job.employer.userId } })
          const chatId = employerUser?.telegramId
          if (chatId && process.env.BOT_TOKEN) {
            const applicantName = (session.user as any)?.name || 'Кандидат'
            const text = `📄 Новый отклик на вакансию <b>${job.title || 'Вакансия'}</b> от ${applicantName}.`
            await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
            })
          }
        } catch (e) {
          console.error('Telegram notify employer error', e)
        }
      }
    } catch (e) {
      console.error('Notify employer flow error', e)
    }

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

    // Update status + create view + send notification to candidate
    const updates: any[] = [
      db.application.update({
        where: { id: applicationId },
        data: { status, viewsCount: status === 'REVIEWED' ? { increment: 1 } : undefined }
      })
    ]
    if (status === 'REVIEWED') {
      updates.push(
        db.applicationView.create({
          data: {
            applicationId,
            employerUserId: (session.user as any).id || null,
          }
        })
      )
    }
    // Fetch candidate userId for notification
    const appForNotif = await db.application.findUnique({ where: { id: applicationId }, include: { candidate: true, job: true } })
    if (appForNotif?.candidate?.userId) {
      updates.push(
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
    await db.$transaction(updates)

    // Send notification to candidate via DB + Telegram
    try {
      const appFull = await db.application.findUnique({
        where: { id: String(body?.applicationId || '') },
        include: {
          job: true,
          candidate: {
            include: { user: true }
          }
        }
      })
      if (appFull?.candidate?.userId) {
        const candidateUser = appFull.candidate.user
        const statusTextMap: Record<string, string> = {
          'PENDING': `Ваш отклик на вакансию "${appFull.job?.title || 'Вакансия'}" находится на рассмотрении`,
          'REVIEWED': `Ваш отклик на вакансию "${appFull.job?.title || 'Вакансия'}" был просмотрен`,
          'SHORTLISTED': `Поздравляем! Вы прошли в шорт-лист по вакансии "${appFull.job?.title || 'Вакансия'}"`,
          'REJECTED': `К сожалению, отклик на вакансию "${appFull.job?.title || 'Вакансия'}" отклонён`,
          'HIRED': `Поздравляем! Вы приняты на позицию "${appFull.job?.title || 'Вакансия'}"`
        }
        const newStatus = String(body?.status || '')

        // DB notification
        await db.notification.create({
          data: {
            userId: appFull.candidate.userId,
            type: 'APPLICATION_STATUS',
            title: 'Обновление статуса отклика',
            message: statusTextMap[newStatus] || 'Статус отклика обновлён'
          }
        })

        // Telegram notification
        try {
          const chatId = candidateUser?.telegramId
          if (chatId && process.env.BOT_TOKEN) {
            const text = ((): string => {
              switch (newStatus) {
                case 'SHORTLISTED':
                  return `📩 Приглашение: вы прошли в шорт-лист по вакансии <b>${appFull.job?.title || 'Вакансия'}</b>. Мы скоро свяжемся с вами.`
                case 'HIRED':
                  return `✅ Вы наняты на вакансию <b>${appFull.job?.title || 'Вакансия'}</b>. Поздравляем!`
                case 'REJECTED':
                  return `❌ Ваш отклик на вакансию <b>${appFull.job?.title || 'Вакансия'}</b> отклонён.`
                case 'REVIEWED':
                  return `👀 Ваш отклик на вакансию <b>${appFull.job?.title || 'Вакансия'}</b> был просмотрен.`
                default:
                  return `ℹ️ Статус вашего отклика по <b>${appFull.job?.title || 'Вакансия'}</b> обновлён: ${newStatus}.`
              }
            })()
            await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
            })
          }
        } catch (e) {
          console.error('Telegram notify candidate error', e)
        }
      }
    } catch (e) {
      console.error('Candidate notify flow error', e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId') || ''
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    // Load application with ownership info
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    })
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Authorize: candidate who applied or employer who owns the job
    const currentUserId = (session.user as any).id as string
    const candidate = await db.candidateProfile.findUnique({ where: { id: app.candidateId }, select: { userId: true } })
    const employer = await db.employerProfile.findUnique({ where: { id: app.job.employerId }, select: { userId: true } })
    if (candidate?.userId !== currentUserId && employer?.userId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove attachments directory (messages are cascaded on application delete)
    const baseRoot = process.env.FILE_ROOT || path.resolve('/www/eqwip/filemang')
    const dir = path.resolve(baseRoot, applicationId)
    try {
      await fs.promises.rm(dir, { recursive: true, force: true })
    } catch {}

    // Delete application (cascades to messages and application views)
    await db.application.delete({ where: { id: applicationId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}