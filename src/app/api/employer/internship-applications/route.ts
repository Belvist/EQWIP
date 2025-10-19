import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('No session or email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      console.log('User not found:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User role:', user.role)

    // Check if user has employer profile (regardless of role)
    const employer = await db.employerProfile.findFirst({ where: { userId: user.id } })
    if (!employer) {
      console.log('No employer profile found for user:', user.id, 'role:', user.role)
      return NextResponse.json({ applications: [] })
    }

    // Check if user is employer, admin, or has employer profile
    if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN' && !employer) {
      console.log('Access denied for role:', user.role)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Show all applications regardless of notifyOnUniversityPost setting
    // The employer can still control notifications via settings, but can see all applications

    // Get notifications from universities about internship requests
    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: 'Заявка на стажеров от университета' },
          { title: 'Решение по заявке' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convert notifications to application format
    const applications = await Promise.all(
      notifications.map(async (notification) => {
        try {
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
          
          // Skip if this is a decision notification (we only want original requests)
          if (notification.title === 'Решение по заявке') {
            return null
          }
          
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
          
          return {
            id: notification.id,
            status: status,
            message: `Заявка на размещение ${data.studentCount} стажеров по специальности "${data.specialty}"`,
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
        } catch (error) {
          console.error('Error parsing notification data:', error)
          return null
        }
      })
    )

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching internship applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
