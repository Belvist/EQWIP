'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, type FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Mail, KeyRound, Send } from 'lucide-react'

function VerifyEmailContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const em = params.get('email')
    if (em) setEmail(em)
  }, [params])

  const resend = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'verify' }),
      })
      if (res.ok) {
        toast({ title: 'Код отправлен', description: 'Проверьте вашу почту' })
      } else {
        const j = await res.json().catch(() => ({}))
        toast({ title: 'Не удалось отправить код', description: j.message || 'Попробуйте позже', variant: 'destructive' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !code) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose: 'verify' }),
      })
      if (res.ok) {
        toast({ title: 'Email подтверждён', description: 'Теперь вы можете войти' })
        router.push('/auth/signin')
      } else {
        const j = await res.json().catch(() => ({}))
        toast({ title: 'Ошибка', description: j.message || 'Неверный код', variant: 'destructive' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.03),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.03),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(0,0,0,0.02),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_40%)]" />
      <div className="w-full max-w-md">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">EQWIP</div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Подтверждение email</CardTitle>
            <CardDescription className="text-gray-900 dark:text-gray-300">Введите код из письма, чтобы подтвердить email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-gray-700 dark:text-gray-200">Код подтверждения</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input id="code" type="text" placeholder="Например: 123456" value={code} onChange={(e) => setCode(e.target.value)} className="pl-9 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500" required />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resend} disabled={!email || isLoading}>
                <Send className="w-4 h-4 mr-2" /> Отправить код повторно
              </Button>
              <Button onClick={verify} className="flex-1" disabled={!email || !code || isLoading}>
                Подтвердить
              </Button>
            </div>

            <Separator className="my-2" />
            <div className="text-center text-gray-600 dark:text-gray-300 text-sm">Не получили письмо? Проверьте папку Спам.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-300">Загрузка…</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}


