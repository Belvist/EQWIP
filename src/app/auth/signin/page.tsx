'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, KeyRound, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const redirectByRole = async () => {
    const session = await getSession()
    const role = (session as any)?.user?.role
    if (role === 'EMPLOYER') {
      router.push('/employer')
    } else {
      router.push('/profile')
    }
    router.refresh()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Step 1: verify password and send OTP
      const res = await fetch('/api/auth/password-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        setOtpRequested(true)
        toast({ title: 'Код отправлен', description: 'Введите код из письма для входа' })
        setResendIn(60)
        const timer = setInterval(() => {
          setResendIn((s) => {
            if (s <= 1) { clearInterval(timer); return 0 }
            return s - 1
          })
        }, 1000)
      } else {
        const j = await res.json().catch(() => ({}))
        toast({ title: 'Ошибка входа', description: j.message || 'Неверный email или пароль', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: "Ошибка", description: "Произошла ошибка при входе", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    // Отдаём в callback универсальную страницу, которая пошлёт по роли
    signIn(provider, { callbackUrl: '/auth/redirect' })
  }

  const requestOtp = async () => {
    // Повторная отправка разрешена только после проверки пароля (есть маркер)
    if (!otpRequested) {
      toast({ title: 'Сначала введите пароль', description: 'Введите email и пароль, затем ОК', variant: 'destructive' })
      return
    }
    if (resendIn > 0) return
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' }),
      })
      if (res.ok) {
        toast({ title: 'Код отправлен повторно', description: 'Проверьте почту' })
        setResendIn(60)
        const timer = setInterval(() => {
          setResendIn((s) => {
            if (s <= 1) { clearInterval(timer); return 0 }
            return s - 1
          })
        }, 1000)
      } else {
        const j = await res.json().catch(() => ({}))
        toast({ title: 'Не удалось отправить код', description: j.message || 'Попробуйте позже', variant: 'destructive' })
      }
    } catch {}
  }

  const loginWithOtp = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signIn('email-otp', { email, code: otpCode, redirect: false })
      if (result?.error) {
        toast({ title: 'Ошибка', description: 'Неверный код', variant: 'destructive' })
      } else {
        toast({ title: 'Успешный вход', description: 'Вы успешно вошли в систему' })
        await redirectByRole()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.03),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.03),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(0,0,0,0.02),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_40%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              EQWIP
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Вход в систему</CardTitle>
            <CardDescription className="text-gray-900 dark:text-gray-300">Войдите, чтобы получить доступ к вашей учётной записи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                Войти
              </Button>
            </form>

            {otpRequested && (
              <form onSubmit={loginWithOtp} className="space-y-2 mt-4">
                <Label htmlFor="otp" className="text-gray-700 dark:text-gray-200">Код из письма</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <div className="pl-9">
                    <InputOTP maxLength={6} value={otpCode} onChange={(v) => setOtpCode(v.replace(/\D+/g, ''))}>
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} className="h-10 w-10 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !otpCode}>
                  Подтвердить
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={requestOtp} disabled={resendIn > 0}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Отправить ещё раз {resendIn > 0 ? `(${resendIn}s)` : ''}
                </Button>
              </form>
            )}

            {/* Links: Forgot password / Registration */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 pt-2">
              <Link href="/auth/forgot-password" className="hover:underline">
                Забыли пароль?
              </Link>
              <Link href="/auth/register" className="hover:underline">
                Регистрация
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}