import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        employerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== UserRole.EMPLOYER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch employer profile with jobs and application counts
    const employerProfile = await db.employerProfile.findUnique({
      where: { userId: user.id },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { applications: true } }
          }
        }
      }
    })

    if (!employerProfile) {
      return NextResponse.json(null)
    }

    // Normalize jobs to expose applicationsCount as a top-level field
    const jobs = employerProfile.jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      isActive: job.isActive,
      applicationsCount: job._count?.applications ?? 0,
      createdAt: job.createdAt
    }))

    return NextResponse.json({
      id: employerProfile.id,
      userId: employerProfile.userId,
      companyName: employerProfile.companyName,
      description: employerProfile.description,
      website: employerProfile.website,
      industry: employerProfile.industry,
      size: employerProfile.size,
      location: employerProfile.location,
      logo: employerProfile.logo ? `/api/profile/company-logo?f=${encodeURIComponent(employerProfile.logo)}` : '',
      jobs
    })
  } catch (error) {
    console.error('Error fetching employer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      companyName,
      description,
      website,
      industry,
      size,
      location,
      logo
    } = data

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== UserRole.EMPLOYER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existingProfile = await db.employerProfile.findUnique({
      where: { userId: user.id }
    })

    let employerProfile

    if (existingProfile) {
      employerProfile = await db.employerProfile.update({
        where: { userId: user.id },
        data: {
          companyName,
          description,
          website,
          industry,
          size,
          location,
          logo
        }
      })
    } else {
      employerProfile = await db.employerProfile.create({
        data: {
          userId: user.id,
          companyName,
          description,
          website,
          industry,
          size,
          location,
          logo
        }
      })
    }

    return NextResponse.json(employerProfile)
  } catch (error) {
    console.error('Error updating employer profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Поддержка простого управления подпиской работодателя
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan as 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | undefined
    if (!plan) return NextResponse.json({ error: 'Plan is required' }, { status: 400 })

    const sub = await db.subscription.upsert({
      where: { userId: user.id },
      update: { plan, isActive: true },
      create: { userId: user.id, plan, isActive: true }
    })
    return NextResponse.json({ ok: true, plan: sub.plan })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}