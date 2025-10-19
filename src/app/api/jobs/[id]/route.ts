import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    // Fetch job with employer details
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            description: true,
            logo: true,
            website: true,
            industry: true,
            size: true,
            location: true,
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              }
            }
          }
        },
        _count: {
          select: {
            applications: true,
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.job.update({
      where: { id: jobId },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    })

    // Transform the data to match the expected interface for the job details page
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency || 'USD',
      experienceLevel: job.experienceLevel || 'Not specified',
      employmentType: job.employmentType || 'Full-time',
      workFormat: job.workFormat || 'On-site',
      location: job.location || 'Remote',
      isRemote: job.isRemote || false,
      isActive: job.isActive,
      isPromoted: job.isPromoted || false,
      viewsCount: job.viewsCount,
      applicationsCount: job._count.applications,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      expiresAt: job.expiresAt?.toISOString(),
      skills: job.skills.map(js => js.skill.name),
      company: {
        id: job.employer.id,
        name: job.employer.companyName,
        description: job.employer.description || '',
        logo: job.employer.logo ? `/api/profile/company-logo?f=${encodeURIComponent(job.employer.logo)}` : '',
        website: job.employer.website,
        industry: job.employer.industry || 'Technology',
        size: job.employer.size || '50-200',
        location: job.employer.location || 'Remote',
      }
    }

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id
    const payload = await request.json().catch(() => ({}))

    // Allow only a safe subset of fields to be updated
    const allowed: any = {}
    const keys: Array<keyof typeof payload> = [
      'title',
      'description',
      'requirements',
      'responsibilities',
      'benefits',
      'salaryMin',
      'salaryMax',
      'currency',
      'experienceLevel',
      'employmentType',
      'workFormat',
      'location',
      'isRemote',
      'isActive',
      'expiresAt',
    ] as any
    for (const k of keys) {
      if (k in payload) allowed[k] = payload[k]
    }

    const updated = await db.job.update({
      where: { id: jobId },
      data: allowed,
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            description: true,
            logo: true,
            website: true,
            industry: true,
            size: true,
            location: true,
          }
        },
        skills: {
          include: { skill: { select: { id: true, name: true, category: true } } }
        },
        _count: { select: { applications: true } }
      }
    })

    const transformed = {
      id: updated.id,
      title: updated.title,
      description: updated.description || '',
      requirements: updated.requirements || '',
      responsibilities: updated.responsibilities || '',
      benefits: updated.benefits || '',
      salaryMin: updated.salaryMin,
      salaryMax: updated.salaryMax,
      currency: updated.currency || 'USD',
      experienceLevel: updated.experienceLevel || 'Not specified',
      employmentType: updated.employmentType || 'Full-time',
      workFormat: updated.workFormat || 'On-site',
      location: updated.location || 'Remote',
      isRemote: updated.isRemote || false,
      isActive: updated.isActive,
      isPromoted: updated.isPromoted || false,
      viewsCount: updated.viewsCount,
      applicationsCount: updated._count.applications,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      expiresAt: updated.expiresAt?.toISOString(),
      skills: updated.skills.map(js => js.skill.name),
      company: {
        id: updated.employer.id,
        name: updated.employer.companyName,
        description: updated.employer.description || '',
        logo: updated.employer.logo,
        website: updated.employer.website,
        industry: updated.employer.industry || 'Technology',
        size: updated.employer.size || '50-200',
        location: updated.employer.location || 'Remote',
      }
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id
    await db.job.delete({ where: { id: jobId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}