import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')
    const promoted = searchParams.get('promoted') === 'true'
    const popular = searchParams.get('popular') === 'true'

    const where: any = {
      isActive: true,
    }

    if (promoted) {
      where.isPromoted = true
    }

    const jobs = await db.job.findMany({
      where,
      include: {
        employer: {
          select: {
            companyName: true,
            logo: true
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true,
            savedJobs: true
          }
        }
      },
      orderBy: popular
        ? [{ viewsCount: 'desc' }]
        : [{ isPromoted: 'desc' }, { createdAt: 'desc' }],
      take: limit
    })

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      employmentType: job.employmentType,
      workFormat: job.workFormat,
      location: job.location,
      isRemote: job.isRemote,
      isPromoted: job.isPromoted,
      companyName: job.employer.companyName,
      // normalize logo to URL if present
      companyLogo: job.employer.logo ? `/api/profile/company-logo?f=${encodeURIComponent(job.employer.logo)}` : '',
      createdAt: job.createdAt.toISOString(),
      skills: job.skills.map(js => js.skill.name),
      applicationsCount: job._count.applications,
      savedCount: job._count.savedJobs
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      total: formattedJobs.length
    })

  } catch (error) {
    console.error('Error fetching featured jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}