'use client'

import { useEffect, useState } from 'react'

interface ThemedLogoProps {
  className?: string
  alt?: string
}

export default function ThemedLogo({ className = 'h-8 md:h-9 w-auto object-contain', alt = 'EQWIP logo' }: ThemedLogoProps) {
  const [src, setSrc] = useState('/eqwipdark.png')

  useEffect(() => {
    const computeIsDark = (): boolean => {
      try {
        if (typeof document !== 'undefined') {
          if (document.documentElement.classList.contains('dark')) return true
        }
        if (typeof window !== 'undefined' && window.matchMedia) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
      } catch {}
      return false
    }

    const apply = () => setSrc(computeIsDark() ? '/eqwipwhile.png' : '/eqwipdark.png')

    // init
    apply()

    // observe <html class="dark"> changes
    let observer: MutationObserver | undefined
    try {
      observer = new MutationObserver(apply)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    } catch {}

    // watch OS theme changes as fallback
    let mql: MediaQueryList | undefined
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => apply()
      mql.addEventListener ? mql.addEventListener('change', handler) : mql.addListener(handler)
      return () => {
        observer?.disconnect()
        if (mql) {
          mql.removeEventListener ? mql.removeEventListener('change', handler) : mql.removeListener(handler)
        }
      }
    } catch {
      return () => observer?.disconnect()
    }
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="sync"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement
        const path = new URL(img.src).pathname
        if (path.endsWith('/eqwipdark.png')) img.src = '/eqwipwhile.png'
        else if (path.endsWith('/eqwipwhile.png')) img.src = '/eqwipwhite.png'
        else img.src = '/logo.svg'
      }}
    />
  )
}


