'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const redirectByRole = async () => {
    const session = await getSession()
    const role = (session as any)?.user?.role
    if (role === 'ADMIN') {
      router.push('/admin')
    } else if (role === 'EMPLOYER') {
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
      const result = await signIn('credentials', { 
        email, 
        password, 
        redirect: false 
      })
      
      if (result?.error) {
        toast({ 
          title: 'Ошибка входа', 
          description: 'Неверный email или пароль', 
          variant: 'destructive' 
        })
      } else {
        toast({ 
          title: 'Успешный вход', 
          description: 'Вы успешно вошли в систему' 
        })
        await redirectByRole()
      }
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Произошла ошибка при входе", 
        variant: "destructive" 
      })
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
                    placeholder="admin@eqwip.com"
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
                    placeholder="123456"
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
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            {/* Тестовые аккаунты */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Тестовые аккаунты:</h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div><strong>admin@eqwip.com</strong> - Администратор</div>
                <div><strong>employer1@eqwip.com</strong> - TechCorp HR</div>
                <div><strong>candidate1@eqwip.com</strong> - Александр Иванов</div>
                <div className="text-gray-500">Пароль для всех: <strong>123456</strong></div>
              </div>
            </div>

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