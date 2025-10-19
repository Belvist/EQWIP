import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Award, Languages, DollarSign } from "lucide-react"

interface CandidateFallback {
  user?: { name?: string | null; email?: string | null }
  location?: string | null
}

interface ResumeModernProps {
  data: any
  candidate?: CandidateFallback
}

const levelToPercent = (level?: string): number => {
  if (!level) return 50
  const map: Record<string, number> = { A1: 20, A2: 35, B1: 55, B2: 70, C1: 85, C2: 95, FLUENT: 90, NATIVE: 100 }
  return map[level] ?? 60
}

export default function ResumeModern({ data, candidate }: ResumeModernProps) {
  const personal = data?.personal || {}
  const fullName = personal.fullName || candidate?.user?.name || "—"
  const email = personal.email || candidate?.user?.email || "—"
  const phone = personal.phone || "—"
  const location = personal.location || candidate?.location || "—"
  const website = personal.website || ""
  const summary = personal.summary || ""
  const targetTitle = data?.targetJob?.title || ""

  const compensation = data?.compensation || {}

  const experience: any[] = Array.isArray(data?.experience) ? data.experience : []
  const education: any[] = Array.isArray(data?.education) ? data.education : []
  const skills: any[] = Array.isArray(data?.skills) ? data.skills : []
  const languages: any[] = Array.isArray(data?.languages) ? data.languages : []
  const certifications: any[] = Array.isArray(data?.certifications) ? data.certifications : []

  return (
    <div className="w-full">
      {/* Header */}
      <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-black p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</div>
            {targetTitle && (
              <div className="text-gray-600 dark:text-gray-300 mt-1">{targetTitle}</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {email}</div>
            {phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {phone}</div>}
            {location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {location}</div>}
            {website && <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {website}</div>}
            {(typeof compensation.salaryMin === 'number' || typeof compensation.salaryMax === 'number') && (
              <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> {
                (() => {
                  const map: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' }
                  const symbol = map[compensation.currency] || compensation.currency || '₽'
                  const min = typeof compensation.salaryMin === 'number' ? compensation.salaryMin : undefined
                  const max = typeof compensation.salaryMax === 'number' ? compensation.salaryMax : undefined
                  if (min !== undefined && max !== undefined) return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`
                  if (min !== undefined) return `от ${symbol}${min.toLocaleString()}`
                  if (max !== undefined) return `до ${symbol}${max.toLocaleString()}`
                  return ''
                })()
              }</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left sidebar */}
        <div className="md:col-span-1 space-y-6">
          {skills.some((s) => Array.isArray(s.items) && s.items.length > 0) && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Навыки</h3>
              <div className="space-y-4">
                {skills.map((cat, idx) => (
                  cat?.items?.length ? (
                    <div key={idx}>
                      {cat.category && <div className="text-sm text-gray-500 mb-2">{cat.category}</div>}
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((sk: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">{sk}</span>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Languages className="w-4 h-4"/> Языки</h3>
              <div className="space-y-3">
                {languages.map((lng: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm"><span>{lng.name}</span><span className="text-gray-500">{lng.level}</span></div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gray-900 dark:bg-white" style={{ width: `${levelToPercent(lng.level)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4"/> Сертификаты</h3>
              <ul className="space-y-2 text-sm">
                {certifications.map((c: any, idx: number) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">{c.name || c.title}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-8">
          {summary && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">О себе</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
            </section>
          )}

          {experience.length > 0 && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Опыт работы</h3>
              <div className="space-y-6">
                {experience.map((exp: any, idx: number) => (
                  <div key={idx} className="relative pl-5">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{exp.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{exp.company}{exp.location ? ` • ${exp.location}` : ''}</div>
                      </div>
                      <div className="text-sm text-gray-500">{exp.startDate} — {exp.endDate || 'Настоящее время'}</div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4"/> Образование</h3>
              <div className="space-y-4">
                {education.map((edu: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{edu.degree}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}{edu.location ? ` • ${edu.location}` : ''}</div>
                      {edu.gpa && <div className="text-sm text-gray-500">GPA: {edu.gpa}</div>}
                    </div>
                    <div className="text-sm text-gray-500">{edu.startDate} — {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}


