"use client"

import * as React from "react"

interface PrintOnLoadProps {
  enabled?: boolean
  selector?: string
}

export default function PrintOnLoad({ enabled, selector = "#resume-print" }: PrintOnLoadProps) {
  React.useEffect(() => {
    if (!enabled) return
    const doPrint = () => {
      try {
        const node = document.querySelector(selector)
        if (!node) { window.print(); return }
        const all = Array.from(document.body.children) as HTMLElement[]
        const prev: Array<{ el: HTMLElement; display: string }> = []
        all.forEach((el) => { if (el === node) return; prev.push({ el, display: el.style.display }); el.style.display = 'none' })
        window.print()
        prev.forEach(({ el, display }) => (el.style.display = display))
      } catch { window.print() }
    }
    // небольшая задержка, чтобы страница успела дорендериться
    const id = setTimeout(doPrint, 300)
    return () => clearTimeout(id)
  }, [enabled, selector])

  return null
}


