/* LLM helper with pluggable providers (gigachat | ollama | openai | openrouter). */
import axios from 'axios'
import crypto from 'crypto'

export type LLMChatOptions = {
  model?: string
  system?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  json?: boolean
  keepAlive?: string
}

const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase()
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_CHAT_TIMEOUT_MS || '10000')

// GigaChat defaults
const GIGACHAT_BASE_URL = process.env.GIGACHAT_BASE_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2'
const GIGACHAT_API_KEY = process.env.GIGACHAT_API_KEY || ''
const GIGACHAT_MODEL = process.env.GIGACHAT_CHAT_MODEL || 'GigaChat:latest'

// Ollama defaults (fallback)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:3b-instruct'

// OpenAI/OpenRouter defaults
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || process.env.AI_KEEP_ALIVE || ''

// Функция для определения доступных провайдеров в порядке приоритета
function getAvailableProviders(): string[] {
  const providers: string[] = []
  
  // 1. Приоритет: Ollama (если доступен)
  if (AI_PROVIDER === 'ollama') {
    providers.push('ollama')
  }
  
  // 2. GigaChat (если настроен)
  if (AI_PROVIDER === 'gigachat' && GIGACHAT_API_KEY) {
    providers.push('gigachat')
  }
  
  // 3. OpenAI (если настроен)
  if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
    providers.push('openai')
  }
  
  // 4. OpenRouter (если настроен)
  if (AI_PROVIDER === 'openrouter' && OPENROUTER_API_KEY) {
    providers.push('openrouter')
  }
  
  // 5. Fallback: всегда добавляем fallback в конец
  providers.push('fallback')
  
  return providers
}

export async function llmChat(prompt: string, opts: LLMChatOptions = {}): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const systemMsg = opts.system ? [{ role: 'system', content: opts.system }] : []
    const messages = [...systemMsg, { role: 'user' as const, content: prompt }]

    // Умная система выбора провайдера с fallback
    const providers = getAvailableProviders()
    
    for (const provider of providers) {
      try {
        if (provider === 'ollama') {
          // Формируем промпт из сообщений
          const prompt = messages.map(msg => {
            if (msg.role === 'system') return `System: ${msg.content}`
            if (msg.role === 'user') return `User: ${msg.content}`
            if (msg.role === 'assistant') return `Assistant: ${msg.content}`
            return msg.content
          }).join('\n\n')
          
          const body: any = {
            model: opts.model || OLLAMA_MODEL,
            prompt: prompt,
            options: {
              temperature: opts.temperature ?? 0.2,
              num_ctx: Math.min(Math.max(opts.maxTokens ?? 1024, 256), 4096),
              num_predict: Math.min(Math.max(opts.maxTokens ?? 256, 64), 1024)
            },
            stream: false,
            ...(opts.json ? { format: 'json' } : {})
          }
          if (opts.keepAlive || OLLAMA_KEEP_ALIVE) body.keep_alive = opts.keepAlive || OLLAMA_KEEP_ALIVE
          
          const r = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          })
          
          if (r.ok) {
            const j = await r.json()
            const text: string = j?.response || ''
            console.log(`✅ Ollama response successful`)
            return text
          } else {
            console.warn(`⚠️ Ollama failed (${r.status}), trying next provider`)
            continue
          }
        }

        if (provider === 'gigachat') {
          if (!GIGACHAT_API_KEY) {
            console.warn('⚠️ GigaChat API key not set, trying next provider')
            continue
          }
          
          // Создаем axios instance с отключенной проверкой SSL для GigaChat
          const axiosInstance = axios.create({
            httpsAgent: new (require('https').Agent)({
              rejectUnauthorized: false
            }),
            timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
          })
          
          // Получаем токен доступа
          const tokenResponse = await axiosInstance.post(`${GIGACHAT_BASE_URL}/oauth`, 
            'scope=GIGACHAT_API_PERS',
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'RqUID': crypto.randomUUID(),
                'Authorization': `Basic ${GIGACHAT_API_KEY}`
              },
              signal: controller.signal
            }
          )
          
          const accessToken = tokenResponse.data.access_token
          if (!accessToken) {
            console.warn('⚠️ GigaChat token missing, trying next provider')
            continue
          }
          
          // Делаем запрос к чату
          const chatResponse = await axiosInstance.post(`${GIGACHAT_BASE_URL}/chat/completions`, {
            model: opts.model || GIGACHAT_MODEL,
            messages,
            temperature: opts.temperature ?? 0.2,
            max_tokens: opts.maxTokens ?? 512,
            stream: false,
            ...(opts.json ? { response_format: { type: 'json_object' as const } } : {})
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            signal: controller.signal
          })
          
          const text: string = chatResponse.data?.choices?.[0]?.message?.content || ''
          console.log(`✅ GigaChat response successful`)
          return text
        }

        if (provider === 'openai') {
          if (!OPENAI_API_KEY) {
            console.warn('⚠️ OpenAI API key not set, trying next provider')
            continue
          }
          
          const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: opts.model || OPENAI_MODEL,
              messages,
              temperature: opts.temperature ?? 0.2,
              max_tokens: opts.maxTokens ?? 512,
              stream: false,
              ...(opts.json ? { response_format: { type: 'json_object' as const } } : {})
            }),
            signal: controller.signal
          })
          
          if (r.ok) {
            const j: any = await r.json()
            const text: string = j?.choices?.[0]?.message?.content || ''
            console.log(`✅ OpenAI response successful`)
            return text
          } else {
            console.warn(`⚠️ OpenAI failed (${r.status}), trying next provider`)
            continue
          }
        }

        if (provider === 'openrouter') {
          if (!OPENROUTER_API_KEY) {
            console.warn('⚠️ OpenRouter API key not set, trying next provider')
            continue
          }
          
          const r = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
              model: opts.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
              messages,
              temperature: opts.temperature ?? 0.2,
              max_tokens: opts.maxTokens ?? 512,
              stream: false,
              ...(opts.json ? { response_format: { type: 'json_object' as const } } : {})
            }),
            signal: controller.signal
          })
          
          if (r.ok) {
            const j: any = await r.json()
            const text: string = j?.choices?.[0]?.message?.content || ''
            console.log(`✅ OpenRouter response successful`)
            return text
          } else {
            console.warn(`⚠️ OpenRouter failed (${r.status}), trying next provider`)
            continue
          }
        }

        if (provider === 'fallback') {
          console.log('🔄 Using fallback response system')
          return generateFallbackResponse(prompt, opts)
        }
      } catch (error) {
        console.warn(`⚠️ Provider ${provider} failed:`, error instanceof Error ? error.message : 'Unknown error')
        continue
      }
    }

    // Если дошли сюда, значит все провайдеры провалились
    console.error('❌ All AI providers failed, using emergency fallback')
    return generateFallbackResponse(prompt, opts)
  } catch (error) {
    // Критическая ошибка - используем fallback
    console.error('❌ Critical error in llmChat:', error instanceof Error ? error.message : 'Unknown error')
    return generateFallbackResponse(prompt, opts)
  } finally {
    clearTimeout(timeout)
  }
}

