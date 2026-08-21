'use client'

import { useEffect, useState } from 'react'
import type { Archive, Block, Region } from '@/content/types'
import { highlightsOf } from '@/content/highlights'
import { BLOCK_BY_ID, REGION_BY_ID } from '@/content/map'
import { type Locale, t, ui } from '@/content/i18n'
import { Prose, inline } from '@/components/Prose'

/**
 * 档案按需加载：22 份合计 8.7 万字，全部打进首屏太重。
 * 加载过的留在内存里，来回切换不重复请求。
 */
const cache = new Map<string, Archive>()

const cacheKey = (id: string, locale: Locale) => `${locale}/${id}`

function useArchive(id: string, locale: Locale) {
  const [archive, setArchive] = useState<Archive | null>(() => cache.get(cacheKey(id, locale)) ?? null)
  const [loading, setLoading] = useState(!cache.has(cacheKey(id, locale)))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const key = cacheKey(id, locale)
    const hit = cache.get(key)
    if (hit) {
      setArchive(hit)
      setLoading(false)
      setFailed(false)
      return
    }
    let alive = true
    setLoading(true)
    setFailed(false)
    import(`@/content/archives/${locale}/${id}.json`)
      .then((mod) => {
        if (!alive) return
        const data = (mod.default ?? mod) as Archive
        cache.set(key, data)
        setArchive(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setFailed(true)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id, locale])

  return { archive, loading, failed }
}

interface Props {
  block: Block
  region: Region
  locale: Locale
  /** 全屏时正文放宽成双栏 */
  wide: boolean
  onJump: (id: string) => void
}

export function ArchivePanel({ block, region, locale, wide, onJump }: Props) {
  const { archive, loading, failed } = useArchive(block.id, locale)
  const written = (archive?.sections.length ?? 0) > 0

  return (
    <div className={wide ? 'mx-auto w-full max-w-[1080px] px-10 py-9' : 'px-6 py-6'}>
      <p className="max-w-[34em] text-[15.5px] leading-relaxed text-doc-ink-2">{t(block.subtitle, locale)}</p>

      {loading && (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-doc-ink-faint">
          {ui('loadingArchive', locale)}
        </p>
      )}

      {failed && (
        <p className="mt-8 text-[14px] text-doc-ink-mute">{ui('archiveFailed', locale)}</p>
      )}

      {archive && !written && <PendingNotice id={block.id} locale={locale} />}

      {archive && written && (
        <>
          {archive.lede && (
            <div
              className="mt-6 border-l-[3px] pl-6"
              style={{ borderColor: region.color }}
            >
              <div className="prose-cn prose-lede">
                <Prose body={archive.lede.split('\n').map((t) => t.trim()).filter(Boolean)} />
              </div>
            </div>
          )}

          <div className={wide ? 'mt-10 grid gap-14 lg:grid-cols-[minmax(0,1fr)_260px]' : 'mt-8'}>
            <div className="min-w-0">
              {archive.sections.map((section, i) => (
                <section key={i} className="mb-10">
                  <h3 className="mb-3.5 text-[20px] font-[660] leading-snug tracking-[-0.016em] text-doc-ink">
                    {section.heading}
                  </h3>
                  <Prose body={section.body} />
                </section>
              ))}

              {archive.mechanisms.length > 0 && (
                <section className="mb-10">
                  <h3 className="mb-4 text-[20px] font-[660] tracking-[-0.016em] text-doc-ink">
                    {ui('mechanisms', locale)}
                  </h3>
                  <div className="flex flex-col gap-px overflow-hidden rounded-xl border-2 border-doc-line">
                    {archive.mechanisms.map((m, i) => (
                      <div key={i} className="bg-doc-surface px-5 py-4">
                        <h4 className="mb-1.5 text-[15px] font-[660] text-doc-ink">{m.name}</h4>
                        <p className="text-[13.5px] leading-relaxed text-doc-ink-2">{inline(m.how)}</p>
                        {m.why && (
                          <p
                            className="mt-2 border-l-2 pl-3 text-[13px] leading-relaxed text-doc-ink-mute"
                            style={{ borderColor: region.color }}
                          >
                            {inline(m.why)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {archive.lessons.length > 0 && (
                <section className="mb-10">
                  <h3 className="mb-4 text-[20px] font-[660] tracking-[-0.016em] text-doc-ink">
                    {ui('lessons', locale)}
                  </h3>
                  <ul className="flex flex-col gap-4">
                    {archive.lessons.map((l, i) => (
                      <li key={i} className="border-l-2 border-doc-accent pl-4">
                        <p className="text-[14.5px] font-[620] leading-snug text-doc-ink">
                          {inline(l.lesson)}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-doc-ink-mute">
                          {inline(l.why)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {archive.tradeoffs.length > 0 && (
                <section className="mb-10">
                  <h3 className="mb-4 text-[20px] font-[660] tracking-[-0.016em] text-doc-ink">
                    {ui('tradeoffs', locale)}
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {archive.tradeoffs.map((t, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-doc-warn" />
                        <span className="text-[13.5px] leading-relaxed text-doc-ink-2">{inline(t)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className={wide ? 'flex flex-col gap-7' : 'mt-2 flex flex-col gap-7'}>
              {archive.packages.length > 0 && (
                <Meta title={ui('packages', locale)}>
                  <ul className="flex flex-col gap-1">
                    {archive.packages.map((p) => (
                      <li key={p} className="break-all font-mono text-[11.5px] leading-relaxed text-doc-ink-mute">
                        {p}
                      </li>
                    ))}
                  </ul>
                </Meta>
              )}

              {archive.codeIndex.length > 0 && (
                <Meta title={ui('codeIndex', locale)}>
                  <ul className="flex flex-col gap-3">
                    {archive.codeIndex.map((c, i) => (
                      <li key={i}>
                        <p className="break-all font-mono text-[11.5px] leading-snug" style={{ color: region.color }}>
                          {c.path}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-doc-ink-mute">{c.note}</p>
                      </li>
                    ))}
                  </ul>
                </Meta>
              )}

              {archive.related.length > 0 && (
                <Meta title={ui('related', locale)}>
                  <ul className="flex flex-col gap-1.5">
                    {archive.related
                      .filter((r) => BLOCK_BY_ID[r])
                      .map((r) => (
                        <li key={r}>
                          <button
                            type="button"
                            onClick={() => onJump(r)}
                            className="group text-left text-[13.5px] text-doc-ink-mute transition-colors hover:text-doc-accent"
                          >
                            {t(BLOCK_BY_ID[r].title, locale)}
                            <span
                              className="ml-1.5 text-[10.5px]"
                              style={{ color: REGION_BY_ID[BLOCK_BY_ID[r].region].color }}
                            >
                              {t(REGION_BY_ID[BLOCK_BY_ID[r].region].name, locale)}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </Meta>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

function Meta({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-doc-ink-faint">
        {title}
      </p>
      {children}
    </div>
  )
}

function PendingNotice({ id, locale }: { id: string; locale: Locale }) {
  const highlights = highlightsOf(id, locale)
  return (
    <div className="mt-7">
      <div className="mb-7 rounded-xl border-2 border-doc-warn/40 bg-doc-warn/[0.08] px-4 py-3">
        <p className="text-[13.5px] leading-relaxed text-doc-ink-2">
          {ui('archivePending', locale)}
        </p>
      </div>
      <ul className="flex flex-col gap-3.5">
        {highlights.map((h, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-doc-accent" />
            <span className="text-[14px] leading-relaxed text-doc-ink-2">{inline(h)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
