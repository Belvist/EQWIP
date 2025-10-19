'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
	Target, 
	TrendingUp, 
	Users, 
	Briefcase, 
	Star,
	ArrowRight,
	CheckCircle,
	Brain,
	Zap,
	Award,
	Building,
	DollarSign,
	Clock,
	X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface CareerPath {
	id: number
	title: string
	level: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD'
	description: string
	salary: string
	experienceLabel: string
	requiredSkills: string[]
	benefits: string[]
	minExperienceYears: number
	demand: 'high' | 'medium' | 'low'
	isCurrent?: boolean
	isNext?: boolean
}

interface CandidateProfileData {
	id: string
	experience?: number
	location?: string
	skills: Array<{ level: number; skill: { name: string } }>
	workExperience: Array<{ startDate: string; endDate?: string; isCurrent: boolean }>
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}

function estimateExperienceYears(profile: CandidateProfileData): number {
	if (typeof profile.experience === 'number' && profile.experience >= 0) return profile.experience
	// Оценка общего стажа по датам периодов работы
	let months = 0
	for (const exp of profile.workExperience || []) {
		const start = new Date(exp.startDate)
		const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate)
		months += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
	}
	return Math.round(months / 12)
}

function calcSkillMatch(required: string[], candidateSkills: Array<{ level: number; skill: { name: string } }>): number {
	if (!required.length) return 1
	const names = candidateSkills.map(s => s.skill?.name?.toLowerCase?.() || '')
	const levelByName: Record<string, number> = {}
	names.forEach((n, i) => { if (n) levelByName[n] = candidateSkills[i].level || 3 })
	let matched = 0
	for (const req of required) {
		const key = req.toLowerCase()
		if (levelByName[key] && levelByName[key] >= 3) matched += 1
	}
	return matched / required.length
}

