import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ResumeActions from '@/components/resume/ResumeActions'
import ResumeModern from '@/components/resume/ResumeModern'
import { Badge } from '@/components/ui/badge'
import Footer from '@/components/Footer'
import PrintOnLoad from '@/components/resume/PrintOnLoad'

interface Props { params: { id: string } }

export default async function ResumeDetailsPage({ params }: Props) {
  const resume = await db.resume.findUnique({
    where: { id: params.id },
    include: {
      candidate: {
        include: {
          user: { select: { name: true, email: true } },
          skills: { include: { skill: true } },
          workExperience: true,
          education: true,
        }
      }
    }
  })

  if (!resume) return notFound()

  const data: any = resume.data || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="container mx-auto px-4 py-8">
        {/* Автопечать если открыт с ?print=1 */}
        {/* @ts-expect-error server component reading search params via location is not allowed, so we use client child */}
        <PrintOnLoad enabled={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1'} selector="#resume-print" />
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{resume.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Обновлено: {new Date(resume.updatedAt).toLocaleString('ru-RU')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href={`/resumes/${resume.id}/edit`}>Редактировать</Link>
              </Button>
              {resume.isDefault && <Badge variant="secondary">По умолчанию</Badge>}
              <ResumeActions sharePath={`/resumes/${resume.id}`} printSelector="#resume-print" resumeId={resume.id} />
            </div>
          </div>

          <Card>
            <CardContent id="resume-print" className="p-8 bg-white dark:bg-black rounded-2xl border-2 border-gray-200 dark:border-gray-800">
              <ResumeModern data={data} candidate={resume.candidate as any} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}


