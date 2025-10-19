export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { llmChat, tryParseJson } from '@/lib/llm'
import { db } from '@/lib/db'
import CareerMapEngine from '@/lib/career-map/CareerMapEngine'

async function searchWebUnified(query: string): Promise<Array<{ url: string; excerpt: string }>> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY
  const BING_API_KEY = process.env.BING_API_KEY
  try {
    if (process.env.AI_OFFLINE_ONLY === '1') return []
    if (TAVILY_API_KEY) {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_API_KEY, query, search_depth: 'basic', include_answer: false, max_results: 5 })
      })
      if (r.ok) {
        const j: any = await r.json()
        if (Array.isArray(j.results)) {
          return j.results.slice(0, 5).map((it: any) => ({ url: String(it.url || ''), excerpt: String(it.content || it.snippet || '').slice(0, 1200) })).filter(s => s.url)
        }
      }
    }
  } catch {}
  try {
    if (process.env.AI_OFFLINE_ONLY !== '1' && BING_API_KEY) {
      const r = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY as string }
      })
      if (r.ok) {
        const j: any = await r.json()
        const items = (j?.webPages?.value || []).slice(0, 5)
        const out: Array<{ url: string; excerpt: string }> = []
        for (const it of items) {
          const url = String(it.url || '')
          const excerpt = String(it.snippet || '')
          if (url) out.push({ url, excerpt: excerpt.slice(0, 1200) })
        }
        if (out.length) return out
      }
    }
  } catch {}
  try {
    const url = `https://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(query)}`
    const r = await fetch(url, { cache: 'no-store' })
    const text = await r.text()
    const urlMatches = text.match(/https?:\/\/[^\s"')]+/g) || []
    const validUrls = urlMatches.filter(u => {
      try {
        const uo = new URL(u)
        return uo.hostname !== 'localhost' && uo.hostname !== '127.0.0.1' && !uo.hostname.includes('bing.com') && !uo.hostname.includes('microsoft.com') && !uo.hostname.includes('r.jina.ai') && uo.hostname.length > 0
      } catch { return false }
    }).slice(0, 5)
    const out: Array<{ url: string; excerpt: string }> = []
    for (const u of validUrls) {
      try {
        const proxyUrl = `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`
        const r2 = await fetch(proxyUrl, { cache: 'no-store' })
        if (r2.ok) {
          const excerpt = (await r2.text()).slice(0, 1200)
          out.push({ url: u, excerpt })
        }
      } catch {}
    }
    return out
  } catch { return [] }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    if (url.searchParams.get('health') === '1') {
      return NextResponse.json({ ok: true })
    }

    let userId: string | undefined
    try {
      const session = await getServerSession(authOptions)
      userId = (session as any)?.user?.id as string | undefined
    } catch {}
    if (!userId && process.env.TEST_MODE === '1') {
      const email = request.headers.get('x-test-user-email') || ''
      if (email) {
        try {
          const u = await db.user.findUnique({ where: { email } })
          userId = u?.id
        } catch {}
      }
    }
    if (!userId && process.env.TEST_MODE !== '1') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.AI_OFFLINE_ONLY === '1') {
      return NextResponse.json({ error: 'AI is disabled by AI_OFFLINE_ONLY=1' }, { status: 503 })
    }

    const fast = url.searchParams.get('fast') === '1'

    let sources: Array<{ url: string; excerpt: string }> = []
    if (!fast) {
      try {
        sources = await searchWebUnified('востребованные IT специальности 2025 Россия навыки список')
      } catch {}
    }
    const limited = sources.slice(0, 3).map(s => ({ url: s.url, excerpt: (s.excerpt || '').slice(0, 600) }))

    const sys = 'Ты карьерный консультант. Если есть выдержки — используй их. Отвечай кратко.'
    const body = limited.length ? `ИСТОЧНИКИ:\n${limited.map(s => `- ${s.url}: ${s.excerpt}`).join('\n')}` : 'ИСТОЧНИКИ: —'

    const timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS || '12000')

    if (fast) {
      // Быстрый режим: строим причины на основе БД и профиля без LLM
      try {
        const engine = new CareerMapEngine()
        // Попытаться вывести индустрию/пути по профилю
        const rec = await engine.generateCareerRecommendation(String(userId))
        const userSkills = await engine.getUserSkills(String(userId))
        const have = new Set(userSkills.map(s => s.name.toLowerCase()))
        const topRoles = (rec?.careerPath || []).slice(0, 5)

        // Если локальный рынок пуст/скуден — опираемся на внешний рынок (web)
        const totalJobsAll = await db.job.count({ where: { isActive: true } })
        const rolesCatalog = [
          { title: 'Разработчик ПО', key: 'developer' },
          { title: 'QA Engineer', key: 'qa' },
          { title: 'DevOps Engineer', key: 'devops' },
          { title: 'Data Analyst', key: 'data' },
          { title: 'UI/UX Designer', key: 'uiux' },
        ]
        const skillsByRole: Record<string, string[]> = {
          developer: ['python', 'git', 'sql', 'docker', 'linux'],
          qa: ['testing', 'test automation', 'selenium', 'jira', 'sql'],
          devops: ['docker', 'kubernetes', 'ci/cd', 'linux', 'terraform'],
          data: ['sql', 'excel', 'python', 'tableau', 'power bi'],
          uiux: ['figma', 'ux research', 'ui design', 'prototyping', 'html', 'css'],
        }

        const rolesScored: Array<{ title: string; why: string; score: number }> = []
        const missingAgg = new Map<string, { count: number; reason: string }>()

        const useExternal = topRoles.length === 0 || totalJobsAll < 10
        if (useExternal) {
          for (const r of rolesCatalog) {
            const req = skillsByRole[r.key] || []
            let overlap = 0
            const present: string[] = []
            const missing: string[] = []
            for (const sk of req) {
              if (have.has(sk.toLowerCase())) { overlap++; present.push(sk) } else { missing.push(sk) }
            }
            const sources = await searchWebUnified(`${r.title} вакансии рынок 2025 Россия`)
            const missingTop = missing.slice(0, 3)
            for (const m of missingTop) {
              const cur = missingAgg.get(m) || { count: 0, reason: `Часто требуется для ${r.title}` }
              cur.count += 1
              missingAgg.set(m, cur)
            }
            const months = Math.max(2, Math.round(missing.length * 1.5))
            const why = `Рынок (web): найдено ~${Math.max(sources.length, 3)} релевантных публикаций; навыки: совпало ${overlap}/${req.length}${present.length ? ` (${present.slice(0,3).join(', ')})` : ''}; не хватает: ${missingTop.join(', ') || '—'}; оценка до готовности: ~${months} нед.`
            const demandScore = Math.min(1, Math.max(0.3, sources.length / 5))
            const skillScore = req.length ? overlap / req.length : 0
            const score = demandScore * 0.6 + skillScore * 0.4
            rolesScored.push({ title: r.title, why, score })
          }
        } else {
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          for (const role of topRoles) {
            const token = String(role.title || '').split(/\s+/)[0] || ''
            const total = await db.job.count({ where: { isActive: true, title: { contains: token, mode: 'insensitive' } } })
            const last30 = await db.job.count({ where: { isActive: true, createdAt: { gte: since }, title: { contains: token, mode: 'insensitive' } } })

            const req = role.requiredSkills || []
            let overlap = 0
            const present: string[] = []
            const missing: string[] = []
            for (const sk of req) {
              if (have.has(sk.toLowerCase())) { overlap++; present.push(sk) } else { missing.push(sk) }
            }
            const missingTop = missing.slice(0, 3)
            for (const m of missingTop) {
              const cur = missingAgg.get(m) || { count: 0, reason: `Нужен для роли ${role.title}` }
              cur.count += 1
              missingAgg.set(m, cur)
            }
            const months = Math.max(2, Math.round(missing.length * 1.5))
            const salary = role.averageSalary ? `${role.averageSalary.toLocaleString('ru-RU')} ₽ (ср.)` : '—'
            const why = `Спрос: ${total} вакансий (${last30} за 30 дн.); навыки: совпало ${overlap}/${req.length}${present.length ? ` (${present.slice(0,3).join(', ')})` : ''}; не хватает: ${missingTop.join(', ') || '—'}; ЗП: ${salary}; оценка до готовности: ~${months} нед.`
            const demandScore = Math.min(1, (total > 0 ? Math.log10(total + 1) / 2 : 0.3)) * (last30 > 0 ? 1 : 0.8)
            const skillScore = req.length ? overlap / req.length : 0
            const score = demandScore * 0.6 + skillScore * 0.4
            rolesScored.push({ title: role.title, why, score })
          }
        }

        const rolesOut = rolesScored
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(r => ({ title: r.title, why: r.why }))

        const skills_to_add = Array.from(missingAgg.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8)
          .map(([skill, info]) => ({ skill, reason: info.reason }))

        return NextResponse.json({ ok: true, sources: useExternal ? [] : undefined, ai: { roles: rolesOut, skills_to_add } })
      } catch (e: any) {
        return NextResponse.json({ error: 'Assist fast mode failed', detail: String(e?.message || e) }, { status: 500 })
      }
    }

    const prompt = `Предложи 5 подходящих ИТ-специальностей для кандидата без чёткой специализации и перечисли навыки, которые надо добавить в профиль.\n${body}\nВерни строго JSON формата { roles: [{title, why}], skills_to_add: [{skill, reason}] } на русском.`

    try {
      const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, timeoutMs, maxTokens: 128, temperature: 0.1 })
      const parsed = tryParseJson(out)
      if (!parsed.ok || !parsed.data) return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
      return NextResponse.json({ ok: true, sources: limited, ai: parsed.data })
    } catch (e: any) {
      if (process.env.TEST_MODE === '1') {
        return NextResponse.json({ error: 'LLM unavailable', detail: String(e?.message || e) }, { status: 502 })
      }
      return NextResponse.json({ error: 'LLM unavailable' }, { status: 502 })
    }
  } catch (e: any) {
    if (process.env.TEST_MODE === '1') {
      return NextResponse.json({ error: 'Internal server error', detail: String(e?.message || e) }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


