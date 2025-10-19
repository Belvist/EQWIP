import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: user.id
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { userId, type, title, message } = data

    // Verify sender has permission to send notifications
    const sender = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    }

    // Only admins and employers can send notifications to others
    if (userId !== sender.id && sender.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const notification = await db.notification.create({
      data: {
        userId: userId || sender.id,
        type: type as NotificationType,
        title,
        message
      }
    })

    // Send real-time notification if socket is available
    // This would be integrated with the socket.io system

    // Send email notification for important types
    if (type === 'APPLICATION_STATUS' || type === 'INTERVIEW_INVITE') {
      await sendEmailNotification(notification)
    }

    // Send Telegram notification if user has it connected
    await sendTelegramNotification(notification)

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { notificationIds, markAsRead = true } = data

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify notifications belong to this user
    const notifications = await db.notification.findMany({
      where: {
        id: {
          in: notificationIds
        },
        userId: user.id
      }
    })

    if (notifications.length !== notificationIds.length) {
      return NextResponse.json({ error: 'Some notifications not found' }, { status: 404 })
    }

    // Update notifications
    const updatedNotifications = await db.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        }
      },
      data: {
        isRead: markAsRead
      }
    })

    return NextResponse.json({
      updated: updatedNotifications.count
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for sending notifications
async function sendEmailNotification(notification: any) {
  try {
    // In a real implementation, you would use a service like SendGrid, AWS SES, or Nodemailer
    console.log('Sending email notification:', notification)
    
    // Mock implementation
    // const user = await db.user.findUnique({
    //   where: { id: notification.userId },
    //   select: { email: true, name: true }
    // })
    
    // if (user?.email) {
    //   await sendEmail({
    //     to: user.email,
    //     subject: notification.title,
    //     text: notification.message,
    //     html: `<p>${notification.message}</p>`
    //   })
    // }
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

async function sendTelegramNotification(notification: any) {
  try {
    // Check if user has Telegram connected
    const user = await db.user.findUnique({
      where: { id: notification.userId },
      select: { telegramId: true }
    })

    if (user?.telegramId) {
      // Send Telegram notification using bot API
      console.log('Sending Telegram notification to:', user.telegramId)
      
      // Mock implementation
      // await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     chat_id: user.telegramId,
      //     text: `${notification.title}\n\n${notification.message}`,
      //     parse_mode: 'HTML'
      //   })
      // })
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
  }
}