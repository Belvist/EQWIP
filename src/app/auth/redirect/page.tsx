'use client'

import { useEffect } from 'react'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const go = async () => {
      const session = await getSession()
      const role = (session as any)?.user?.role
      if (role === 'EMPLOYER') {
        router.replace('/employer')
      } else {
        router.replace('/profile')
      }
    }
    go()
  }, [router])

  return null
}


