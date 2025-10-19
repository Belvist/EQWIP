import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
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

    const employerId = params.id
    const userId = session.user.id

    // Check if user is already following the company
    const existingFollow = await db.companyFollow.findUnique({
      where: {
        userId_employerId: {
          userId: userId,
          employerId: employerId
        }
      }
    })

    if (existingFollow) {
      // Unfollow
      await db.companyFollow.delete({
        where: {
          userId_employerId: {
            userId: userId,
            employerId: employerId
          }
        }
      })
      
      return NextResponse.json({ 
        message: 'Unfollowed successfully',
        isFollowing: false 
      })
    } else {
      // Follow
      await db.companyFollow.create({
        data: {
          userId: userId,
          employerId: employerId
        }
      })
      
      return NextResponse.json({ 
        message: 'Followed successfully',
        isFollowing: true 
      })
    }
  } catch (error) {
    console.error('Error following/unfollowing company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}