function generateFallbackResponse(prompt: string, opts: LLMChatOptions = {}): string {
  console.log('🔄 Generating intelligent fallback response...')
  
  if (opts.json) {
    // Умный анализ на основе ключевых слов в промпте
    const promptLower = prompt.toLowerCase()
    
    // Анализ контента
    const hasSalary = /зарплат|salary|₽|\$|рубл|доллар|евро|k\s*₽|k\s*\$/.test(promptLower)
    const hasRequirements = /требован|requirement|навык|skill|знан|умен|опыт|experience/.test(promptLower)
    const hasDescription = /описан|description|задач|обязанност|функц|responsibilit/.test(promptLower)
    const hasCompany = /компан|company|организац|фирм|корпорац/.test(promptLower)
    const hasLocation = /локац|location|город|москв|спб|питер|екатеринбург|новосибирск|remote|удаленн/.test(promptLower)
    const hasExperience = /опыт|experience|стаж|лет|год|junior|middle|senior|lead/.test(promptLower)
    const hasBenefits = /льгот|benefit|соцпакет|отпуск|медицин|страховк/.test(promptLower)
    const hasSchedule = /график|schedule|рабоч|время|смен|ночн|дневн/.test(promptLower)
    
    let score = 40 // Базовый балл
    const issues: string[] = []
    const strengths: string[] = []
    const suggestions: string[] = []
    
    // Анализ зарплаты
    if (hasSalary) {
      score += 20
      strengths.push("Указана информация о зарплате")
    } else {
      score -= 15
      issues.push("Не указана зарплата")
      suggestions.push("Добавьте информацию о зарплате для привлечения кандидатов")
    }
    
    // Анализ требований
    if (hasRequirements) {
      score += 20
      strengths.push("Четко описаны требования и навыки")
    } else {
      score -= 15
      issues.push("Отсутствуют четкие требования к кандидату")
      suggestions.push("Опишите необходимые навыки и опыт работы")
    }
    
    // Анализ описания
    if (hasDescription) {
      score += 15
      strengths.push("Подробное описание должности")
    } else {
      score -= 10
      issues.push("Недостаточно описания должности")
      suggestions.push("Расширьте описание обязанностей и задач")
    }
    
    // Анализ компании
    if (hasCompany) {
      score += 10
      strengths.push("Указана информация о компании")
    } else {
      score -= 5
      issues.push("Не указана компания")
      suggestions.push("Добавьте название и краткое описание компании")
    }
    
    // Анализ локации
    if (hasLocation) {
      score += 8
      strengths.push("Указана локация работы")
    } else {
      score -= 3
      issues.push("Не указана локация")
      suggestions.push("Укажите город или формат работы (офис/удаленно)")
    }
    
    // Анализ опыта
    if (hasExperience) {
      score += 7
      strengths.push("Указан требуемый опыт")
    } else {
      score -= 2
      issues.push("Не указан требуемый опыт")
      suggestions.push("Укажите требуемый уровень опыта (junior/middle/senior)")
    }
    
    // Дополнительные бонусы
    if (hasBenefits) {
      score += 5
      strengths.push("Указаны льготы и бонусы")
    }
    
    if (hasSchedule) {
      score += 3
      strengths.push("Указан график работы")
    }
    
    // Определение рекомендации
    let recommendation: string
    let recommendationReason: string
    
    if (score >= 85) {
      recommendation = "approve"
      recommendationReason = "Отличное качество вакансии"
    } else if (score >= 70) {
      recommendation = "needs_revision"
      recommendationReason = "Хорошее качество, но есть что улучшить"
    } else if (score >= 50) {
      recommendation = "needs_revision"
      recommendationReason = "Среднее качество, требует доработки"
    } else {
      recommendation = "reject"
      recommendationReason = "Низкое качество, требует значительной доработки"
    }
    
    // Генерация метрик качества
    const qualityMetrics = {
      contentCompleteness: hasDescription ? Math.min(90, 60 + (prompt.length / 100)) : 30,
      salaryTransparency: hasSalary ? 85 : 15,
      requirementsClarity: hasRequirements ? 80 : 25,
      companyCredibility: hasCompany ? 75 : 40,
      locationClarity: hasLocation ? 80 : 30,
      experienceSpecification: hasExperience ? 85 : 35,
      benefitsDescription: hasBenefits ? 70 : 20,
      overallAttractiveness: Math.min(100, Math.max(20, score))
    }
    
    return JSON.stringify({
      overallScore: Math.min(100, Math.max(0, score)),
      recommendation: recommendation,
      recommendationReason: recommendationReason,
      issues: issues.length > 0 ? issues.map((issue, index) => ({
        type: "content_quality",
        severity: score < 50 ? "high" : score < 70 ? "medium" : "low",
        message: issue,
        suggestion: suggestions[index] || "Проверьте и дополните информацию"
      })) : [{
        type: "system",
        severity: "low",
        message: "ИИ система временно недоступна",
        suggestion: "Используется упрощенный анализ. Рекомендуется ручная проверка модератором."
      }],
      strengths: strengths.length > 0 ? strengths : ["Базовая структура вакансии присутствует"],
      qualityMetrics: qualityMetrics,
      aiSummary: `Упрощенный анализ без ИИ. Оценка: ${score}/100. ${recommendationReason}.`,
      fallbackMode: true,
      timestamp: new Date().toISOString()
    })
  }
  
  // Простой текстовый fallback
  const responses = [
    "Система ИИ временно недоступна. Обратитесь к модератору для ручной проверки.",
    "Автоматический анализ приостановлен. Требуется ручная проверка контента.",
    "ИИ сервис недоступен. Пожалуйста, дождитесь восстановления или обратитесь к администратору."
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

export function tryParseJson(text: string): { ok: boolean; data?: any; raw?: string } {
  const stripCodeFences = (s: string): string => s.replace(/```[a-zA-Z]*\n?[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, ''))
  const removeTrailingCommas = (s: string): string => s.replace(/,\s*([}\]])/g, '$1')
  const extractBalanced = (s: string): string | null => {
    let start = -1
    let depth = 0
    let open: string | null = null
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (start === -1 && (ch === '{' || ch === '[')) {
        start = i
        open = ch
        depth = 1
        continue
      }
      if (start !== -1) {
        if (ch === '{' || ch === '[') depth++
        else if (ch === '}' || ch === ']') depth--
        if (depth === 0) {
          return s.slice(start, i + 1)
        }
      }
    }
    return null
  }

  const attempts: string[] = []
  attempts.push(text)
  attempts.push(stripCodeFences(text).trim())
  const balanced = extractBalanced(text)
  if (balanced) attempts.push(balanced)
  const balancedFixed = balanced ? removeTrailingCommas(balanced) : ''
  if (balancedFixed) attempts.push(balancedFixed)

  for (const t of attempts) {
    try {
      return { ok: true, data: JSON.parse(t) }
    } catch {}
  }
  // Last resort: try naive fixes (keys in single quotes)
  try {
    let s = stripCodeFences(text)
    s = removeTrailingCommas(s)
    s = s.replace(/([,{\s])'([^'\n\r]+)'\s*:/g, '$1"$2":')
    return { ok: true, data: JSON.parse(s) }
  } catch {}
  return { ok: false, raw: text }
}


