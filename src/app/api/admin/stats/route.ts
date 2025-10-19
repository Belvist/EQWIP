import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (range) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get basic stats
    // pendingReports: number of job postings awaiting moderation (isActive = false)
    // flaggedContent: notifications of type SYSTEM that are unread since the selected range
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      pendingReports,
      flaggedContent
    ] = await Promise.all([
      db.user.count(),
      db.job.count(),
      db.application.count(),
      db.job.count({
        where: { isActive: false }
      }),
      db.notification.count({
        where: {
          type: 'SYSTEM',
          isRead: false,
          createdAt: {
            gte: startDate
          }
        }
      })
    ])

    // Get active users (users who logged in or had activity in the last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    // Прямой фильтр по updatedAt пользователя (без ошибочных some на 1:1 связях)
    const activeUsers = await db.user.count({
      where: { updatedAt: { gte: thirtyDaysAgo } }
    })

    // Get today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [newUsersToday, newJobsToday] = await Promise.all([
      db.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      db.job.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ])

    // Get user growth data for charts
    const userGrowth = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get job growth data
    const jobGrowth = await db.job.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get application growth data
    const applicationGrowth = await db.application.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get role distribution
    const roleDistribution = await db.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    // Get top skills
    const topSkills = await db.candidateSkill.groupBy({
      by: ['skillId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    const topSkillsData = await Promise.all(
      topSkills.map(async (skill) => {
        const skillData = await db.skill.findUnique({
          where: { id: skill.skillId }
        })
        return {
          name: skillData?.name || 'Unknown',
          count: skill._count.id
        }
      })
    )

    // Get top companies by job postings
    const topCompanies = await db.job.groupBy({
      by: ['employerId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    const topCompaniesData = await Promise.all(
      topCompanies.map(async (company) => {
        const companyData = await db.employerProfile.findUnique({
          where: { id: company.employerId }
        })
        return {
          name: companyData?.companyName || 'Unknown',
          count: company._count.id
        }
      })
    )

    return NextResponse.json({
      totalUsers,
      totalJobs,
      totalApplications,
      activeUsers,
      newUsersToday,
      newJobsToday,
      pendingReports,
      flaggedContent,
      userGrowth,
      jobGrowth,
      applicationGrowth,
      roleDistribution,
      topSkills: topSkillsData,
      topCompanies: topCompaniesData
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}