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

    // Check if user has university profile (regardless of role)
    const university = await db.university.findFirst({ where: { userId: user.id } })
    if (!university) {
      console.log('No university profile found for user:', user.id, 'role:', user.role)
      return NextResponse.json({ applications: [] })
    }

    // Check if user is university, admin, or has university profile
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN' && !university) {
      console.log('Access denied for role:', user.role)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const applications = await db.internshipApplication.findMany({
      where: {
        posting: {
          universityId: university.id
        }
      },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            website: true,
            description: true,
            industry: true,
            size: true,
            location: true,
            logo: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        posting: {
          select: {
            id: true,
            title: true,
            specialty: true,
            startDate: true,
            endDate: true,
            location: true,
            studentCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Error fetching university applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
