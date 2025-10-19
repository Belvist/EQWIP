import { Server } from 'socket.io'
import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/db'
import { encryptText } from '@/lib/crypto'
import { NotificationType } from '@prisma/client'

// Типы для уведомлений
export interface RealtimeNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  userId: string
  isRead: boolean
  createdAt: Date
  data?: any
}

export interface NotificationPayload {
  type: NotificationType
  title: string
  message: string
  userId: string
  data?: any
}

// Класс для управления реалтайм уведомлениями
export class RealtimeManager {
  private static instance: RealtimeManager
  private io: Server | null = null
  private userLastSeen: Map<string, number> = new Map()

  private constructor() {}

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  // Инициализация Socket.IO сервера
  public initialize(server: NetServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket']
    })

    // Redis adapter can be enabled in production when dependencies are installed

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Try to identify user by email from handshake auth
      const emailFromToken = (socket.handshake?.auth as any)?.token as string | undefined
      if (emailFromToken) {
        db.user.findUnique({ where: { email: emailFromToken } })
          .then((user) => {
            if (user) {
              ;(socket.data as any).userId = user.id
              ;(socket.data as any).userRole = user.role
              ;(socket.data as any).email = user.email
            }
          })
          .catch((err) => console.error('Socket auth lookup error:', err))
      }

      // Присоединение к личной комнате пользователя
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`)
        console.log(`User ${userId} joined their room`)
      })

      // Присоединение к комнате вакансии
      socket.on('join-job-room', (jobId: string) => {
        socket.join(`job-${jobId}`)
        console.log(`User ${socket.id} joined job room ${jobId}`)
      })

      // Присоединение к комнате компании
      socket.on('join-company-room', (companyId: string) => {
        socket.join(`company-${companyId}`)
        console.log(`User ${socket.id} joined company room ${companyId}`)
      })

      // Присоединение к комнате отклика (чат по заявке)
      socket.on('join_room', async (payload: { applicationId: string; userId?: string }) => {
        try {
          const { applicationId, userId: payloadUserId } = payload || ({} as any)
          let currentUserId = (socket.data as any)?.userId as string | undefined
          if (!currentUserId) {
            // Fallback: resolve from handshake token or payload
            const email = (socket.handshake?.auth as any)?.token as string | undefined
            if (email) {
              const user = await db.user.findUnique({ where: { email } })
              currentUserId = user?.id
            }
            if (!currentUserId && payloadUserId) currentUserId = payloadUserId
          }
          if (!applicationId || !currentUserId) return

          // Verify participation using raw SQL to support snake_case schema
          const rows: any[] = await db.$queryRaw`
            SELECT a."id" as application_id,
                   ep."userId" as employer_user_id,
                   cp."userId" as candidate_user_id
            FROM "applications" a
            JOIN "jobs" j ON a."jobId" = j."id"
            JOIN "employer_profiles" ep ON j."employerId" = ep."id"
            JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
            WHERE a."id" = ${applicationId}
          `
          if (!rows || rows.length === 0) return
          const employerUserId = rows[0].employer_user_id as string
          const candidateUserId = rows[0].candidate_user_id as string
          const isParticipant = currentUserId === employerUserId || currentUserId === candidateUserId
          if (!isParticipant) return

          const roomName = `app-${applicationId}`
          ;(socket.data as any).currentApplicationId = applicationId
          socket.join(roomName)
          socket.to(roomName).emit('user_joined', { userId: currentUserId })
          socket.to(roomName).emit('presence', { userId: currentUserId, online: true })

          // Send current presence to the joining socket
          try {
            const room = this.io?.sockets.adapter.rooms.get(roomName)
            const presentUserIds: string[] = []
            if (room && this.io) {
              for (const sid of room) {
                const s = this.io.sockets.sockets.get(sid)
                const uid = (s?.data as any)?.userId as string | undefined
                if (uid) presentUserIds.push(uid)
              }
            }
            socket.emit('room_users', { userIds: presentUserIds.filter((id) => id !== currentUserId) })
            // Дополнительно сообщаем lastSeen для собеседника, если он офлайн
            const participants = [employerUserId, candidateUserId]
            for (const pid of participants) {
              if (pid === currentUserId) continue
              const online = presentUserIds.includes(pid)
              let lastSeenAt: number | undefined = undefined
              if (!online) {
                lastSeenAt = await this.getLastSeen(pid)
              }
              socket.emit('presence', {
                userId: pid,
                online,
                lastSeenAt,
              })
            }
          } catch {}
        } catch (error) {
          console.error('join_room error:', error)
        }
      })

      // Индикация набора текста
      socket.on('typing', async (payload: { applicationId: string; isTyping: boolean }) => {
        try {
          const { applicationId, isTyping } = payload || ({} as any)
          let currentUserId = (socket.data as any)?.userId as string | undefined
          if (!currentUserId) {
            const email = (socket.handshake?.auth as any)?.token as string | undefined
            if (email) {
              const user = await db.user.findUnique({ where: { email } })
              currentUserId = user?.id
            }
          }
          if (!applicationId || !currentUserId) return
          socket.to(`app-${applicationId}`).emit('user_typing', { userId: currentUserId, isTyping: !!isTyping })
        } catch (error) {
          console.error('typing error:', error)
        }
      })

      // Отправка сообщения
      socket.on('send_message', async (payload: { content: string; applicationId: string; clientMessageId?: string; receiverId?: string }) => {
        try {
          const { content, applicationId, clientMessageId } = payload || ({} as any)
          let currentUserId = (socket.data as any)?.userId as string | undefined
          if (!currentUserId) {
            const email = (socket.handshake?.auth as any)?.token as string | undefined
            if (email) {
              const user = await db.user.findUnique({ where: { email } })
              currentUserId = user?.id
            }
          }
          if (!content || !applicationId || !currentUserId) return

          // Resolve participants via raw SQL (snake_case)
          const appRows: any[] = await db.$queryRaw`
            SELECT a."id" as application_id,
                   ep."userId" as employer_user_id,
                   cp."userId" as candidate_user_id
            FROM "applications" a
            JOIN "jobs" j ON a."jobId" = j."id"
            JOIN "employer_profiles" ep ON j."employerId" = ep."id"
            JOIN "candidate_profiles" cp ON a."candidateId" = cp."id"
            WHERE a."id" = ${applicationId}
          `
          if (!appRows || appRows.length === 0) return
          const employerUserId = appRows[0].employer_user_id as string
          const candidateUserId = appRows[0].candidate_user_id as string
          const isEmployer = currentUserId === employerUserId
          const isCandidate = currentUserId === candidateUserId
          if (!isEmployer && !isCandidate) return

          const receiverId = isEmployer ? candidateUserId : employerUserId

          // Сохраняем сообщение через Prisma, чтобы корректно выставлять id и дефолты
          const encrypted = encryptText(content.trim())
          const created = await db.message.create({
            data: {
              content: encrypted,
              senderId: currentUserId,
              receiverId,
              applicationId,
            },
            select: {
              id: true,
              content: true,
              isRead: true,
              createdAt: true,
            },
          })

          const users: any[] = await db.$queryRaw`
            SELECT "id", "name", "avatar" FROM "users" WHERE "id" IN (${currentUserId}, ${receiverId})
          `
          const sender = users.find(u => u.id === currentUserId) || { id: currentUserId, name: 'Вы', avatar: null }
          const receiver = users.find(u => u.id === receiverId) || { id: receiverId, name: 'Собеседник', avatar: null }

          // Санитизация: удаляем base64‑подобные фрагменты (без плейсхолдеров)
          const sanitizeOutgoing = (input: string): string => {
            if (!input) return ''
            let txt = String(input)
            txt = txt.replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/gi, '')
            try {
              txt = txt.replace(/(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{32,}={0,2}(?![A-Za-z0-9+/=])/g, '')
            } catch {
              txt = txt.replace(/[A-Za-z0-9+/]{48,}={0,2}/g, '')
            }
            txt = txt.trim()
            return txt || '[пусто]'
          }

          const payloadMsg = {
            id: created.id as string,
            content: sanitizeOutgoing(content.trim()),
            sender: { id: sender.id as string, name: (sender.name as string) || 'Вы', avatar: (sender.avatar as string) || null },
            receiver: { id: receiver.id as string, name: (receiver.name as string) || 'Собеседник', avatar: (receiver.avatar as string) || null },
            createdAt: (created.createdAt as Date).toISOString(),
            isRead: (created.isRead as boolean) || false,
          }

          // Отправляем всем остальным участникам комнаты заявки (без отправителя);
          // отправитель уже отрисовал оптимистическое сообщение
          socket.to(`app-${applicationId}`).emit('new_message', payloadMsg)

          // Подтверждаем отправителю, чтобы заменить временный id
          if (clientMessageId) {
            socket.emit('message_saved', { tempId: clientMessageId, id: payloadMsg.id, createdAt: payloadMsg.createdAt })
          }

          // Уведомление получателю
          await this.sendNotificationToUser({
            type: 'MESSAGE',
            title: 'Новое сообщение',
            message: `Сообщение по отклику`,
            userId: receiverId,
            data: { applicationId, messageId: payloadMsg.id },
          })
        } catch (error) {
          console.error('send_message error:', error)
        }
      })

      // Отметка сообщений прочитанными
      socket.on('mark_read', async (payload: { applicationId: string; messageIds: string[] }) => {
        try {
          const { applicationId, messageIds } = payload || ({} as any)
          let currentUserId = (socket.data as any)?.userId as string | undefined
          if (!currentUserId) {
            const email = (socket.handshake?.auth as any)?.token as string | undefined
            if (email) {
              const user = await db.user.findUnique({ where: { email } })
              currentUserId = user?.id
            }
          }
          if (!applicationId || !currentUserId || !Array.isArray(messageIds) || messageIds.length === 0) return

          // Обновляем статус в БД только для сообщений, адресованных текущему пользователю
          await db.message.updateMany({
            where: { id: { in: messageIds }, applicationId, receiverId: currentUserId, isRead: false },
            data: { isRead: true }
          })

          // Уведомляем комнату чата
          this.io?.to(`app-${applicationId}`).emit('messages_read', { messageIds })
        } catch (error) {
          console.error('mark_read error:', error)
        }
      })

      // Обработка отметки прочтения уведомления
      socket.on('mark-notification-read', async (notificationId: string) => {
        try {
          await db.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
          })
          
          socket.emit('notification-marked-read', { notificationId })
        } catch (error) {
          console.error('Error marking notification as read:', error)
          socket.emit('error', { message: 'Failed to mark notification as read' })
        }
      })

      // Обработка отметки всех уведомлений прочитанными
      socket.on('mark-all-notifications-read', async (userId: string) => {
        try {
          await db.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
          })
          
          socket.emit('all-notifications-marked-read', { userId })
        } catch (error) {
          console.error('Error marking all notifications as read:', error)
          socket.emit('error', { message: 'Failed to mark all notifications as read' })
        }
      })

      // Отключение
      socket.on('disconnect', async () => {
        try {
          const appId = (socket.data as any)?.currentApplicationId as string | undefined
          const uid = (socket.data as any)?.userId as string | undefined
          if (appId && uid) {
            const roomName = `app-${appId}`
            const ts = Date.now()
            this.userLastSeen.set(uid, ts)
            this.io?.to(roomName).emit('user_left', { userId: uid, lastSeenAt: ts })
            this.io?.to(roomName).emit('presence', { userId: uid, online: false, lastSeenAt: ts })
            try {
              await db.user.update({ where: { id: uid }, data: { lastSeenAt: new Date(ts) } })
            } catch {}
          }
        } catch {}
        console.log(`User disconnected: ${socket.id}`)
      })

      // Обработка ошибок
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.id}:`, error)
      })
    })
  }

  // Возвращает lastSeen из памяти, либо оценивает по последней активности в БД (сообщения)
  private async getLastSeen(userId: string): Promise<number | undefined> {
    const fromMemory = this.userLastSeen.get(userId)
    if (fromMemory) return fromMemory
    try {
      const lastMsg = await db.message.findFirst({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      if (lastMsg?.createdAt) {
        return (lastMsg.createdAt as Date).getTime()
      }
    } catch (e) {
      console.error('getLastSeen fallback error:', e)
    }
    return undefined
  }

  // Отправка уведомления пользователю
  public async sendNotificationToUser(payload: NotificationPayload) {
    if (!this.io) return

    try {
      // Сохраняем уведомление в базу данных
      const notification = await db.notification.create({
        data: {
          type: payload.type,
          title: payload.title,
          message: payload.message,
          userId: payload.userId,
          isRead: false
        }
      })

      // Отправляем через WebSocket
      this.io.to(`user-${payload.userId}`).emit('notification', {
        ...notification,
        data: payload.data
      })

      // Отправляем уведомление через Telegram бот
      try {
        const user = await db.user.findUnique({ where: { id: payload.userId }, select: { telegramId: true } })
        if (user?.telegramId) {
          // Определяем тип уведомления для правильного эндпоинта
          let endpoint = ''
          let telegramPayload: any = { telegramId: user.telegramId }
          
          if (payload.type === 'APPLICATION_STATUS' && payload.data?.newStatus) {
            endpoint = '/notify/application-status'
            telegramPayload.jobTitle = payload.data.jobTitle || 'вакансия'
            telegramPayload.status = payload.data.newStatus
          } else if (payload.type === 'APPLICATION_STATUS' && payload.data?.candidateName) {
            endpoint = '/notify/new-application'
            telegramPayload.jobTitle = payload.data.jobTitle || payload.message.match(/"([^"]+)"/)?.[1] || 'вакансия'
            telegramPayload.applicantName = payload.data.candidateName
          } else if (payload.type === 'NEW_JOB') {
            endpoint = '/notify/job-published'
            telegramPayload.jobTitle = payload.data?.jobTitle || payload.message.match(/"([^"]+)"/)?.[1] || 'вакансия'
          }
          
          if (endpoint) {
            await fetch('http://127.0.0.1:8001' + endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(telegramPayload)
            })
          }
        }
      } catch (err) {
        console.error('Telegram notification error', err)
      }

      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  // Отправка уведомления в комнату вакансии
  public async sendNotificationToJobRoom(jobId: string, payload: Omit<NotificationPayload, 'userId'>) {
    if (!this.io) return

    try {
      // Получаем всех пользователей, связанных с вакансией
      const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
          employer: {
            include: {
              user: true
            }
          },
          applications: {
            include: {
              candidate: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      if (!job) return

      // Отправляем уведомление работодателю
      await this.sendNotificationToUser({
        ...payload,
        userId: job.employer.userId,
        data: { ...payload.data, jobId }
      })

      // Отправляем в комнату вакансии
      this.io.to(`job-${jobId}`).emit('job-notification', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        jobId,
        data: payload.data
      })
    } catch (error) {
      console.error('Error sending job notification:', error)
      throw error
    }
  }

  // Отправка уведомления в комнату компании
  public async sendNotificationToCompanyRoom(companyId: string, payload: Omit<NotificationPayload, 'userId'>) {
    if (!this.io) return

    try {
      // Получаем всех пользователей, связанных с компанией
      const company = await db.employerProfile.findUnique({
        where: { id: companyId },
        include: {
          user: true,
          follows: {
            include: {
              user: true
            }
          }
        }
      })

      if (!company) return

      // Отправляем уведомление владельцу компании
      await this.sendNotificationToUser({
        ...payload,
        userId: company.userId,
        data: { ...payload.data, companyId }
      })

      // Отправляем в комнату компании
      this.io.to(`company-${companyId}`).emit('company-notification', {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        companyId,
        data: payload.data
      })
    } catch (error) {
      console.error('Error sending company notification:', error)
      throw error
    }
  }

  // Уведомление о новом отклике
  public async notifyNewApplication(applicationId: string) {
    try {
      const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              employer: {
                include: {
                  user: true
                }
              }
            }
          },
          candidate: {
            include: {
              user: true
            }
          }
        }
      })

      if (!application) return

      await this.sendNotificationToUser({
        type: 'APPLICATION_STATUS',
        title: 'Новый отклик',
        message: `Новый отклик на вакансию "${application.job.title}"`,
        userId: application.job.employer.userId,
        data: {
          applicationId,
          jobId: application.job.id,
          candidateName: application.candidate.user.name || 'Кандидат'
        }
      })
    } catch (error) {
      console.error('Error notifying new application:', error)
    }
  }

  // Уведомление об изменении статуса отклика
  public async notifyApplicationStatusUpdate(applicationId: string, newStatus: string) {
    try {
      const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          candidate: {
            include: {
              user: true
            }
          }
        }
      })

      if (!application) return

      const statusMessages = {
        'PENDING': 'Ваш отклик находится на рассмотрении',
        'REVIEWED': 'Ваш отклик был просмотрен',
        'SHORTLISTED': 'Поздравляем! Вы прошли в шорт-лист',
        'REJECTED': 'К сожалению, ваш отклик был отклонен',
        'HIRED': 'Поздравляем! Вы были наняты'
      }

      await this.sendNotificationToUser({
        type: 'APPLICATION_STATUS',
        title: 'Обновление статуса отклика',
        message: statusMessages[newStatus as keyof typeof statusMessages] || 'Статус вашего отклика был обновлен',
        userId: application.candidate.userId,
        data: {
          applicationId,
          jobId: application.job.id,
          jobTitle: application.job.title,
          newStatus
        }
      })
    } catch (error) {
      console.error('Error notifying application status update:', error)
    }
  }

  // Уведомление о новом сообщении
  public async notifyNewMessage(messageId: string) {
    try {
      const message = await db.message.findUnique({
        where: { id: messageId },
        include: {
          sender: true,
          receiver: true
        }
      })

      if (!message) return

      await this.sendNotificationToUser({
        type: 'MESSAGE',
        title: 'Новое сообщение',
        message: `Вы получили новое сообщение от ${message.sender.name || 'пользователя'}`,
        userId: message.receiverId,
        data: {
          messageId,
          senderId: message.senderId,
          senderName: message.sender.name
        }
      })
    } catch (error) {
      console.error('Error notifying new message:', error)
    }
  }

  // Уведомление о новой вакансии
  public async notifyNewJob(jobId: string) {
    try {
      const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
          employer: {
            include: {
              user: true
            }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
      })

      if (!job) return

      // Находим пользователей, которые могут быть заинтересованы в этой вакансии
      const interestedUsers = await db.user.findMany({
        where: {
          candidateProfile: {
            skills: {
              some: {
                skill: {
                  name: {
                    in: job.skills.map(js => js.skill.name)
                  }
                }
              }
            }
          }
        },
        take: 50 // Ограничиваем количество уведомлений
      })

      // Отправляем уведомления заинтересованным пользователям
      for (const user of interestedUsers) {
        await this.sendNotificationToUser({
          type: 'NEW_JOB',
          title: 'Новая вакансия',
          message: `Появилась новая вакансия "${job.title}" в компании ${job.employer.companyName}`,
          userId: user.id,
          data: {
            jobId,
            jobTitle: job.title,
            companyName: job.employer.companyName
          }
        })
      }
    } catch (error) {
      console.error('Error notifying new job:', error)
    }
  }

  // Получение экземпляра Socket.IO
  public getIO(): Server | null {
    return this.io
  }
}

// Экспорт экземпляра менеджера
export const realtimeManager = RealtimeManager.getInstance()

// Middleware для интеграции с Next.js API
export const withRealtime = (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('Realtime middleware error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}