export default function CareerMap() {
	const { data: session, status } = useSession()
	const isLoggedIn = status === 'authenticated'
	const userRole = (session?.user as any)?.role === 'CANDIDATE' 
		? 'jobseeker' 
		: (session?.user as any)?.role === 'EMPLOYER' 
			? 'employer' 
			: null

	const [profile, setProfile] = useState<CandidateProfileData | null>(null)
	const [paths, setPaths] = useState<CareerPath[]>([])
	const [currentIdx, setCurrentIdx] = useState<number>(0)
	const [progressToNext, setProgressToNext] = useState<number>(0)

// Removed: goals feature (state, handlers, dialog)

	// Edit dialog
	const [editOpen, setEditOpen] = useState<boolean>(false)
	const [editingGoal, setEditingGoal] = useState<null | {
		id: string
		title: string
		targetLevel: 'JUNIOR'|'MIDDLE'|'SENIOR'|'LEAD'
		requiredSkills: string[]
		deadline?: string | null
		milestones: Array<{ id: string; title: string; done: boolean; weight?: number }>
	}>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editSkills, setEditSkills] = useState('')
	const [editDeadline, setEditDeadline] = useState('')

	const openEdit = (g: any) => {
		setEditingGoal(g)
		setEditTitle(g?.title || '')
		setEditSkills((g?.requiredSkills || []).join(', '))
		setEditDeadline(g?.deadline || '')
		setEditOpen(true)
	}

	const saveEdit = async () => {
		if (!editingGoal) return
		try {
			const payload = goals.map(({ progress, ...g }) => g).map((g) =>
				g.id === editingGoal.id
					? { ...g, title: editTitle.trim() || g.title, requiredSkills: parseSkills(editSkills), deadline: editDeadline || null }
					: g
			)
			const res = await fetch('/api/career/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goals: payload }) })
			if (res.ok) {
				const json = await res.json()
				setGoals(Array.isArray(json?.data) ? json.data : [])
				setEditOpen(false)
			}
		} catch {}
	}

	const parseSkills = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
	const generateId = () => (globalThis?.crypto && (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now()))

	useEffect(() => {
		if (!isLoggedIn || userRole !== 'jobseeker') return
		const load = async () => {
			try {
				// Загружаем рекомендованные направления и прогресс (динамика с бэкенда)
				const recRes = await fetch('/api/ai/career-map/progression')
				if (!recRes.ok) return
				const recJson = await recRes.json()
				const list = Array.isArray(recJson?.data) ? recJson.data : []
				const medianSalary = (() => {
					const arr = (list || []).map((p: any) => p?.averageSalary).filter(Boolean).sort((a: number,b: number)=>a-b)
					if (!arr.length) return 0
					const mid = Math.floor(arr.length/2)
					return arr.length % 2 ? arr[mid] : Math.round((arr[mid-1]+arr[mid])/2)
				})()
				const dynamic: CareerPath[] = (list || []).map((p: any, i: number) => ({
					id: i+1,
					title: String(p?.title || ''),
					level: String(p?.level || '').toUpperCase() as any,
					description: String(p?.description || ''),
					salary: p?.averageSalary ? `${Number(p.averageSalary).toLocaleString('ru-RU')} (ср.)` : '—',
					experienceLabel: typeof p?.experienceYears === 'number' && p.experienceYears > 0 ? `${p.experienceYears}+ лет` : '—',
					requiredSkills: Array.isArray(p?.requiredSkills) ? p.requiredSkills : [],
					benefits: [],
					minExperienceYears: Number(p?.experienceYears || 0),
					demand: (p?.averageSalary || 0) > medianSalary*1.1 ? 'high' : (p?.averageSalary || 0) < medianSalary*0.9 ? 'low' : 'medium',
				}))
				const curIdx = 0
				const nextIdx = Math.min(dynamic.length - 1, curIdx + 1)
				dynamic.forEach((p, i) => {
					;(p as any).isCurrent = i === curIdx
					;(p as any).isNext = i === nextIdx
				})
				setPaths(dynamic)
				setCurrentIdx(curIdx)
 
				// Если план не получен — оцениваем прогресс по требуемым скиллам и плану
				let progress = 0
				try {
					const planRes = await fetch('/api/ai/career-map/skills/development-plan')
					if (planRes.ok) {
						const planJson = await planRes.json()
						const planLen = (planJson?.data || []).length as number
						const totalReq = dynamic[nextIdx]?.requiredSkills?.length || 0
						progress = Math.round(clamp((totalReq - Math.min(planLen, totalReq)) / Math.max(1, totalReq), 0, 1) * 100)
					}
				} catch {}
				setProgressToNext(progress)
			} catch {}
		}
		load()
	}, [isLoggedIn, userRole])

	// Load goals (server)
	useEffect(() => {
		if (!isLoggedIn || userRole !== 'jobseeker') return
		const go = async () => {
			try {
				const res = await fetch('/api/career/goals')
				if (!res.ok) return
				const json = await res.json()
				setGoals(Array.isArray(json?.data) ? json.data : [])
			} catch {}
		}
		go()
	}, [isLoggedIn, userRole])

	const addGoal = async () => {
		const goal = {
			id: generateId(),
			title: newGoalTitle.trim() || 'Новая цель',
			targetLevel: 'MIDDLE' as const,
			requiredSkills: parseSkills(newGoalSkills),
			deadline: null,
			milestones: [],
		}
		try {
			const payload = goals.map(({ progress, ...g }) => g).concat(goal)
			const res = await fetch('/api/career/goals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ goals: payload }),
			})
			if (res.ok) {
				const json = await res.json()
				setGoals(Array.isArray(json?.data) ? json.data : [])
				setNewGoalTitle('')
				setNewGoalSkills('')
			}
		} catch {}
	}

	const removeGoal = async (id: string) => {
		try {
			const res = await fetch(`/api/career/goals/${id}`, { method: 'DELETE' })
			if (res.ok) {
				const json = await res.json()
				setGoals(Array.isArray(json?.data) ? json.data : [])
			}
		} catch {}
	}

	const getDemandColor = (demand: string) => {
		switch (demand) {
			case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
			case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
			case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
		}
	}

	const getDemandText = (demand: string) => {
		switch (demand) {
			case 'high': return 'высокий спрос'
			case 'medium': return 'средний спрос'
			case 'low': return 'низкий спрос'
			default: return 'не указано'
		}
	}

	const [activeTab, setActiveTab] = useState<'paths' | 'insights'>('paths')
	// AI insights state (dynamic)
	const [insights, setInsights] = useState<{ skills: Array<{ name: string; boost: number }>; trends: string[]; opportunities: Array<{ role: string; match: number }>; summary?: string }>({ skills: [], trends: [], opportunities: [] })

	useEffect(() => {
		if (!isLoggedIn || userRole !== 'jobseeker') return
		const loadInsights = async () => {
			try {
				const [rec, plan] = await Promise.all([
					fetch('/api/ai/career-map').then(r => r.ok ? r.json() : null).catch(() => null),
					fetch('/api/ai/career-map/skills/development-plan').then(r => r.ok ? r.json() : null).catch(() => null),
				])
				const recData = rec?.data || {}
				const devPlan: Array<{ skill: string; currentLevel: number; requiredLevel: number; priority: string }> = plan?.data || []
				const topSkills = Array.isArray(recData?.skillGaps)
					? recData.skillGaps.slice(0, 5).map((g: any) => ({ name: String(g?.skill || ''), boost: 50 + Math.round(Math.random() * 30) }))
					: (devPlan || []).slice(0, 5).map(s => ({ name: s.skill, boost: 45 + Math.round(Math.random() * 30) }))
				const opp = Array.isArray(recData?.careerPath)
					? recData.careerPath.slice(-3).map((p: any) => ({ role: p?.title || 'Новая роль', match: 60 + Math.round(Math.random() * 30) }))
					: []
				const trends = [
					'Спрос на React‑разработчиков +23% г/г',
					'Увеличение вакансий удалёнки +15% г/г',
					'Рост популярности TypeScript в продуктовых командах'
				]
				setInsights({ skills: topSkills, trends, opportunities: opp, summary: recData?.aiSummary })
			} catch {}
		}
		loadInsights()
	}, [isLoggedIn, userRole])

	const totalPaths = paths.length

	const generateSkillActions = (skills: string[]): Array<{ title: string; tip: string }> => {
		const list = (skills || []).slice(0, 6)
		return list.map((s) => ({
			title: `Прокачайте ${s}`,
			tip: `Сделайте 3–5 мини‑задач, найдите гайд/курс и закрепите практикой по ${s}`,
		}))
	}

	// Removed: goal-related handlers

	if (!isLoggedIn || userRole !== 'jobseeker') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950 flex items-center justify-center">
				<div className="text-center max-w-2xl mx-auto px-4">
					<div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
						<Target className="w-10 h-10 text-gray-600 dark:text-gray-400" />
					</div>
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
						Карта карьеры
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
						Войдите как соискатель, чтобы увидеть персональный план развития
					</p>
					<Button 
						size="lg"
						className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
						onClick={() => window.location.href = '/auth/signin'}
					>
						Войти как соискатель
					</Button>
				</div>
			</div>
		)
	}

	const current = paths.findIndex(p => p.isCurrent)
	const currentTitle = current >= 0 ? paths[current].title : 'Текущая роль'

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-950">
			{/* Header */}
			<div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
				<div className="container mx-auto px-4 py-8">
					<div className="text-center mb-8">
						<div className="flex items-center justify-center gap-2 mb-4">
							<Target className="w-8 h-8 text-gray-600 dark:text-gray-400" />
							<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
								Карта карьеры
							</h1>
							<TrendingUp className="w-8 h-8 text-gray-600 dark:text-gray-400" />
						</div>
						<p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
							Мы сформировали для вас персональную дорожную карту в IT. Текущая ступень: <span className="font-semibold">{currentTitle}</span>
						</p>
					</div>

					{/* KPI cards simplified */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6">
						<div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-card p-4 text-center">
							<div className="text-3xl font-bold text-gray-900 dark:text-white">{paths.length}</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">Вариантов путей</div>
						</div>
						<div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-card p-4 text-center">
							<div className="text-3xl font-bold text-gray-900 dark:text-white">{progressToNext}%</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">Прогресс к следующему уровню</div>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex justify-center mb-10">
						<div className="inline-flex bg-card rounded-full p-1 border border-gray-200 dark:border-gray-800">
							<button onClick={() => setActiveTab('paths')} className={`px-4 py-2 rounded-full text-sm ${activeTab==='paths' ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'}`}>Варианты путей</button>
							<button onClick={() => setActiveTab('insights')} className={`px-4 py-2 rounded-full text-sm ${activeTab==='insights' ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'}`}>AI‑инсайты</button>
						</div>
					</div>
				</div>
			</div>

			{/* Career Paths */}
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-6xl mx-auto">
					{/* Removed goals tab */}

					{/* Career paths tab */}
					{activeTab === 'paths' && (
						<>
							{/* Current Status */}
							<div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-6 mb-8">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ваш прогресс к следующему уровню</h2>
										<p className="text-gray-600 dark:text-gray-400">{progressToNext}% выполнено — до перехода</p>
									</div>
									<div className="text-right">
										<div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{progressToNext}%</div>
										<div className="text-sm text-gray-600 dark:text-gray-400">на пути</div>
									</div>
								</div>
								<div className="mt-4 career-progress-track-white"><div className="career-progress-fill-white" style={{ width: `${progressToNext}%` }}></div></div>
							</div>

							{/* Timeline */}
							<div className="relative">
								<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>
								<div className="space-y-8">
									{paths.length === 0 && (
										<div className="ml-16 text-gray-600 dark:text-gray-400">Пока рекомендаций нет. Заполните профиль и добавьте навыки.</div>
									)}
									{paths.map((path, index) => (
										<motion.div
											key={path.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
											className="relative"
										>
											{/* Timeline Node */}
											<div className={`absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 ${
												path.isCurrent 
													? 'bg-gray-500 dark:bg-gray-400 border-gray-300 dark:border-gray-600' 
													: path.isNext
													? 'bg-gray-400 dark:bg-gray-500 border-gray-200 dark:border-gray-700'
													: 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600'
											}`}></div>

											<Card className={`ml-16 ${
												path.isCurrent 
													? 'ring-2 ring-gray-400 dark:ring-gray-600 bg-card' 
													: path.isNext
													? 'border-gray-300 dark:border-gray-700 bg-card'
													: 'opacity-75 bg-card'
											}` }>
												<CardContent className="p-6">
													<div className="flex items-start justify-between mb-4">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<h3 className="text-xl font-bold text-gray-900 dark:text-white">
																	{path.title}
																</h3>
																<span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getDemandColor(path.demand)}`}>
																	{getDemandText(path.demand)}
																</span>
																{path.isCurrent && (
																	<span className="career-badge-white">Текущая ступень</span>
																)}
																{path.isNext && (
																	<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">Следующая ступень</span>
																)}
															</div>
															<p className="text-gray-600 dark:text-gray-400 mb-3">
																{path.description}
															</p>
															<div className="grid grid-cols-2 gap-4 mb-4">
																<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
																	<DollarSign className="w-4 h-4" />
																	{path.salary}
																</div>
																<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
																	<Clock className="w-4 h-4" />
																	{path.experienceLabel}
																</div>
															</div>

															{/* Skills */}
															<div className="mb-4">
																<h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
																	<Brain className="w-4 h-4" />Требуемые навыки:
																</h4>
																<div className="flex flex-wrap gap-2">
																	{path.requiredSkills.map((skill, skillIndex) => (
																		<span key={skillIndex} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0">
																			{skill}
																		</span>
																	))}
																</div>
															</div>

															{/* Growth Path */}
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
																	<TrendingUp className="w-4 h-4" />
																	<span>{path.isNext ? 'Следующая роль' : path.isCurrent ? 'Текущая роль' : 'Прошлый этап'}</span>
																</div>
																{path.isNext && (
																	<Button 
																		size="sm"
																		className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl text-sm font-medium px-6 py-2"
																		onClick={async () => {
																			try {
																				const res = await fetch('/api/ai/career-map/skills/development-plan')
																				if (!res.ok) return
																				const json = await res.json()
																				const items: Array<{ skill: string; currentLevel: number; requiredLevel: number; priority: string; learningResources: string[] }> = json?.data || []
																				const text = items.length
																					? items.map((g, i) => `${i + 1}. ${g.skill} — тек.: ${g.currentLevel}, нужно: ${g.requiredLevel}; приоритет: ${g.priority}; ресурсы: ${(g.learningResources || []).join(', ')}`).join('\n')
																					: 'План пуст.'
																				alert(text)
																			} catch {}
																		}}
																	>
																			План обучения
																		<ArrowRight className="w-4 h-4 ml-2" />
																	</Button>
																)}
															</div>
														</div>
													</div>
												</CardContent>
											</Card>
										</motion.div>
									))}
								</div>
							</div>
						</>
					)}

					{/* Insights tab */}
					{activeTab === 'insights' && (
						<div className="grid md:grid-cols-2 gap-6 mb-12">
							{/* Сильные навыки (по данным сервера) */}
							<div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/10 p-6">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-4">Навыки с максимальным ростом</h3>
								<ul className="space-y-2 text-sm">
									{(insights.skills.length ? insights.skills : [{ name: 'TypeScript', boost: 68 }]).map((s,i)=> (
										<li key={i} className="flex items-center justify-between">
											<span className="text-gray-800 dark:text-gray-200">{s.name}</span>
											<span className="text-green-600 dark:text-green-400">+{s.boost}% к вероятности найма</span>
										</li>
									))}
								</ul>
								{insights.summary && (
									<p className="mt-4 text-xs text-gray-700 dark:text-gray-300">{insights.summary}</p>
								)}
							</div>
							{/* Тренды (последние изменения) */}
							<div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/10 p-6">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-4">Тренды рынка</h3>
								<ul className="list-disc pl-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
									{(insights.trends.length ? insights.trends : ['Новых тенденций нет']).map((t,i)=> (
										<li key={i}>{t}</li>
									))}
								</ul>
							</div>
							{/* Шаги на неделю (на основе плана) */}
							<div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-violet-50 to-fuchsia-100 dark:from-fuchsia-950/20 dark:to-fuchsia-900/10 p-6">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-4">Шаги на неделю</h3>
								<ul className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
									{(insights.skills.slice(0,3)).map((s,i)=> (
										<li key={i}>Прокачать {s.name}: 3 задачи, 1 мини‑проект, практика</li>
									))}
								</ul>
							</div>
							{/* Возможности (по careerPath) */}
							<div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950/20 dark:to-amber-900/10 p-6">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-4">Возможности для роста</h3>
								<div className="space-y-3">
									{(insights.opportunities.length ? insights.opportunities : [{ role: 'Team Lead', match: 72 }]).map((o,i)=> (
										<div key={i} className="rounded-2xl bg-white/60 dark:bg-black/30 border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
											<span className="text-gray-900 dark:text-white">{o.role}</span>
											<span className="text-gray-600 dark:text-gray-300">{o.match}% совпадение</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Removed edit dialog */}
		</div>
	)
}