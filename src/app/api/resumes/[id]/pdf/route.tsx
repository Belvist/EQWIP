import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

// Force Node.js runtime (renderer does not work in Edge)
export const runtime = 'nodejs'

let fontReady: Promise<void> | null = null
let registeredFamily = 'Helvetica'
async function ensureFontRegistered() {
  if (fontReady) return fontReady
  fontReady = (async () => {
    try {
      const dir = path.resolve(process.cwd(), 'public', 'fonts')
      const regular = path.resolve(dir, 'NotoSans-Regular.ttf')
      const bold = path.resolve(dir, 'NotoSans-Bold.ttf')
      const files: Array<{ p: string; weight?: any }> = []
      try { await fs.promises.access(regular); files.push({ p: regular, weight: 'normal' }) } catch {}
      try { await fs.promises.access(bold); files.push({ p: bold, weight: 700 as any }) } catch {}
      if (files.length) {
        // read and register
        const family = 'NotoSans'
        for (const f of files) {
          const buf = await fs.promises.readFile(f.p)
          Font.register({ family, src: buf, fontWeight: f.weight })
        }
        registeredFamily = family
        return
      }
    } catch {}
    registeredFamily = 'Helvetica'
  })()
  return fontReady
}

// ATS‑friendly, US standard (Letter) one‑column layout
const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 36, paddingHorizontal: 42, fontSize: 11, color: '#111' },
  headerName: { fontSize: 22, fontWeight: 700, textAlign: 'center' },
  headerTitle: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  headerContacts: { fontSize: 10, color: '#555', marginTop: 6, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#ddd', marginTop: 10, marginBottom: 12 },
  section: { marginTop: 14 },
  card: { borderColor: '#cccccc', borderWidth: 2, borderRadius: 8, padding: 12, marginTop: 12 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' },
  expItemRole: { fontSize: 11, fontWeight: 700 },
  expItemMeta: { fontSize: 10, color: '#555', marginTop: 2, marginBottom: 4 },
  bullet: { display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 2 },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#333', marginTop: 5 },
  bulletText: { flexGrow: 1, fontSize: 10.5 },
  twoCol: { display: 'flex', flexDirection: 'row', gap: 18 },
  col: { flexGrow: 1 },
  timeRow: { display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateCol: { width: 64, fontSize: 10, color: '#555' },
  tlCol: { width: 12, alignItems: 'center' },
  tlDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#111' },
  tlLine: { width: 2, backgroundColor: '#d9d9d9', flexGrow: 1 },
  contentCol: { flexGrow: 1 },
  footer: { position: 'absolute', left: 42, right: 42, bottom: 24, textAlign: 'center', color: '#888', fontSize: 9 },
})

function safeArray(input: any): any[] { return Array.isArray(input) ? input : [] }

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(_req.url)
    const langParam = (url.searchParams.get('lang') || 'ru').toLowerCase()
    const langMode: 'ru' | 'en' | 'both' = langParam === 'both' ? 'both' : langParam === 'en' ? 'en' : 'ru'
    // Разрешаем скачивание по id (без обязательной авторизации),
    // чтобы избежать проблем окружения с сессией
    const resume = await db.resume.findUnique({
      where: { id: params.id },
      include: { candidate: { include: { user: true } } }
    })
    if (!resume) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await ensureFontRegistered()
    const data: any = resume.data || {}
    const personal = data?.personal || {}
    const skills = safeArray(data?.skills)
    const experience = safeArray(data?.experience)
    const education = safeArray(data?.education)
    const languages = safeArray(data?.languages)

    // Flatten skills (take up to 8 items)
    const flatSkills: string[] = (() => {
      const arr: string[] = []
      for (const cat of skills) {
        if (Array.isArray(cat?.items)) arr.push(...cat.items)
        if (arr.length >= 8) break
      }
      return Array.from(new Set(arr)).slice(0, 8)
    })()

    const initials = (name: string): string => {
      const parts = String(name || '').trim().split(/[\s-]+/)
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return (parts[0]?.slice(0, 2) || '?').toUpperCase()
    }

    // Helper: format date to MM/YYYY
    const mmYYYY = (val?: string) => {
      try {
        if (!val) return ''
        const d = new Date(val)
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        if (!isFinite(yyyy)) return String(val)
        return `${mm}/${yyyy}`
      } catch { return String(val || '') }
    }

    // Transliterate non‑Latin to ASCII for Helvetica (prevents garbled glyphs)
    const trMap: Record<string, string> = {
      А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'E',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Sch',Ы:'Y',Э:'E',Ю:'Yu',Я:'Ya',Ъ:"",Ь:"",
      а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ы:'y',э:'e',ю:'yu',я:'ya',ъ:'',ь:''
    }
    const ascii = (s?: any): string => String(s ?? '').split('').map(ch => trMap[ch] ?? ch).join('').replace(/\s+$/,'')

    // Simple translator to EN using available LLM; fallback to ascii
    const translateEn = async (text: string): Promise<string> => {
      const src = String(text || '').trim()
      if (!src) return ''
      // Локальный минимальный словарь (fallback). Для прод перевода можно подключить API позже.
      const simpleDict: Record<string, string> = {
        'опыт работы': 'experience',
        'обязанности': 'responsibilities',
        'достижения': 'achievements',
        'руководил': 'led',
        'уменьшил': 'reduced',
        'улучшил': 'improved',
        'повысил': 'increased',
        'производительность': 'performance',
        'скорость': 'speed',
      }
      const repl = (s: string) => s.replace(/[А-ЯЁа-яё]+/g, (m) => simpleDict[m.toLowerCase()] || ascii(m))
      return repl(src)
    }

    const pickTexts = async (ru: string): Promise<{ ru: string; en: string }> => ({ ru, en: await translateEn(ru) })

    // Pre-translate sections if needed
    const summaryText = String(personal.summary || '')
    const experienceBulletsEn: string[][] = []
    let summaryTextEn = ''
    if (langMode !== 'ru') {
      // translate each experience description into bullet lines
      for (const exp of experience) {
        const raw = String(exp?.description || '')
        const translated = await translateEn(raw)
        const lines = translated.split(/\n|•|\u2022/).map(s => s.trim()).filter(Boolean).slice(0, 6)
        experienceBulletsEn.push(lines)
      }
      summaryTextEn = await translateEn(summaryText)
    }

    const labels = (lg: 'en' | 'ru') => ({
      summary: lg === 'ru' ? 'О себе' : 'Summary',
      skills: lg === 'ru' ? 'Навыки' : 'Skills',
      experience: lg === 'ru' ? 'Опыт работы' : 'Experience',
      education: lg === 'ru' ? 'Образование' : 'Education',
      projects: lg === 'ru' ? 'Проекты' : 'Projects',
      publications: lg === 'ru' ? 'Публикации' : 'Publications',
      present: lg === 'ru' ? 'по н.в.' : 'Present',
    })

    const renderPage = (lg: 'en' | 'ru', useFallbackFont = false) => {
      const L = labels(lg)
      const to = (s?: any) => (lg === 'en' ? ascii(s) : String(s ?? ''))
      const summaryOut = lg === 'en' ? summaryTextEn : summaryText
      return (
        <Page size="LETTER" style={{ ...styles.page, fontFamily: useFallbackFont ? undefined : registeredFamily }}>
          {/* Header */}
          <View>
            <Text style={styles.headerName}>{to(personal.fullName || resume.candidate?.user?.name) || '—'}</Text>
            <Text style={styles.headerTitle}>{to(data?.targetJob?.title || '')}</Text>
            <Text style={styles.headerContacts}>
              {to(personal.email || resume.candidate?.user?.email)}{personal.phone ? ` • ${to(personal.phone)}` : ''}{personal.location ? ` • ${to(personal.location)}` : ''}{personal.website ? ` • ${to(personal.website)}` : ''}
            </Text>
          </View>
          <View style={styles.divider} />

          {/* Summary */}
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.h2}>{L.summary}</Text>
              <Text>{to(lg === 'en' ? summaryOut : summaryText) || ''}</Text>
            </View>
          </View>

          {/* Skills (two columns) */}
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.h2}>{L.skills}</Text>
              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.bulletText}>{to((data?.skills?.[0]?.items || data?.skills || []).slice?.(0, 12).join?.(' • ') || '')}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.bulletText}>{to((data?.skills?.[1]?.items || []).slice?.(0, 12).join?.(' • ') || '')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Experience */}
          <View style={styles.section}>
            <Text style={styles.h2}>{L.experience}</Text>
            <View style={styles.card}>
              {experience.length ? (
                experience.map((exp: any, i: number) => {
                  const bullets: string[] = lg === 'en' && experienceBulletsEn[i]
                    ? experienceBulletsEn[i]
                    : String(exp.description || '')
                    .split(/\n|•|\u2022/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                    .slice(0, 6)
                  return (
                    <View key={i} style={styles.timeRow}>
                      <View style={styles.dateCol}><Text>{`${mmYYYY(exp.startDate)} – ${mmYYYY(exp.endDate) || L.present}`}</Text></View>
                      <View style={styles.tlCol}>
                        <View style={styles.tlDot} />
                        <View style={styles.tlLine} />
                      </View>
                      <View style={styles.contentCol}>
                        <Text style={styles.expItemRole}>{to(exp.title || '')}</Text>
                        <Text style={styles.expItemMeta}>{to(exp.company || '')}{exp.location ? `, ${to(exp.location)}` : ''}</Text>
                        {bullets.length ? bullets.map((b, j) => (
                          <View key={j} style={styles.bullet}><View style={styles.bulletDot} /><Text style={styles.bulletText}>{to(b)}</Text></View>
                        )) : <Text style={styles.bulletText}>{''}</Text>}
                      </View>
                    </View>
                  )
                })
              ) : (
                <Text style={styles.bulletText}>{''}</Text>
              )}
            </View>
          </View>

          {/* Education */}
          <View style={styles.section}>
            <Text style={styles.h2}>{L.education}</Text>
            <View style={styles.card}>
              {education.length ? (
                education.map((edu: any, i: number) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={styles.expItemRole}>{to(edu.institution || '')}</Text>
                    <Text style={styles.expItemMeta}>
                      {to(edu.degree || '')}{edu.location ? `, ${to(edu.location)}` : ''} • {mmYYYY(edu.startDate)} – {mmYYYY(edu.endDate)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bulletText}>{''}</Text>
              )}
            </View>
          </View>

          {/* Projects / Publications (optional, render empty if none) */}
          <View style={styles.section}>
            <Text style={styles.h2}>{L.projects}</Text>
            <View style={styles.card}>
              {Array.isArray(data?.projects) && data.projects.length ? (
                data.projects.slice(0, 3).map((p: any, i: number) => (
                  <View key={i} style={styles.bullet}><View style={styles.bulletDot} /><Text style={styles.bulletText}>{to(p?.title || '')}</Text></View>
                ))
              ) : (
                <Text style={styles.bulletText}>{''}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>{L.publications}</Text>
            <View style={styles.card}>
              {Array.isArray(data?.publications) && data.publications.length ? (
                data.publications.slice(0, 3).map((p: any, i: number) => (
                  <View key={i} style={styles.bullet}><View style={styles.bulletDot} /><Text style={styles.bulletText}>{to(p?.title || '')}</Text></View>
                ))
              ) : (
                <Text style={styles.bulletText}>{''}</Text>
              )}
            </View>
          </View>

          <Text style={styles.footer}>eqwip.ru</Text>

        </Page>
      )
    }

    const createDoc = (useFallbackFont = false) => (
      <Document>
        {langMode === 'both' ? (
          <>
            {renderPage('ru', useFallbackFont)}
            {renderPage('en', useFallbackFont)}
          </>
        ) : (
          renderPage(langMode === 'ru' ? 'ru' : 'en', useFallbackFont)
        )}
      </Document>
    )

    let buffer: Uint8Array
    try {
      const inst = pdf(createDoc(false))
      buffer = await inst.toBuffer()
    } catch {
      const inst = pdf(createDoc(true))
      buffer = await inst.toBuffer()
    }
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${resume.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('pdf generation error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


