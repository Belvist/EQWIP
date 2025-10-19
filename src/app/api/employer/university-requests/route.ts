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
      return NextResponse.json({ requests: [] })
    }

    // Get notifications from universities about internship requests
    const notifications = await db.notification.findMany({
      where: {
        userId: user.id,
        type: 'NEW_JOB',
        title: 'Запрос на стажеров от университета'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Parse notification data to get university info
    const requests = await Promise.all(
      notifications.map(async (notification) => {
        try {
          const data = JSON.parse(notification.data || '{}')
          const university = await db.university.findUnique({
            where: { id: data.universityId },
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          })
          
          return {
            id: notification.id,
            university: university,
            message: data.message,
            internshipTitle: data.internshipTitle,
            studentCount: data.studentCount,
            startDate: data.startDate,
            endDate: data.endDate,
            createdAt: notification.createdAt
          }
        } catch (error) {
          console.error('Error parsing notification data:', error)
          return null
        }
      })
    )

    return NextResponse.json({ requests: requests.filter(Boolean) })
  } catch (error) {
    console.error('Error fetching university requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
