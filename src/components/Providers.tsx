'use client'

import { SessionProvider } from 'next-auth/react'
import { UserProvider } from '@/contexts/UserContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  )
}