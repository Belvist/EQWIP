import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user has university profile (regardless of role)
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    if (!uni) {
      console.log('No university profile found for user:', user.id, 'role:', user.role)
      return NextResponse.json({
        totalPostings: 0,
        activePostings: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0
      })
    }

    // Check if user is university, admin, or has university profile
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN' && !uni) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get basic stats
    const totalPostings = await db.internshipPosting.count({
      where: { universityId: uni.id }
    })

    const activePostings = await db.internshipPosting.count({
      where: { universityId: uni.id, isActive: true }
    })

    // Get applications stats
    const applications = await db.internshipApplication.findMany({
      where: {
        posting: {
          universityId: uni.id
        }
      },
      select: {
        status: true
      }
    })

    const totalApplications = applications.length
    const pendingApplications = applications.filter(a => a.status === 'PENDING').length
    const approvedApplications = applications.filter(a => a.status === 'APPROVED').length

    return NextResponse.json({
      totalPostings,
      activePostings,
      totalApplications,
      pendingApplications,
      approvedApplications
    })
  } catch (error) {
    console.error('Error fetching university stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
