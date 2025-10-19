import { NextRequest, NextResponse } from 'next/server'
import { CompanyAnalyticsService } from '@/lib/analytics'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const analytics = await CompanyAnalyticsService.getCompanyAnalytics(id, 30)
    return NextResponse.json(analytics)
  } catch (err) {
    console.error('GET /api/analytics/company/:id error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


