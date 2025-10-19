import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import CareerMapEngine from '@/lib/career-map/CareerMapEngine'
import { llmChat, tryParseJson } from '@/lib/llm'
import { db } from '@/lib/db'
// Z.AI удалён. Доп. аннотация отключена.

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session as any)?.user?.id as string | undefined
    if (!userId && process.env.TEST_MODE === '1') {
      try {
        const email = request.headers.get('x-test-user-email') || ''
        if (email) {
          const u = await db.user.findUnique({ where: { email } })
          userId = u?.id
          if (!userId) {
            const alt = await db.user.findFirst({ where: { role: 'CANDIDATE' } })
            userId = alt?.id
          }
        }
        if (!userId) {
          const altAny = await db.user.findFirst()
          userId = altAny?.id
        }
      } catch {}
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const engine = new CareerMapEngine()
    const base = await engine.generateCareerRecommendation(userId)
    if (!base) {
      return NextResponse.json({ error: 'No recommendation' }, { status: 404 })
    }

    if (process.env.AI_OFFLINE_ONLY === '1') {
      return NextResponse.json({ error: 'AI is disabled by AI_OFFLINE_ONLY=1' }, { status: 503 })
    }
    try {
      const sys = 'You summarize career recommendations and propose 3 concrete next steps. Output JSON {summary, next_steps[]} in Russian.'
      const prompt = `CAREER MAP BASE:\n${JSON.stringify(base).slice(0, 6000)}\nReturn strictly JSON.`
      const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, timeoutMs: 3500 })
      const parsed = tryParseJson(out)
      if (!parsed.ok || !parsed.data) return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
      return NextResponse.json({ ok: true, data: base, ai: parsed.data })
    } catch {
      return NextResponse.json({ error: 'LLM unavailable' }, { status: 502 })
    }
  } catch (error) {
    console.error('Error getting career recommendation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    let userId = (session as any)?.user?.id as string | undefined
    if (!userId && process.env.TEST_MODE === '1') {
      try {
        const email = (await (await import('next/headers')).headers()).get('x-test-user-email') || ''
        if (email) {
          const u = await db.user.findUnique({ where: { email } })
          userId = u?.id
        }
        if (!userId) {
          const alt = await db.user.findFirst({ where: { role: 'CANDIDATE' } })
          userId = alt?.id || (await db.user.findFirst())?.id
        }
      } catch {}
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { targetIndustry } = body || {}

    const engine = new CareerMapEngine()
    const base = await engine.generateCareerRecommendation(userId, targetIndustry)
    if (!base) {
      return NextResponse.json({ error: 'No recommendation' }, { status: 404 })
    }
    if (process.env.AI_OFFLINE_ONLY === '1') {
      return NextResponse.json({ error: 'AI is disabled by AI_OFFLINE_ONLY=1' }, { status: 503 })
    }
    try {
      const sys = 'You summarize career recommendations and propose 3 concrete next steps. Output JSON {summary, next_steps[]} in Russian.'
      const prompt = `CAREER MAP BASE:\n${JSON.stringify(base).slice(0, 6000)}\nReturn strictly JSON.`
      const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, timeoutMs: 3500 })
      const parsed = tryParseJson(out)
      if (!parsed.ok || !parsed.data) return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
      return NextResponse.json({ ok: true, data: base, ai: parsed.data })
    } catch {
      return NextResponse.json({ error: 'LLM unavailable' }, { status: 502 })
    }
  } catch (error) {
    console.error('Error generating career recommendation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}