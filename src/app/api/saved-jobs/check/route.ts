import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ isSaved: false })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if job is saved
    const savedJob = await db.savedJob.findUnique({
      where: {
        candidateId_jobId: {
          candidateId: session.user.id,
          jobId: jobId
        }
      }
    })

    return NextResponse.json({ isSaved: !!savedJob })
  } catch (error) {
    console.error('Error checking saved job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}