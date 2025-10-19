import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If jobId is provided, return boolean state for a single job
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    if (jobId) {
      // userId in SavedJob links to User.id in schema
      const existing = await db.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId: (session.user as any).id,
            jobId
          }
        }
      })
      return NextResponse.json({ isSaved: !!existing })
    }

    const savedJobs = await db.savedJob.findMany({
      where: {
        userId: (session.user as any).id
      },
      include: {
        job: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true,
                logo: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ savedJobs })
  } catch (error) {
    console.error('Error fetching saved jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id?: string } } = {}
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // support both /api/saved-jobs/:id and /api/saved-jobs?jobId=
    let jobId = params?.id
    if (!jobId) {
      const { searchParams } = new URL(request.url)
      jobId = searchParams.get('jobId') || undefined
    }
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }
    
    await db.savedJob.deleteMany({
      where: {
        userId: (session.user as any).id,
        jobId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check if job is already saved
    const existingSavedJob = await db.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: (session.user as any).id,
          jobId: jobId
        }
      }
    })

    if (existingSavedJob) {
      return NextResponse.json(
        { error: 'Job is already saved' },
        { status: 400 }
      )
    }

    // Save the job
    const savedJob = await db.savedJob.create({
      data: {
        userId: (session.user as any).id,
        jobId: jobId
      }
    })

    return NextResponse.json(savedJob)
  } catch (error) {
    console.error('Error saving job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}