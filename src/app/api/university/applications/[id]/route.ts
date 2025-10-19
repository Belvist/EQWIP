import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user is university or admin
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const university = await db.university.findFirst({ where: { userId: user.id } })
    if (!university) return NextResponse.json({ error: 'University not found' }, { status: 404 })

    const application = await db.internshipApplication.findFirst({
      where: {
        id: params.id,
        posting: {
          universityId: university.id
        }
      },
      include: {
        employer: {
          include: {
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
            studentCount: true,
            description: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Error fetching application details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
