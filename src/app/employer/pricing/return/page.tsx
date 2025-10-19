'use client'

import { useEffect, useState } from 'react'

export default function PricingReturn() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'fail'>('checking')

  useEffect(() => {
    const paymentId = new URLSearchParams(window.location.search).get('paymentId')
    const check = async () => {
      if (!paymentId) { setStatus('fail'); return }
      try {
        const res = await fetch('/api/subscriptions/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        })
        const data = await res.json()
        if (res.ok && data.ok) setStatus('ok'); else setStatus('fail')
      } catch { setStatus('fail') }
      setTimeout(() => { window.location.href = '/employer/pricing' }, 1500)
    }
    check()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-white/90">
        {status === 'checking' && 'Проверяем оплату...'}
        {status === 'ok' && 'Оплата успешна. Активируем тариф...'}
        {status === 'fail' && 'Не удалось подтвердить оплату.'}
      </div>
    </div>
  )
}


