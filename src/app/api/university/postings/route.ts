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
      return NextResponse.json({ postings: [] })
    }

    // Check if user is university, admin, or has university profile
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN' && !uni) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const postings = await db.internshipPosting.findMany({ 
      where: { universityId: uni.id }, 
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' } 
    })
    
    const formattedPostings = postings.map(posting => ({
      ...posting,
      applicationsCount: posting._count.applications
    }))
    
    return NextResponse.json({ postings: formattedPostings })
  } catch (e) {
    console.error('Error fetching university postings:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


