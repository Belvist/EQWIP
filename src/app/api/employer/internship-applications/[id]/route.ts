import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has employer profile
    const employer = await db.employerProfile.findFirst({ where: { userId: user.id } })
    if (!employer && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the notification (which represents the application)
    const notification = await db.notification.findUnique({
      where: { id: params.id }
    })
    
    if (!notification) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if this notification belongs to the current user
    if (notification.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse data from notification.data field first, then fallback to message
    let data = {}
    try {
      if (notification.data) {
        data = JSON.parse(notification.data)
      } else {
        // Fallback: try to extract JSON from the end of the message
        const messageParts = notification.message.split('. Данные: ')
        if (messageParts.length > 1) {
          data = JSON.parse(messageParts[1])
        }
      }
    } catch (parseError) {
      console.log('Could not parse notification data:', notification.data || notification.message)
      // Fallback: try to extract basic info from message
      data = {
        internshipId: notification.id,
        internshipTitle: 'Заявка на стажеров',
        universityId: 'unknown',
        universityName: 'Неизвестный университет',
        specialty: 'Не указано',
        studentCount: 1,
        startDate: null,
        endDate: null,
        location: null
      }
    }

    // Get university details
    const university = await db.university.findUnique({
      where: { id: data.universityId },
      select: {
        id: true,
        name: true,
        logo: true,
        website: true,
        description: true,
        location: true,
        establishedYear: true,
        studentCount: true,
        specialties: true
      }
    })

    // Check if there's a decision in the notification data
    const status = data.status || 'PENDING'
    
    const application = {
      id: notification.id,
      status: status,
      message: notification.message.split('. Данные: ')[0], // Remove JSON data from message
      createdAt: notification.createdAt,
      posting: {
        id: data.internshipId,
        title: data.internshipTitle || 'Заявка на стажеров',
        specialty: data.specialty,
        studentCount: data.studentCount,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        university: university || {
          id: data.universityId,
          name: data.universityName || 'Неизвестный университет',
          logo: null,
          website: null,
          description: null,
          location: null,
          establishedYear: null,
          studentCount: null,
          specialties: null
        }
      }
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching internship application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}