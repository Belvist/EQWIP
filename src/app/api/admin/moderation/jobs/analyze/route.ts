import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { llmChat } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only ADMIN
    const userId = (session.user as any).id
    const me = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!me || String(me.role) !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { jobIds } = await request.json()
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'Invalid jobIds' }, { status: 400 })
    }

    // Получаем вакансии с полной информацией
    const jobs = await db.job.findMany({
      where: { id: { in: jobIds } },
      include: {
        employer: { 
          select: { 
            companyName: true, 
            description: true, 
            industry: true,
            size: true,
            location: true
          } 
        },
        skills: {
          include: { skill: { select: { name: true, category: true } } }
        }
      }
    })

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Jobs not found' }, { status: 404 })
    }

    // AI анализ каждой вакансии
    const analyses = await Promise.all(jobs.map(async (job) => {
      try {
        const skillsList = job.skills.map(js => js.skill.name).join(', ')
        const companyInfo = `${job.employer?.companyName || 'Неизвестная компания'} (${job.employer?.industry || 'Не указана отрасль'})`
        
        const prompt = `Проанализируй вакансию для модерации. Оцени качество, соответствие стандартам и дай рекомендации.

ВАКАНСИЯ:
- Компания: ${companyInfo}
- Должность: ${job.title}
- Описание: ${job.description || 'Не указано'}
- Требования: ${job.requirements || 'Не указаны'}
- Обязанности: ${job.responsibilities || 'Не указаны'}
- Навыки: ${skillsList || 'Не указаны'}
- Зарплата: ${job.salaryMin ? `${job.salaryMin}-${job.salaryMax || 'не указано'}` : 'Не указана'}
- Локация: ${job.location || 'Не указана'}
- Формат работы: ${job.workFormat || 'Не указан'}

Верни строго JSON с анализом:
{
  "overallScore": 85,
  "recommendation": "approve|reject|needs_revision",
  "issues": [
    {
      "type": "content_quality|salary|requirements|company|other",
      "severity": "low|medium|high",
      "message": "Описание проблемы",
      "suggestion": "Как исправить"
    }
  ],
  "strengths": [
    "Что хорошо в вакансии"
  ],
  "qualityMetrics": {
    "contentCompleteness": 80,
    "salaryTransparency": 60,
    "requirementsClarity": 90,
    "companyCredibility": 85
  },
  "aiSummary": "Краткое резюме анализа на 2-3 предложения"
}`

        const analysis = await llmChat(prompt, {
          model: process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b-instruct',
          json: true,
          temperature: 0.1,
          maxTokens: 1000,
          timeoutMs: 15000
        })

        const parsed = JSON.parse(analysis)
        
        return {
          jobId: job.id,
          analysis: {
            ...parsed,
            analyzedAt: new Date().toISOString()
          }
        }
      } catch (error) {
        console.error(`AI analysis error for job ${job.id}:`, error)
        return {
          jobId: job.id,
          analysis: {
            overallScore: 0,
            recommendation: 'error',
            issues: [{
              type: 'other',
              severity: 'high',
              message: 'Ошибка анализа',
              suggestion: 'Попробуйте еще раз'
            }],
            strengths: [],
            qualityMetrics: {
              contentCompleteness: 0,
              salaryTransparency: 0,
              requirementsClarity: 0,
              companyCredibility: 0
            },
            aiSummary: 'Не удалось проанализировать вакансию',
            analyzedAt: new Date().toISOString()
          }
        }
      }
    }))

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error('AI moderation analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
