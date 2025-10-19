import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const profile = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        workExperience: true,
        education: true,
        applications: true,
        languages: true
      }
    })

    if (!profile) {
      return NextResponse.json(null)
    }

    // Count views of this candidate's applications
    let applicationViews = await db.applicationView.count({
      where: {
        application: { candidateId: profile?.id || '' }
      }
    })

    // Fallback: если логирование просмотров включилось недавно,
    // посчитаем как минимум количество откликов в статусе REVIEWED
    if (applicationViews === 0 && profile?.id) {
      const reviewedCount = await db.application.count({
        where: { candidateId: profile.id, status: 'REVIEWED' }
      })
      applicationViews = reviewedCount
    }

    // Проставим абсолютный URL аватара, если есть файл
    const avatarUrl = profile.user?.avatar
      ? `/api/profile/avatar?f=${encodeURIComponent(profile.user.avatar)}`
      : ''

    return NextResponse.json({
      ...profile,
      user: {
        ...profile.user,
        avatar: avatarUrl,
      },
      analytics: { applicationViews },
      presence: {
        online: true,
        lastSeenAt: profile.user?.lastSeenAt || null
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Update basic user fields if provided (name/email)
    try {
      if (data.userName || data.userEmail) {
        await db.user.update({
          where: { id: (session.user as any).id },
          data: {
            ...(data.userName ? { name: data.userName } : {}),
            ...(data.userEmail ? { email: data.userEmail } : {}),
          },
        })
      }
    } catch (e) {
      // Ignore user update errors here; main profile update will still proceed
      console.warn('User update skipped:', e)
    }

    // Check if profile exists
    const existingProfile = await db.candidateProfile.findUnique({
      where: { userId: session.user.id }
    })

    let profile

    if (existingProfile) {
      // Update existing profile
      profile = await db.candidateProfile.update({
        where: { userId: session.user.id },
        data: {
          title: data.title,
          bio: data.bio,
          location: data.location,
          phone: data.phone || undefined,
          website: data.website,
          linkedin: data.linkedin,
          github: data.github,
          portfolio: data.portfolio,
          experience: data.experience ? parseInt(data.experience) : null,
          salaryMin: data.salaryMin ? parseInt(data.salaryMin) : null,
          salaryMax: data.salaryMax ? parseInt(data.salaryMax) : null,
          currency: data.currency || 'RUB',
          preferences: data.preferences ? data.preferences : undefined
        }
      })

      // Handle skills update
      if (data.skills) {
        // Delete existing skills
        await db.candidateSkill.deleteMany({
          where: { candidateId: existingProfile.id }
        })

        // Create new skills
        for (const skillData of data.skills) {
          if (skillData.skill?.name) {
            // Find or create skill
            let skill = await db.skill.findUnique({
              where: { name: skillData.skill.name }
            })

            if (!skill) {
              skill = await db.skill.create({
                data: {
                  name: skillData.skill.name,
                  category: skillData.skill.category || 'General'
                }
              })
            }

            // Create candidate skill
            await db.candidateSkill.create({
              data: {
                candidateId: existingProfile.id,
                skillId: skill.id,
                level: skillData.level || 3
              }
            })
          }
        }
      }

      // update languages
      if (Array.isArray(data.languages)) {
        await db.candidateLanguage.deleteMany({ where: { candidateId: existingProfile.id } })
        for (const lang of data.languages) {
          if (!lang?.name) continue
          await db.candidateLanguage.create({
            data: {
              candidateId: existingProfile.id,
              name: lang.name,
              level: (lang.level as any) || 'B1',
            }
          })
        }
      }

      // Handle work experience update
      if (data.workExperience) {
        // Delete existing experience
        await db.experience.deleteMany({
          where: { candidateId: existingProfile.id }
        })

        // Create new experience
        for (const exp of data.workExperience) {
          if (exp.title && exp.company) {
            await db.experience.create({
              data: {
                candidateId: existingProfile.id,
                title: exp.title,
                company: exp.company,
                description: exp.description,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: exp.isCurrent || false
              }
            })
          }
        }
      }

      // Handle education update
      if (data.education) {
        // Delete existing education
        await db.education.deleteMany({
          where: { candidateId: existingProfile.id }
        })

        // Create new education
        for (const edu of data.education) {
          if (edu.institution) {
            await db.education.create({
              data: {
                candidateId: existingProfile.id,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field,
                startDate: new Date(edu.startDate),
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                isCurrent: edu.isCurrent || false
              }
            })
          }
        }
      }
    } else {
      // Create new profile
      profile = await db.candidateProfile.create({
        data: {
          userId: session.user.id,
          title: data.title,
          bio: data.bio,
          location: data.location,
          phone: data.phone || undefined,
          website: data.website,
          linkedin: data.linkedin,
          github: data.github,
          portfolio: data.portfolio,
          experience: data.experience ? parseInt(data.experience) : null,
          salaryMin: data.salaryMin ? parseInt(data.salaryMin) : null,
          salaryMax: data.salaryMax ? parseInt(data.salaryMax) : null,
          currency: data.currency || 'RUB',
          preferences: data.preferences ? data.preferences : undefined
        }
      })

      // Handle skills creation
      if (data.skills) {
        for (const skillData of data.skills) {
          if (skillData.skill?.name) {
            let skill = await db.skill.findUnique({
              where: { name: skillData.skill.name }
            })

            if (!skill) {
              skill = await db.skill.create({
                data: {
                  name: skillData.skill.name,
                  category: skillData.skill.category || 'General'
                }
              })
            }

            await db.candidateSkill.create({
              data: {
                candidateId: profile.id,
                skillId: skill.id,
                level: skillData.level || 3
              }
            })
          }
        }
      }

      // languages create
      if (Array.isArray(data.languages)) {
        for (const lang of data.languages) {
          if (!lang?.name) continue
          await db.candidateLanguage.create({
            data: {
              candidateId: profile.id,
              name: lang.name,
              level: (lang.level as any) || 'B1',
            }
          })
        }
      }

      // Handle work experience creation
      if (data.workExperience) {
        for (const exp of data.workExperience) {
          if (exp.title && exp.company) {
            await db.experience.create({
              data: {
                candidateId: profile.id,
                title: exp.title,
                company: exp.company,
                description: exp.description,
                startDate: new Date(exp.startDate),
                endDate: exp.endDate ? new Date(exp.endDate) : null,
                isCurrent: exp.isCurrent || false
              }
            })
          }
        }
      }

      // Handle education creation
      if (data.education) {
        for (const edu of data.education) {
          if (edu.institution) {
            await db.education.create({
              data: {
                candidateId: profile.id,
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field,
                startDate: new Date(edu.startDate),
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                isCurrent: edu.isCurrent || false
              }
            })
          }
        }
      }
    }

    // Fetch updated profile with relations
    const updatedProfile = await db.candidateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        workExperience: true,
        education: true,
        languages: true,
        resumes: true
      }
    })

    return NextResponse.json(updatedProfile, { headers: { 'Cache-Control': 'no-store' } })

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}