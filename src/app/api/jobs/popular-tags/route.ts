import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get most used skills from jobs
    const jobSkills = await db.jobSkill.findMany({
      include: {
        skill: {
          select: {
            name: true
          }
        }
      }
    })

    // Count skill usage
    const skillCounts = jobSkills.reduce((acc, jobSkill) => {
      const skillName = jobSkill.skill.name
      acc[skillName] = (acc[skillName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array and sort by count
    const sortedSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name]) => name)

    // Add some popular search terms
    const popularTerms = [
      'Senior React', 'Python ML', 'DevOps', 'Удалённо', 'Blockchain', 
      'Moscow', 'Frontend', 'Backend', 'Full Stack', 'Data Science',
      'Remote', 'Junior', 'Middle', 'Senior', 'Vue.js',
      'Node.js', 'AWS', 'Docker', 'TypeScript', 'JavaScript'
    ]

    // Combine and remove duplicates, limit to top 15
    const allTags = [...sortedSkills, ...popularTerms]
    const uniqueTags = [...new Set(allTags)].slice(0, 15)

    return NextResponse.json({
      tags: uniqueTags
    })

  } catch (error) {
    console.error('Error fetching popular tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}