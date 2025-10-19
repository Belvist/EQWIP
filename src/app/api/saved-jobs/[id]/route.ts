import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobId = params.id

    // Delete saved job
    await db.savedJob.delete({
      where: {
        candidateId_jobId: {
          candidateId: session.user.id,
          jobId: jobId
        }
      }
    })

    return NextResponse.json({ message: 'Job removed from saved' })
  } catch (error) {
    console.error('Error removing saved job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}