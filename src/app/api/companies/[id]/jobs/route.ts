import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    // Fetch employer jobs (company == employerProfile)
    const jobs = await db.job.findMany({
      where: { employerId: companyId, isActive: true },
      include: {
        _count: {
          select: {
            applications: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      salaryMin: job.salaryMin || undefined,
      salaryMax: job.salaryMax || undefined,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      employmentType: job.employmentType,
      workFormat: job.workFormat,
      location: job.location || 'Remote',
      isRemote: job.isRemote || false,
      isActive: job.isActive,
      isPromoted: job.isPromoted || false,
      viewsCount: job.viewsCount,
      applicationsCount: job._count.applications,
      createdAt: job.createdAt.toISOString(),
      expiresAt: job.expiresAt?.toISOString(),
      skills: [] as string[]
    }))

    return NextResponse.json({ jobs: transformedJobs })
  } catch (error) {
    console.error('Error fetching company jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}