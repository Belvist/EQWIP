"use client"

import { Button } from "@/components/ui/button"
import { Download, Share2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as React from "react"

interface ResumeActionsProps {
  sharePath?: string
  printSelector?: string
  className?: string
  resumeId?: string
}

export default function ResumeActions({ sharePath, className, resumeId }: ResumeActionsProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = React.useState(false)

  const getAbsoluteUrl = React.useCallback((): string => {
    try {
      const base = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : ""
      const path = sharePath || (typeof window !== "undefined" ? window.location.pathname : "/")
      return `${base}${path}`
    } catch {
      return sharePath || "/"
    }
  }, [sharePath])

  const handleShare = async () => {
    const url = getAbsoluteUrl()
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ url })
        return
      }
    } catch {}

    try {
      if (navigator.clipboard && (window as any).isSecureContext) {
        await navigator.clipboard.writeText(url)
        toast({ title: "Ссылка скопирована" })
        return
      }
    } catch {}

    try {
      const ta = document.createElement("textarea")
      ta.value = url
      ta.style.position = "fixed"
      ta.style.left = "-9999px"
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      toast({ title: ok ? "Ссылка скопирована" : "Не удалось скопировать ссылку" })
    } catch {
      toast({ title: "Не удалось скопировать ссылку" })
    }
  }

  const downloadBlob = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    if (isDownloading || !resumeId) return
    // Внутреннее модальное окно (простая реализация без внешних библиотек)
    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.background = 'rgba(0,0,0,.5)'
    overlay.style.zIndex = '9999'

    const box = document.createElement('div')
    box.style.position = 'absolute'
    box.style.left = '50%'
    box.style.top = '50%'
    box.style.transform = 'translate(-50%, -50%)'
    box.style.background = 'var(--background, #111)'
    box.style.color = 'var(--foreground, #fff)'
    box.style.border = '1px solid var(--border, #333)'
    box.style.borderRadius = '16px'
    box.style.padding = '20px'
    box.style.minWidth = '280px'
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)'
    box.innerHTML = `
      <div style="font-weight:600;font-size:16px;margin-bottom:12px">Скачать резюме</div>
      <div style="font-size:13px;opacity:.8;margin-bottom:10px">Выберите язык</div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button data-lang="ru" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--border,#333);background:#111;color:#fff">Русский</button>
        <button data-lang="en" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--border,#333);background:#111;color:#fff">English</button>
        <button data-lang="both" style="flex:1;padding:10px;border-radius:12px;border:1px solid var(--border,#333);background:#111;color:#fff">Оба</button>
      </div>
      <button data-close style="width:100%;padding:10px;border-radius:12px;border:1px solid var(--border,#333);background:#1f1f1f;color:#fff">Отмена</button>
    `
    overlay.appendChild(box)
    document.body.appendChild(overlay)

    const pick = await new Promise<'ru' | 'en' | 'both'>(resolve => {
      overlay.addEventListener('click', (e) => {
        const t = e.target as HTMLElement
        if (t?.getAttribute('data-close') !== null) { resolve('ru'); }
        const lg = t?.getAttribute('data-lang') as 'ru' | 'en' | 'both' | null
        if (lg) resolve(lg)
      }, { once: false })
    })
    document.body.removeChild(overlay)

    setIsDownloading(true)
    toast({ title: "Формирование PDF...", description: `Язык: ${pick}` })

    // 1) Основной путь: серверный endpoint (устойчивый, ATS-friendly)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf?lang=${pick}`, { cache: 'no-store', signal: AbortSignal.timeout(45000) })
      if (res.ok) {
        const blob = await res.blob()
        await downloadBlob(blob, `resume-${resumeId}.pdf`)
        toast({ title: "PDF скачан успешно!" })
        setIsDownloading(false)
        return
      }
      throw new Error(`Server responded ${res.status}`)
    } catch (e) {
      console.error('Server PDF failed:', e)
    }

    // 2) Резерв: HTML-заглушка (для диагностики окружения)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf-html`, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        const blob = await res.blob()
        await downloadBlob(blob, `resume-${resumeId}.html`)
        toast({ title: "Файл загружен (HTML). Проверьте PDF-эндпоинт позже." })
        setIsDownloading(false)
        return
      }
    } catch (e2) {
      console.error('HTML fallback failed:', e2)
    }

    toast({ title: "Ошибка при создании PDF", description: "Повторите попытку позже.", variant: "destructive" })
    setIsDownloading(false)
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 no-print">
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={handleDownloadPdf}
          disabled={isDownloading || !resumeId}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? "Формирование..." : "Скачать PDF"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          Поделиться
        </Button>
      </div>
    </div>
  )
}


