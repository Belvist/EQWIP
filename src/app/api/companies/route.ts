import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const filters = {
      industry: searchParams.get('industry') || '',
      size: searchParams.get('size') || '',
      location: searchParams.get('location') || '',
      rating: searchParams.get('rating') || ''
    }
    const sortBy = searchParams.get('sortBy') || 'relevance'

    // Build the where clause for Prisma
    const where: any = {}

    // Add filters
    if (filters.industry) {
      where.industry = {
        contains: filters.industry,
        mode: 'insensitive'
      }
    }
    if (filters.size) {
      where.size = filters.size
    }
    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive'
      }
    }

    // Add search query
    if (query) {
      where.OR = [
        {
          companyName: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          industry: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Get total count for pagination
    const total = await db.employerProfile.count({ where })

    // Determine sort order
    let orderBy: any = []
    switch (sortBy) {
      case 'name':
        orderBy = [{ companyName: 'asc' }]
        break
      case 'jobs':
        orderBy = [
          {
            jobs: {
              _count: 'desc'
            }
          }
        ]
        break
      default:
        orderBy = [{ companyName: 'asc' }]
    }

    // Fetch companies with related data
    const companies = await db.employerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        jobs: {
          where: {
            isActive: true
          },
          include: {
            skills: {
              include: {
                skill: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Get only recent jobs for preview
        },
        _count: {
          select: {
            jobs: {
              where: {
                isActive: true
              }
            }
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    // Format the response
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      companyName: company.companyName,
      logo: company.logo ? `/api/profile/company-logo?f=${encodeURIComponent(company.logo)}` : '',
      description: company.description,
      industry: company.industry,
      size: company.size,
      location: company.location,
      website: company.website,
      jobsCount: company._count.jobs,
      isFeatured: company.jobs.some(job => job.isPromoted),
      isSaved: false, // This would be determined by user's saved companies
      skills: [...new Set(company.jobs.flatMap(job => job.skills.map(js => js.skill.name)))],
      recentJobs: company.jobs.map(job => ({
        id: job.id,
        title: job.title,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        createdAt: job.createdAt.toISOString()
      }))
    }))

    return NextResponse.json({
      companies: formattedCompanies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Companies search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}