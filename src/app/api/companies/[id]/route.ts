import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    // Our actual company data хранится в employerProfile (компания = работодатель)
    const company = await db.employerProfile.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected interface
    const transformedCompany = {
      id: company.id,
      name: company.companyName,
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || 'Technology',
      size: company.size || '50-200',
      location: company.location || 'Remote',
      logo: company.logo ? `/api/profile/company-logo?f=${encodeURIComponent(company.logo)}` : '',
      reviewsCount: 0,
      isActive: true,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString()
    }

    return NextResponse.json(transformedCompany)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}