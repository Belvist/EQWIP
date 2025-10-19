import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Предопределенные категории сайта
    const SITE_CATEGORIES: { key: any; label: string }[] = [
      { key: 'IT', label: 'IT' },
      { key: 'SALES', label: 'Продажи' },
      { key: 'MARKETING', label: 'Маркетинг' },
      { key: 'FINANCE', label: 'Финансы' },
      { key: 'LOGISTICS', label: 'Логистика' },
      { key: 'PRODUCTION', label: 'Производство' },
      { key: 'CONSTRUCTION', label: 'Строительство' },
      { key: 'ADMIN', label: 'Администрирование' },
      { key: 'HR', label: 'HR' },
      { key: 'HEALTHCARE', label: 'Медицина' },
      { key: 'OTHER', label: 'Другое' },
    ]

    // Подсчет количества активных вакансий по категориям сайта.
    // Правило маппинга: смотрим по ключевым словам в названии/описании/скиллах.
    const counts = await db.job.groupBy({
      by: ['siteCategory'],
      where: { isActive: true, siteCategory: { not: null } },
      _count: { _all: true }
    })

    const mapCount: Record<string, number> = {}
    counts.forEach((c) => {
      if (c.siteCategory) mapCount[c.siteCategory as any] = c._count._all
    })

    const categories = SITE_CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: mapCount[c.key] || 0 }))

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}