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

    // Check if user has university profile
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    if (!uni) {
      return NextResponse.json({ requests: [] })
    }

    // Get all companies that have opted in for university requests
    const companies = await db.employerProfile.findMany({
      where: { notifyOnUniversityPost: true },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user has university profile
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    if (!uni) {
      return NextResponse.json({ error: 'University profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { companyId, message, internshipTitle, studentCount, startDate, endDate } = body

    if (!companyId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get company info
    const company = await db.employerProfile.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Create notification for company
    await db.notification.create({
      data: {
        userId: company.userId,
        type: 'NEW_JOB',
        title: 'Запрос на стажеров от университета',
        message: `Университет ${uni.name} хочет направить стажеров в вашу компанию. ${message}`,
        data: JSON.stringify({
          universityId: uni.id,
          universityName: uni.name,
          message,
          internshipTitle,
          studentCount,
          startDate,
          endDate
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending company request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
