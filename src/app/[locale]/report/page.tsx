import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import reportZh from '@/content/article/report.zh.json'
import reportEn from '@/content/article/report.en.json'
import { type Locale, isLocale, ui } from '@/content/i18n'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/report'>): Promise<Metadata> {
  const { locale } = await params
  const zh = locale !== 'en'
  return {
    title: zh ? '架构解剖 · DeepSeek Harness 地图' : 'Architecture Dissection · DeepSeek Harness Atlas',
    description: zh
      ? '这套架构的完整分析：四个核心设计观念、可迁移的经验清单，以及经过独立核实的代价与弱点。'
      : 'A full read of this architecture: four core design ideas, a list of what you can take away, and an independently verified account of what it costs.',
  }
}

/**
 * 这篇长文原本是独立产出的分析报告，整篇搬进来。
 * 它自带一套排版样式，变量已全部加上 doc- 前缀并限定在容器内，
 * 所以不会和地图那套暖色 token 打架。
 */
export default async function ReportPage({ params }: PageProps<'/[locale]/report'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const report = (locale as Locale) === 'en' ? reportEn : reportZh

  return (
    <div className="min-h-dvh bg-doc-ground">
      <div className="sticky top-0 z-20 border-b border-doc-line bg-doc-ground/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-6 py-3.5">
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center gap-2 text-[13px] text-doc-ink-mute transition-colors hover:text-doc-accent"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M13 8H4m0 0l3.5-3.5M4 8l3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {ui('backToMap', locale)}
          </Link>
          <span className="text-doc-line">/</span>
          <span className="truncate text-[13px] text-doc-ink-2">{ui('reportTitle', locale)}</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: scopeStyle(report.style) }} />
      <div
        className="dsh-report"
        dangerouslySetInnerHTML={{ __html: report.body }}
      />
    </div>
  )
}

/**
 * 把原样式里的每条选择器限定到 .dsh-report 之下。
 * 报告里的 body / html 规则直接丢掉——它现在只是页面的一部分，不再是整页。
 */
function scopeStyle(css: string): string {
  return css
    .split('}')
    .map((chunk) => {
      const i = chunk.indexOf('{')
      if (i === -1) return chunk
      const head = chunk.slice(0, i)
      const rest = chunk.slice(i)
      // @media / @supports 之类的块头原样保留
      if (head.includes('@') || head.trim().startsWith(':root')) return chunk
      const scoped = head
        .split(',')
        .map((sel) => {
          const t = sel.trim()
          if (!t) return sel
          if (t === 'body' || t === 'html') return `.dsh-report`
          if (t === '*') return `.dsh-report *`
          return `.dsh-report ${t}`
        })
        .join(', ')
      return scoped + rest
    })
    .join('}')
}
