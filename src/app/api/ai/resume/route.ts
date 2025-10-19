import { NextRequest, NextResponse } from 'next/server'
import { llmChat, tryParseJson } from '@/lib/llm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/cache'
import { randomUUID } from 'crypto'

// Fire-and-forget warm-up to ensure Ollama pulls/loads the chat model (e.g., Qwen)
function warmOllamaModelInBackground() {
  try {
    const base = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').trim()
    let model = (process.env.GIGACHAT_CHAT_MODEL || 'GigaChat:latest').trim()
    const disabled = ['off', 'disabled', 'none', '0']
    if (!base || !model || disabled.includes(model.toLowerCase())) return
    try {
      fetch(`${base}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: false })
      }).catch(() => {})
    } catch {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      llmChat('ping', {
        model,
        timeoutMs: Number(process.env.AI_WARM_TIMEOUT_MS || 1500),
        maxTokens: 8,
        temperature: 0,
        keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h'
      }).catch(() => {})
    } catch {}
  } catch {}
}

function dbg(tag: string, payload?: any) {
  try {
    if (String(process.env.AI_DEBUG || '0') === '1') {
      console.log(tag, payload ?? '')
    }
  } catch {}
}

function normalizeJsonish(input: string): string {
  try {
    let t = String(input || '')
    // Strip code fences
    t = t.replace(/^```\s*json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
    // Keep only substring between first { and last }
    const s = t.indexOf('{')
    const e = t.lastIndexOf('}')
    if (s >= 0 && e > s) t = t.slice(s, e + 1)
    // Replace smart quotes with standard
    t = t.replace(/[\u2018\u2019\u201C\u201D]/g, '"')
    // Remove trailing commas before } or ]
    t = t.replace(/,\s*([}\]])/g, '$1')
    // Remove BOM and non-printable zero-width spaces
    t = t.replace(/[\uFEFF\u200B\u200C\u200D]/g, '')
    return t
  } catch {
    return String(input || '')
  }
}

