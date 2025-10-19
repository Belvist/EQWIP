import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalJobs, totalCompanies, totalCandidates] = await Promise.all([
      db.job.count({ where: { isActive: true } }),
      db.employerProfile.count(),
      db.user.count({ where: { role: 'CANDIDATE' as any } }),
    ])

    return NextResponse.json({ totalJobs, totalCompanies, totalCandidates }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (e) {
    console.error('stats error', e)
    return NextResponse.json({ totalJobs: 0, totalCompanies: 0, totalCandidates: 0 }, { status: 500 })
  }
}


