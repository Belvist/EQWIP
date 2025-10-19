'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Сброс пароля пока не реализован. Мы пришлём письмо, когда подключим почтовый сервис.')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Восстановление пароля</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">Укажите email для сброса пароля</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white" required />
                </div>
              </div>
              <Button type="submit" className="w-full">Отправить ссылку</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}