function isLikelyTextUrl(u: string): boolean {
  try {
    const url = new URL(String(u))
    const host = url.hostname.toLowerCase()
    const path = url.pathname.toLowerCase()
    const ext = path.split('.').pop() || ''
    const imgExts = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'ico', 'bmp'])
    if (imgExts.has(ext)) return false
    if (host.includes('cdn.sapphire.microsoftapp.net')) return false
    if (host.includes('static.wixstatic.com')) return false
    if (host === 'blob' || u.startsWith('blob:')) return false
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    let sessionEmail = session?.user?.email || ''
    // Test-mode fallback for local e2e: allow header-based user selection
    if (!sessionEmail && process.env.TEST_MODE === '1') {
      try {
        const testEmail = request.headers.get('x-test-user-email')
        if (testEmail) sessionEmail = testEmail
      } catch {}
    }
    if (!sessionEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { resumeText, action, jobDescription, jobId, targetRole, tone, length, webResults, async: wantAsyncFlag } = data // action: 'parse', 'optimize', 'analyze', 'cover'

    const user = await db.user.findUnique({
      where: { email: sessionEmail },
      include: {
        candidateProfile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const safeParse = tryParseJson

    if (action === 'parse') {
      if (process.env.AI_OFFLINE_ONLY === '1') {
        return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })
      }
      try {
        warmOllamaModelInBackground()
        const sys = 'You are a strict resume parser. Output compact JSON with fields: name, email, phone, skills[], experience[{title,company,from,to,skills[]}], education[{institution,degree,year}], summary.'
        const prompt = `Parse the following resume text into JSON. Only JSON in reply.\n\nRESUME:\n${String(resumeText || '').slice(0, 6000)}`
        const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 30000) })
        let parsed = safeParse(out)
        if (!parsed.ok) {
          const out2 = await llmChat(prompt + `\n\nReturn ONLY JSON without any preface or code fences.`, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 30000) })
          parsed = safeParse(out2)
        }
        if (parsed.ok) return NextResponse.json({ parsedResume: parsed.data, message: 'Resume parsed (LLM)' })
      } catch {}
      return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })

    } else if (action === 'optimize') {
      if (process.env.AI_OFFLINE_ONLY === '1') {
        return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })
      }
      const forceAsync = String(process.env.AI_RESUME_ASYNC || '1') === '1'
      const wantAsync = forceAsync || wantAsyncFlag === true || request.headers.get('x-async') === '1'
      // Сбор источников из веба и TikTok + LLM-оптимизация с конкретными рекомендациями
      const fetchText = async (url: string): Promise<string> => {
        try {
          if (process.env.AI_OFFLINE_ONLY === '1') return ''
          if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return ''
          const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`
          const r = await fetch(proxyUrl, { cache: 'no-store' })
          if (!r.ok) return ''
          const t = await r.text()
          return t.slice(0, 4000)
        } catch {
          return ''
        }
      }

      const TAVILY_API_KEY = process.env.TAVILY_API_KEY
      const BING_API_KEY = process.env.BING_API_KEY

      const searchWebUnified = async (query: string): Promise<Array<{ url: string; excerpt: string }>> => {
        if (process.env.AI_OFFLINE_ONLY === '1') return []
        if (TAVILY_API_KEY) {
          try {
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
          } catch {}
        }
        if (BING_API_KEY) {
          try {
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
          } catch {}
        }
        try {
          const url = `https://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(query)}`
          const r = await fetch(url, { cache: 'no-store' })
          const text = await r.text()
          const urlMatches = text.match(/https?:\/\/[^\s"')]+/g) || []
          const validUrls = urlMatches.filter(u => {
            try {
              const uo = new URL(u)
              return (
                uo.hostname !== 'localhost' &&
                uo.hostname !== '127.0.0.1' &&
                !uo.hostname.includes('bing.com') &&
                !uo.hostname.includes('microsoft.com') &&
                !uo.hostname.includes('r.jina.ai') &&
                uo.hostname.length > 0 &&
                isLikelyTextUrl(u)
              )
            } catch { return false }
          }).slice(0, 5)
          const out: Array<{ url: string; excerpt: string }> = []
          for (const u of validUrls) {
            try {
              const excerpt = await fetchText(u)
              if (excerpt) out.push({ url: u, excerpt })
            } catch {}
          }
          return out
        } catch {
          return []
        }
      }

      const searchTikTok = async (query: string): Promise<Array<{ url: string; excerpt: string }>> => {
        const q = `site:tiktok.com ${query}`
        const items = await searchWebUnified(q)
        // Простая фильтрация доменов tiktok
        return items.filter(it => /tiktok\.com/i.test(it.url)).slice(0, 4)
      }

      let jd: string | null = null
      try {
        if (typeof jobDescription === 'string' && jobDescription.trim().length > 10) {
          jd = jobDescription.trim()
        } else if (jobId) {
          const job = await db.job.findUnique({ where: { id: String(jobId) } })
          if (job?.description) jd = `${job.title || ''}\n${job.description}\nRequirements:${job.requirements || ''}`
        } else if (typeof targetRole === 'string' && targetRole.trim()) {
          jd = `Target Role: ${targetRole.trim()}`
        }
      } catch {}

      let roleSources: Array<{ url: string; excerpt: string }> = []
      let roleSourcesByRole: Record<string, Array<{ url: string; excerpt: string }>> = {}
      let tiktokSources: Array<{ url: string; excerpt: string }> = []

      let resumeObj: any = {}
      try { resumeObj = JSON.parse(resumeText) } catch {}
      const titles = new Set<string>()
      if (targetRole && typeof targetRole === 'string' && targetRole.trim().length > 0) titles.add(targetRole.trim())
      if (jd && jd.toLowerCase().includes('target role:')) {
        const role = jd.replace(/^Target Role:\s*/i, '').trim()
        if (role.length > 0) titles.add(role)
      }
      const exp = Array.isArray(resumeObj?.experience) ? resumeObj.experience : []
      for (const e of exp) {
        if (e?.title && typeof e.title === 'string' && e.title.trim().length > 0) titles.add(e.title.trim())
      }
      const rolesToAnalyze = Array.from(titles).filter(role => role && role.length > 0).slice(0, 5)
      if (rolesToAnalyze.length === 0) {
        const found = await searchWebUnified('resume improvement tips key metrics measurable achievements')
        roleSources.push(...found.slice(0, 3))
        const tt = await searchTikTok('как улучшить резюме советы кратко примеры достижений')
        tiktokSources.push(...tt.slice(0, 3))
      } else {
        for (const roleName of rolesToAnalyze) {
          const found = await searchWebUnified(`${roleName} resume tips key metrics KPIs measurable achievements`)
          const top = found.slice(0, 3)
          roleSources.push(...top)
          if (top.length) roleSourcesByRole[roleName] = top
          const tt = await searchTikTok(`${roleName} резюме советы примеры достижений`)
          if (tt.length) tiktokSources.push(...tt.slice(0, 2))
        }
      }

      // Включаем webResults, если пришли с клиента (например, фронт сделал предварительный поиск)
      const clientWebResults: string = typeof webResults === 'string' ? webResults : ''
      const sourcesText = [
        clientWebResults,
        ...roleSources.slice(0, 5).map((s, i) => `${i + 1}. ${s.url}\n${s.excerpt.slice(0, 1000)}`),
        ...(tiktokSources.length ? ['TikTok:'] : []),
        ...tiktokSources.slice(0, 4).map((s, i) => `T${i + 1}. ${s.url}\n${s.excerpt.slice(0, 800)}`)
      ].filter(Boolean).join('\n\n')

      // Async job execution (Cloudflare-safe)
      if (wantAsync) {
        const jobIdOut = randomUUID()
        const jobKey = `resume_opt_job:${jobIdOut}`
        const ttl = Number(process.env.AI_RESUME_JOB_TTL_S || 900)
        await cache.set(jobKey, {}, { key: jobKey, ttl }) // initialize key to ensure TTL
        await cache.set(jobKey, { status: 'queued', createdAt: Date.now() }, { key: jobKey, ttl })

        ;(async () => {
          try {
            await cache.set(jobKey, { status: 'processing', startedAt: Date.now() }, { key: jobKey, ttl })

            // reuse logic below: perform LLM call and build optimization
            warmOllamaModelInBackground()
            const sys = [
              'Ты ассистент по улучшению резюме. Дай практичные улучшения кратко и по делу.',
              'Ответ СТРОГО в JSON на русском: {suggestions:[{section,suggested,reason,priority}], keywordOptimizations:[{suggestedKeywords[]}], targetedMetrics:[{area,metric,why,exampleLine}], roleMetricsFromWeb:[{metric,why,example,sourceUrl}], roleMetricsByRole:[{role,metrics:[{metric,why,example,sourceUrl}]}], bullets:[string]}',
              'Приоритезируй «high|medium|low». Метрики должны быть измеримыми. Не выдумывай факты, предлагай шаблонные формулировки с переменными.'
            ].join(' ')
            const roleHint = (targetRole || '').toString().slice(0, 200)
            const jdBlock = jd ? `\nJD:\n${jd.slice(0, 1600)}` : (roleHint ? `\nЦелевая роль: ${roleHint}` : '')
            const prompt = [
              'РЕЗЮМЕ (JSON/текст):',
              String(resumeText || '').slice(0, 3800),
              jdBlock,
              'ИСТОЧНИКИ (веб + TikTok):',
              sourcesText.slice(0, 6000),
              'Сгенерируй СТРОГО JSON по схеме выше. '
            ].join('\n')
            const timeoutMs = Number(process.env.AI_RESUME_OPT_TIMEOUT_MS || process.env.AI_CHAT_TIMEOUT_MS || 60000)
            const maxTokens = Number(process.env.AI_RESUME_OPT_MAXTOKENS || 768)
            const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs, maxTokens })
            let parsed = safeParse(out)
            if (!parsed.ok) {
              const example = '{"suggestions":[{"section":"summary","suggested":"…","reason":"…","priority":"high"}],"keywordOptimizations":[{"suggestedKeywords":["…"]}],"targetedMetrics":[{"area":"Impact","metric":"…","why":"…","exampleLine":"…"}],"roleMetricsFromWeb":[{"metric":"…","why":"…","example":"…","sourceUrl":"…"}],"roleMetricsByRole":[{"role":"…","metrics":[{"metric":"…","why":"…","example":"…","sourceUrl":"…"}]}],"bullets":["…"]}'
              const out2 = await llmChat(prompt + `\n\nТолько JSON. Пример формы: ${example}`, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs, maxTokens })
              parsed = safeParse(out2)
              if (!parsed.ok) {
                const cleaned = normalizeJsonish(String((parsed as any)?.raw || out2 || ''))
                try { parsed = { ok: true, data: JSON.parse(cleaned) } as any } catch {}
              }
            }
            if (!parsed.ok || !parsed.data) throw new Error('LLM JSON parse failed')
            const dataJ = parsed.data || {}
            let suggestions = Array.isArray(dataJ.suggestions) ? dataJ.suggestions.slice(0, 12) : []
            let keywordOptimizations = Array.isArray(dataJ.keywordOptimizations) ? dataJ.keywordOptimizations.slice(0, 2) : []
            let targetedMetrics = Array.isArray(dataJ.targetedMetrics) ? dataJ.targetedMetrics.slice(0, 8) : []
            let roleMetricsFromWeb = Array.isArray(dataJ.roleMetricsFromWeb) ? dataJ.roleMetricsFromWeb.slice(0, 8) : []
            let roleMetricsByRole = Array.isArray(dataJ.roleMetricsByRole) ? dataJ.roleMetricsByRole.slice(0, 5) : []
            let bullets = Array.isArray(dataJ.bullets) ? dataJ.bullets.slice(0, 8) : []

            if (suggestions.length === 0 && bullets.length === 0) {
              const prompt3 = [
                'РЕЗЮМЕ (JSON/текст):',
                String(resumeText || '').slice(0, 3500),
                roleHint ? `\nЦелевая роль: ${roleHint}` : '',
                'Сгенерируй СТРОГО JSON на русском: {"suggestions":[{section,suggested,reason,priority}],"bullets":[string]}',
                'Требования: 8 suggestions (priority: high|medium|low), 6 bullets. Кратко, измеримо.'
              ].filter(Boolean).join('\n')
              const out3 = await llmChat(prompt3, { system: 'Ты карьерный консультант. Строго JSON.', model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs })
              let p3 = safeParse(out3)
              if (!p3.ok) {
                const cleaned3 = normalizeJsonish(String((p3 as any)?.raw || out3 || ''))
                try { p3 = { ok: true, data: JSON.parse(cleaned3) } as any } catch {}
              }
              if (p3.ok && p3.data) {
                suggestions = Array.isArray(p3.data.suggestions) ? p3.data.suggestions.slice(0, 12) : suggestions
                bullets = Array.isArray(p3.data.bullets) ? p3.data.bullets.slice(0, 8) : bullets
              }
            }

            const optimization = {
              sources: [...roleSources, ...tiktokSources].filter(s => isLikelyTextUrl(s.url)).slice(0, 6),
              suggestions,
              keywordOptimizations,
              targetedMetrics,
              roleMetricsFromWeb,
              roleMetricsByRole,
              bullets
            }

            await cache.set(jobKey, { status: 'done', finishedAt: Date.now(), result: { optimization } }, { key: jobKey, ttl })
          } catch (err: any) {
            await cache.set(`resume_opt_job:${jobIdOut}`, { status: 'error', error: String(err?.message || err) }, { key: `resume_opt_job:${jobIdOut}`, ttl: Number(process.env.AI_RESUME_JOB_TTL_S || 900) })
          }
        })()

        return NextResponse.json({ jobId: jobIdOut, status: 'queued' }, { status: 202 })
      }

      try {
        warmOllamaModelInBackground()
        const sys = [
          'Ты ассистент по улучшению резюме. Дай практичные улучшения кратко и по делу.',
          'Ответ СТРОГО в JSON на русском: {suggestions:[{section,suggested,reason,priority}], keywordOptimizations:[{suggestedKeywords[]}], targetedMetrics:[{area,metric,why,exampleLine}], roleMetricsFromWeb:[{metric,why,example,sourceUrl}], roleMetricsByRole:[{role,metrics:[{metric,why,example,sourceUrl}]}], bullets:[string]}',
          'Приоритезируй «high|medium|low». Метрики должны быть измеримыми. Не выдумывай факты, предлагай шаблонные формулировки с переменными.'
        ].join(' ')
        const roleHint = (targetRole || '').toString().slice(0, 200)
        const jdBlock = jd ? `\nJD:\n${jd.slice(0, 1600)}` : (roleHint ? `\nЦелевая роль: ${roleHint}` : '')
        const prompt = [
          'РЕЗЮМЕ (JSON/текст):',
          String(resumeText || '').slice(0, 3800),
          jdBlock,
          'ИСТОЧНИКИ (веб + TikTok):',
          sourcesText.slice(0, 6000),
          'Сгенерируй СТРОГО JSON по схеме выше. '
        ].join('\n')
        const timeoutMs = Number(process.env.AI_RESUME_OPT_TIMEOUT_MS || process.env.AI_CHAT_TIMEOUT_MS || 60000)
        const maxTokens = Number(process.env.AI_RESUME_OPT_MAXTOKENS || 768)
        const t1 = Date.now()
        dbg('AI_RESUME_OPT_START', { model: process.env.GIGACHAT_CHAT_MODEL, timeoutMs })
        const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs, maxTokens })
        dbg('AI_RESUME_OPT_RESP1', { ms: Date.now() - t1, len: String(out || '').length, head: String(out || '').slice(0, 200) })
        let parsed = safeParse(out)
        if (!parsed.ok) {
          const example = '{"suggestions":[{"section":"summary","suggested":"…","reason":"…","priority":"high"}],"keywordOptimizations":[{"suggestedKeywords":["…"]}],"targetedMetrics":[{"area":"Impact","metric":"…","why":"…","exampleLine":"…"}],"roleMetricsFromWeb":[{"metric":"…","why":"…","example":"…","sourceUrl":"…"}],"roleMetricsByRole":[{"role":"…","metrics":[{"metric":"…","why":"…","example":"…","sourceUrl":"…"}]}],"bullets":["…"]}'
          dbg('AI_RESUME_OPT_PARSE1_FAIL', { head: String((parsed as any)?.raw || '').slice(0, 160) })
          const t2 = Date.now()
          const out2 = await llmChat(prompt + `\n\nТолько JSON. Пример формы: ${example}`, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs, maxTokens })
          dbg('AI_RESUME_OPT_RESP2', { ms: Date.now() - t2, len: String(out2 || '').length, head: String(out2 || '').slice(0, 200) })
          parsed = safeParse(out2)
          if (!parsed.ok) {
            // last-chance normalization
            const cleaned = normalizeJsonish(String((parsed as any)?.raw || out2 || ''))
            try {
              const data = JSON.parse(cleaned)
              return NextResponse.json({ optimization: {
                sources: [...roleSources, ...tiktokSources],
                suggestions: Array.isArray(data.suggestions) ? data.suggestions.slice(0, 12) : [],
                keywordOptimizations: Array.isArray(data.keywordOptimizations) ? data.keywordOptimizations.slice(0, 2) : [],
                targetedMetrics: Array.isArray(data.targetedMetrics) ? data.targetedMetrics.slice(0, 8) : [],
                roleMetricsFromWeb: Array.isArray(data.roleMetricsFromWeb) ? data.roleMetricsFromWeb.slice(0, 8) : [],
                roleMetricsByRole: Array.isArray(data.roleMetricsByRole) ? data.roleMetricsByRole.slice(0, 5) : [],
                bullets: Array.isArray(data.bullets) ? data.bullets.slice(0, 8) : []
              } })
            } catch (err: any) {
              dbg('AI_RESUME_OPT_PARSE2_FAIL', { message: String(err?.message || err), head: cleaned.slice(0, 200) })
            }
          }
        }
        if (parsed.ok && parsed.data) {
          const data = parsed.data || {}
          let suggestions = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 12) : []
          let keywordOptimizations = Array.isArray(data.keywordOptimizations) ? data.keywordOptimizations.slice(0, 2) : []
          let targetedMetrics = Array.isArray(data.targetedMetrics) ? data.targetedMetrics.slice(0, 8) : []
          let roleMetricsFromWeb = Array.isArray(data.roleMetricsFromWeb) ? data.roleMetricsFromWeb.slice(0, 8) : []
          let roleMetricsByRole = Array.isArray(data.roleMetricsByRole) ? data.roleMetricsByRole.slice(0, 5) : []
          let bullets = Array.isArray(data.bullets) ? data.bullets.slice(0, 8) : []

          if (
            suggestions.length === 0 &&
            bullets.length === 0
          ) {
            // Second direct pass: требуем конкретные 8 предложений и 6 bullets
            const prompt3 = [
              'РЕЗЮМЕ (JSON/текст):',
              String(resumeText || '').slice(0, 3500),
              roleHint ? `\nЦелевая роль: ${roleHint}` : '',
              'Сгенерируй СТРОГО JSON на русском: {"suggestions":[{section,suggested,reason,priority}],"bullets":[string]}',
              'Требования: 8 suggestions (priority: high|medium|low), 6 bullets. Кратко, измеримо.'
            ].filter(Boolean).join('\n')
            const out3 = await llmChat(prompt3, { system: 'Ты карьерный консультант. Строго JSON.', model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs })
            let p3 = safeParse(out3)
            if (!p3.ok) {
              const cleaned3 = normalizeJsonish(String((p3 as any)?.raw || out3 || ''))
              try { p3 = { ok: true, data: JSON.parse(cleaned3) } as any } catch {}
            }
            if (p3.ok && p3.data) {
              suggestions = Array.isArray(p3.data.suggestions) ? p3.data.suggestions.slice(0, 12) : suggestions
              bullets = Array.isArray(p3.data.bullets) ? p3.data.bullets.slice(0, 8) : bullets
            }
          }

          return NextResponse.json({ optimization: {
            sources: [...roleSources, ...tiktokSources].filter(s => isLikelyTextUrl(s.url)).slice(0, 6),
            suggestions,
            keywordOptimizations,
            targetedMetrics,
            roleMetricsFromWeb,
            roleMetricsByRole,
            bullets
          } })
        }
      } catch (e: any) {
        dbg('AI_RESUME_OPT_ERR', { message: String(e?.message || e), name: String(e?.name || '') })
      }
      return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })

    } else if (action === 'analyze') {
      if (process.env.AI_OFFLINE_ONLY === '1') {
        return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })
      }
      try {
        warmOllamaModelInBackground()
        const sys = 'You analyze candidate resumes vs a target role. Output JSON {summary, strengths[], gaps[], suggestions[]} in Russian, concise.'
        const prompt = `RESUME:\n${String(resumeText || '').slice(0, 4000)}\nTARGET ROLE OR JD:\n${String(jobDescription || targetRole || '').slice(0, 2000)}\nReturn strictly JSON.`
        const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 30000) })
        let parsed = safeParse(out)
        if (!parsed.ok) {
          const out2 = await llmChat(prompt + `\n\nТолько JSON.`, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: true, keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h', timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 30000) })
          parsed = safeParse(out2)
        }
        if (parsed.ok) return NextResponse.json({ analysis: parsed.data, message: 'Resume analysis (LLM)' })
      } catch {}
      return NextResponse.json({ error: 'AI provider unavailable' }, { status: 503 })

    } else if (action === 'cover') {
      // Генерация короткого сопроводительного письма на русском — только через ИИ
      if (process.env.AI_OFFLINE_ONLY === '1') {
        return NextResponse.json({ error: 'AI provider unavailable', coverLetter: '' }, { status: 503 })
      }
      try {
          // Попытка подтянуть описание из jobId, если есть
          let jdBlock = ''
          let jobTitle = ''
          let companyName = ''
          try {
            if (jobId) {
              const job = await db.job.findUnique({ where: { id: String(jobId) }, include: { employer: true } })
              if (job?.description) {
                jdBlock = `${job.title || ''}\n${job.description}\nRequirements:${job.requirements || ''}`.slice(0, 2000)
              }
              jobTitle = job?.title || ''
              companyName = job?.employer?.companyName || ''
            }
          } catch {}

          // Извлекаем имя и навыки из резюме, чтобы обеспечить персонализацию
          let resumeObj: any = {}
          try { resumeObj = JSON.parse(String(resumeText || '{}')) } catch {}
          const fullName = String(resumeObj?.personal?.fullName || resumeObj?.name || '').trim()
          const skillsFromResume: string[] = Array.isArray(resumeObj?.skills)
            ? (Array.isArray(resumeObj.skills[0]?.items)
                ? resumeObj.skills.flatMap((s: any) => Array.isArray(s?.items) ? s.items : [])
                : (resumeObj.skills as string[]))
            : []

          // Небольшое сопоставление навыков с JD
          const jdTextForMatch = (jdBlock || String(jobDescription || targetRole || '')).toLowerCase()
          const normalizedSkills = skillsFromResume.map(s => String(s).trim()).filter(Boolean)
          const matchedSkills = normalizedSkills.filter(s => jdTextForMatch.includes(s.toLowerCase()))
          const topSkills = (matchedSkills.length > 0 ? matchedSkills : normalizedSkills).slice(0, 4)
          const skillsList = topSkills.join(', ')

          // Тон и длина настроек
          const toneMap: Record<string, string> = {
            neutral: 'нейтрально-деловой тон',
            formal: 'формальный деловой тон',
            confident: 'уверенный, но корректный тон',
            friendly: 'дружелюбный профессиональный тон'
          }
          const lengthMap: Record<string, { sentences: string; chars: number }> = {
            short: { sentences: '1–2 предложения', chars: 220 },
            medium: { sentences: '3–4 предложения', chars: 380 },
            long: { sentences: '5–6 предложений', chars: 650 }
          }
          const toneGuide = toneMap[String(tone || '').toLowerCase()] || toneMap.neutral
          const lenCfg = lengthMap[String(length || '').toLowerCase()] || lengthMap.short

          const sys = [
            `Ты карьерный копирайтер. Пиши ${toneGuide} строго на русском языке.`,
            `Формат: ${lenCfg.sentences}, один абзац, до ${lenCfg.chars} символов. Без приветствий, обращений, плейсхолдеров и списков.`,
            'Структура: (1) Имя (если есть) — роль для {company}/{role}; 2–3 навыка из JD; (2) одно достижение с метрикой ИЗ РЕЗЮМЕ (если есть), иначе нейтральная формулировка без цифр; (3) деловой CTA (готов обсудить/тест).',
            'Не упоминай город/локацию. Запрещены клише: "я пишу в ответ", "моя кандидатура соответствует требованиям", "буду рад сотрудничеству", "уверен(а), что". Не выдумывай имена HR/рекрутера.',
            (String(length).toLowerCase() === 'short'
              ? 'Короткий режим: не используй префиксы и двоеточия (например, «Кандидат:», «Навыки:»). Не перечисляй навыки после слова «Навыки». Вплетай 2–3 навыка естественно в текст одним предложением. Начинай с ценности/результата для компании; допустимо упоминание имени естественно в ходе фразы. Один мягкий CTA в конце.'
              : '')
          ].filter(Boolean).join(' ')

          const contextLine = `Имя кандидата: ${fullName || '—'}; Навыки кандидата: ${skillsList || '—'}; Компания: ${companyName || '—'}; Роль: ${jobTitle || (targetRole || '')}`
          const prompt = `Контекст:\n${contextLine}\n\nРезюме (JSON/текст):\n${String(resumeText || '').slice(0, 4000)}\n\nОписание роли/вакансии:\n${jdBlock || String(jobDescription || targetRole || '').slice(0, 2000)}\n\nСгенерируй сопроводительное письмо по требованиям.`

          const out = await llmChat(prompt, { system: sys, model: process.env.GIGACHAT_CHAT_MODEL, json: false, timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 45000), keepAlive: process.env.OLLAMA_KEEP_ALIVE || '2h' })
          let letter = String(out || '')

          // Санитайзер: убираем приветствия и обращение к HR, сводим к 2 предложениям
          const cleanCoverLetter = (raw: string): string => {
            let t = String(raw || '')
            t = t.replace(/^[\s\u200B]+/g, '')
            t = t.replace(/^(?:здравствуйте|добрый день|добрый вечер|уважаем[а-я]+|привет)[^\n\.!?]*[\.!?]\s*/i, '')
            t = t.replace(/\[[^\]]+\]/g, '')
            t = t.replace(/\bHR\b|эйчар|рекрутер[ауео]?/gi, '')
            // Удаляем упоминание города/страны
            t = t.replace(/\bиз\s+(Москв[аеи]|Санкт-?Петербург[аеи]?|СПб|Россия|РФ)\b/gi, '')
            // Сгладим обороты "могу предложить", "предлагаю"
            t = t.replace(/могу\s+предложить/gi, 'готов применить')
            t = t.replace(/предлагаю/gi, 'готов применить')
            t = t.replace(/\s+/g, ' ').trim()
            // Удаляем распространённые клише
            t = t.replace(/я\s+пишу\s+в\s+ответ[^\.!?]*[\.!?]\s*/i, '')
            t = t.replace(/моя\s+кандидатура\s+соответствует[^\.!?]*[\.!?]\s*/i, '')
            t = t.replace(/соответств\w*\s+требованиям[^\.!?]*[\.!?]\s*/i, '')
            t = t.replace(/буду\s+рад[а]?\s+сотрудничеству[^\.!?]*[\.!?]\s*/i, '')
            t = t.replace(/уверен[а]?\s*,?\s+что[^\.!?]*[\.!?]\s*/i, '')
            // Ограничим 2 предложениями
            const maxSentences = length === 'long' ? 6 : length === 'medium' ? 4 : 2
            const parts = t.split(/(?<=[\.!?])\s+/).filter(Boolean).slice(0, maxSentences)
            t = parts.join(' ')
            // Ограничим длину
            const charLimit = lenCfg.chars
            if (t.length > charLimit) t = t.slice(0, charLimit)
            return t
          }

          letter = cleanCoverLetter(letter)

          // RU‑guard: если модель вставила CJK‑символы, перегенерируем и вычищаем
          const hasCJK = /[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/.test(letter)
          if (hasCJK) {
            try {
              const sysRu = 'Ты редактор. Перепиши текст строго на русском языке, 1–2 предложения, деловой тон. Не используй китайские/японские/корейские иероглифы.'
              const outRu = await llmChat(`Перепиши на русском кратко и по делу: ${letter}`, { system: sysRu, model: process.env.GIGACHAT_CHAT_MODEL, timeoutMs: Number(process.env.AI_CHAT_TIMEOUT_MS || 30000) })
              letter = cleanCoverLetter(String(outRu || ''))
            } catch {}
            // Жёсткая фильтрация CJK на всякий случай
            letter = letter.replace(/[\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/g, '')
          }
          return NextResponse.json({ coverLetter: letter, message: 'Cover letter generated' })
      } catch {}
      return NextResponse.json({ error: 'AI provider unavailable', coverLetter: '' }, { status: 503 })

    } else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 })
    }

  } catch (error) {
    console.error('AI resume processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = (searchParams.get('jobId') || '').trim()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }
    const jobKey = `resume_opt_job:${jobId}`
    const payload = await cache.get<any>('resume_opt', {}, { key: jobKey })
    if (!payload) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}