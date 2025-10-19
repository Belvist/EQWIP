import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const activeOnly = searchParams.get('active') !== '0'

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { specialty: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    }
    if (activeOnly) where.isActive = true

    const list = await db.internshipPosting.findMany({
      where,
      include: { university: { select: { id: true, name: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ data: list })
  } catch (error) {
    console.error('Error listing internships:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { email: session.user.email }, include: { employerProfile: true, candidateProfile: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    // Allow only Universities users or admin to create postings
    if (user.role !== 'UNIVERSITY' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find associated university
    const uni = await db.university.findFirst({ where: { userId: user.id } })
    if (!uni) return NextResponse.json({ error: 'University profile not found' }, { status: 404 })

    const posting = await db.internshipPosting.create({
      data: {
        title: String(body.title || '').slice(0, 200),
        specialty: String(body.specialty || '').slice(0, 200),
        description: String(body.description || ''),
        studentCount: Number(body.studentCount || 1),
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        location: body.location || null,
        universityId: uni.id
      }
    })

    // Notify all employers about new internship posting
    try {
      const employers = await db.employerProfile.findMany()
      console.log(`Found ${employers.length} employers to notify`)
      console.log('Employers:', employers.map(e => ({ id: e.id, userId: e.userId, companyName: e.companyName, notifyOnUniversityPost: e.notifyOnUniversityPost })))
      
      for (const e of employers) {
        const notificationData = {
          internshipId: posting.id, 
          internshipTitle: posting.title,
          universityId: uni.id,
          universityName: uni.name,
          specialty: posting.specialty,
          studentCount: posting.studentCount,
          startDate: posting.startDate,
          endDate: posting.endDate,
          location: posting.location
        }
        
        console.log(`Creating notification for employer ${e.companyName} (${e.userId}):`, notificationData)
        
        await db.notification.create({ 
          data: { 
            userId: e.userId, 
            type: 'NEW_JOB', 
            title: 'Заявка на стажеров от университета', 
            message: `Университет ${uni.name} подал заявку на размещение стажеров: ${posting.title}. Данные: ${JSON.stringify(notificationData)}`
          } 
        })
        
        console.log(`Notification created for employer ${e.companyName}`)
      }
    } catch (e) { 
      console.error('Notify employers failed', e) 
    }

    return NextResponse.json({ data: posting })
  } catch (error) {
    console.error('Error creating internship posting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


