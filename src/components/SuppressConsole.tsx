'use client'

import { useEffect } from 'react'

export default function SuppressConsole() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const methods: Array<keyof Console> = ['log', 'debug', 'info', 'warn', 'error', 'trace']
    const originals: Partial<Record<keyof Console, any>> = {}
    for (const m of methods) {
      originals[m] = console[m]
      // No-op to prevent leaking sensitive info into browser console
      console[m] = (() => {}) as any
    }
    return () => {
      for (const m of methods) {
        if (originals[m]) console[m] = originals[m] as any
      }
    }
  }, [])
  return null
}


