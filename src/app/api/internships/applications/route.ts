import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const { applicationId, action } = body // action: 'accept' or 'reject'
    if (!applicationId || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    // Get the notification (which represents the application)
    const notification = await db.notification.findUnique({ 
      where: { id: applicationId }
    })
    if (!notification) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    // Check if user is employer or admin
    const employer = await db.employerProfile.findFirst({ where: { userId: user.id } })
    if (!employer && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse notification data from message
    let data = {}
    try {
      // Try to extract JSON from the end of the message
      const messageParts = notification.message.split('. Данные: ')
      if (messageParts.length > 1) {
        data = JSON.parse(messageParts[1])
      }
    } catch (parseError) {
      console.log('Could not parse notification data from message:', notification.message)
      return NextResponse.json({ error: 'Invalid notification data' }, { status: 400 })
    }
    
    const university = await db.university.findUnique({ where: { id: data.universityId } })
    if (!university) return NextResponse.json({ error: 'University not found' }, { status: 404 })

    // Update notification status
    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
    
    // Update the original notification with decision
    await db.notification.update({
      where: { id: applicationId },
      data: {
        message: notification.message + ` [Статус: ${newStatus === 'ACCEPTED' ? 'ПРИНЯТО' : 'ОТКЛОНЕНО'}]`,
        title: newStatus === 'ACCEPTED' ? 'Заявка принята' : 'Заявка отклонена',
        data: JSON.stringify({ 
          ...data, 
          status: newStatus,
          decisionBy: user.id,
          decisionAt: new Date().toISOString()
        })
      }
    })

    // Notify university about employer's decision
    try {
      if (university.userId) {
        let notificationMessage = ''
        if (newStatus === 'ACCEPTED') {
          notificationMessage = `Компания ${employer?.companyName || 'Компания'} приняла вашу заявку на размещение стажеров по специальности "${data.specialty}".`
        } else if (newStatus === 'REJECTED') {
          notificationMessage = `Компания ${employer?.companyName || 'Компания'} отклонила вашу заявку на размещение стажеров по специальности "${data.specialty}".`
        }

        // Notify university
        await db.notification.create({ 
          data: { 
            userId: university.userId, 
            type: 'APPLICATION_STATUS', 
            title: 'Статус заявки обновлен', 
            message: notificationMessage
          } 
        })
        console.log(`Notification sent to university ${university.name} (${university.userId})`)
      } else {
        console.log(`University ${university.name} has no userId, cannot send notification`)
      }
    } catch (e) { 
      console.error('Notify university failed', e) 
    }

    return NextResponse.json({ data: { id: applicationId, status: newStatus } })
  } catch (error) {
    console.error('Error updating internship application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


