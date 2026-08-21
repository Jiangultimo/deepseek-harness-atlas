'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { EdgeKind, RegionId } from '@/content/types'
import {
  BLOCKS_BY_REGION,
  BLOCK_BY_ID,
  EDGES,
  EDGE_KIND_BY_ID,
  REGIONS,
  REGION_BY_ID,
  REGION_EDGES,
} from '@/content/map'
import { LOCALE_LABEL, LOCALES, type Locale, t, ui } from '@/content/i18n'
import type { View } from './Scene'
import { ArchivePanel } from './ArchivePanel'

const Scene = dynamic(() => import('./Scene').then((m) => m.Scene), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">◍ ◍ ◍</div>
    </div>
  ),
})

export function AtlasShell({ locale }: { locale: Locale }) {
  const [view, setView] = useState<View>({ level: 'world' })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [resetNonce, setResetNonce] = useState(0)
  /** 窄屏没有 3D，档案就地展开 */
  const [mobileOpen, setMobileOpen] = useState<string | null>(null)
  /** 图例默认收起，加载后弹两下提示可以点开 */
  const [panelOpen, setPanelOpen] = useState(false)
  const router = useRouter()
  /** 抽屉是否铺满整屏；换地块时保持这个偏好 */
  const [expanded, setExpanded] = useState(false)

  const enterRegion = useCallback((region: RegionId) => {
    setView({ level: 'region', region })
  }, [])

  const selectBlock = useCallback((id: string) => {
    setView({ level: 'block', region: BLOCK_BY_ID[id].region, block: id })
  }, [])

  /** 逐级返回：地块 → 板块 → 总览 */
  const goBack = useCallback(() => {
    setExpanded(false)
    setView((v) =>
      v.level === 'block'
        ? { level: 'region', region: v.region }
        : v.level === 'region'
          ? { level: 'world' }
          : v,
    )
  }, [])

  const recenter = useCallback(() => setResetNonce((n) => n + 1), [])

  const selectedId = view.level === 'block' ? view.block : null
  const activeRegion = view.level === 'world' ? null : view.region

  const { linkedIds, outgoing, incoming } = useMemo(() => {
    if (!selectedId) return { linkedIds: new Set<string>(), outgoing: [], incoming: [] }
    const out = EDGES.filter((e) => e.from === selectedId)
    const inc = EDGES.filter((e) => e.to === selectedId)
    const ids = new Set<string>()
    out.forEach((e) => ids.add(e.to))
    inc.forEach((e) => ids.add(e.from))
    return { linkedIds: ids, outgoing: out, incoming: inc }
  }, [selectedId])

  const selected = selectedId ? BLOCK_BY_ID[selectedId] : null
  const hovered = hoveredId ? BLOCK_BY_ID[hoveredId] : null

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper">
      <div className={`absolute inset-0 z-0 hidden ${expanded ? "md:hidden" : "md:block"}`}>
        <Scene
          view={view}
          locale={locale}
          linkedIds={linkedIds}
          resetNonce={resetNonce}
          signLabel={ui('signLabel', locale)}
          signHint={ui('signHint', locale)}
          onOpenReport={() => router.push(`/${locale}/report`)}
          onEnterRegion={enterRegion}
          onSelectBlock={selectBlock}
          onBack={goBack}
          onHover={setHoveredId}
        />
      </div>

      <div className="absolute inset-0 overflow-y-auto md:hidden">
        <MobileIndex openId={mobileOpen} onOpen={setMobileOpen} locale={locale} />
      </div>

      {/* 图名、文章入口、板块清单合成一块可收起的牌子 */}
      <div className="absolute left-0 top-0 z-30 hidden p-6 md:block">
        {!panelOpen ? (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="atlas-nudge group flex items-center gap-2.5 rounded-full border-2 border-line bg-paper/95 py-2.5 pl-3.5 pr-4 shadow-[0_2px_0_rgba(59,44,28,0.12)] transition-colors hover:border-accent"
            aria-expanded={false}
            aria-label={ui('expandLegend', locale)}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" fill="none">
              <path
                d="M2.5 5.2 7 3.4l6 2.2 4.5-1.8v11.4L13 17l-6-2.2-4.5 1.8z"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M7 3.4v11.4M13 5.6V17" stroke="var(--accent)" strokeWidth="1.2" />
            </svg>
            <span className="text-[13.5px] font-[660] tracking-[-0.01em] text-ink">
              {ui('brand', locale)}
            </span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 16 16"
              aria-hidden="true"
              fill="none"
              className="text-ink-faint transition-transform group-hover:translate-y-0.5"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="w-[320px] rounded-2xl border-2 border-line bg-paper/96 p-5 shadow-[0_3px_0_rgba(59,44,28,0.10)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-accent">
                  {ui('eyebrow', locale)}
                </p>
                <h1 className="mt-1.5 whitespace-nowrap text-[19px] font-[660] leading-tight tracking-[-0.022em] text-ink">
                  {ui('brand', locale)}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label={ui('collapseLegend', locale)}
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-paper-2 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                  <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>


            <p className="mb-2 mt-5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
              {ui('regionsHeading', locale)}
            </p>
            <ul className="flex flex-col gap-px">
              {REGIONS.map((region) => {
                const active = activeRegion === region.id
                const links = REGION_EDGES.filter(
                  (e) => e.from === region.id || e.to === region.id,
                ).reduce((n, e) => n + e.count, 0)
                return (
                  <li key={region.id}>
                    <button
                      type="button"
                      onClick={() => enterRegion(region.id)}
                      className="group flex w-full items-center gap-2.5 py-[3px] text-left"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-opacity"
                        style={{
                          background: region.color,
                          opacity: activeRegion && !active ? 0.28 : 1,
                        }}
                      />
                      <span
                        className={`text-[13px] transition-colors ${
                          active ? 'font-[620] text-ink' : 'text-ink-2 group-hover:text-ink'
                        }`}
                      >
                        {t(region.name, locale)}
                      </span>
                      <span className="ml-auto font-mono text-[9.5px] text-ink-faint">
                        {BLOCKS_BY_REGION[region.id].length}
                        {ui('blocksUnit', locale)} · {links}
                        {ui('roadsUnit', locale)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {activeRegion && (
              <p className="mt-3 border-l-2 border-line pl-3 text-[12px] leading-relaxed text-ink-mute">
                {t(REGION_BY_ID[activeRegion].blurb, locale)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-0 right-0 z-30 hidden p-7 text-right md:block">
        <div className="flex justify-end gap-2">
          <div className="pointer-events-auto flex overflow-hidden rounded-full border-2 border-line bg-paper/90">
            {LOCALES.map((code) => (
              <Link
                key={code}
                href={`/${code}`}
                aria-current={code === locale ? 'page' : undefined}
                className={`px-3 py-1 text-[12px] font-[620] transition-colors ${
                  code === locale
                    ? 'bg-accent text-paper'
                    : 'text-ink-2 hover:text-accent'
                }`}
              >
                {LOCALE_LABEL[code]}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={recenter}
            className="pointer-events-auto rounded-full border-2 border-line bg-paper/90 px-3.5 py-1 text-[12px] font-[620] text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            {ui('recenter', locale)}
          </button>
          {view.level !== 'world' && (
            <button
              type="button"
              onClick={goBack}
              className="pointer-events-auto rounded-full border-2 border-accent/50 bg-accent-wash px-3.5 py-1 text-[12px] font-[620] text-accent-2 transition-colors hover:border-accent"
            >
              {ui('backOneLevel', locale)} <span className="font-mono text-[10px]">Esc</span>
            </button>
          )}
        </div>
      </div>

      {hovered && !selected && (
        <div className="pointer-events-none absolute left-1/2 top-7 z-40 hidden -translate-x-1/2 md:block">
          <div className="rounded-full border-2 border-line bg-paper/95 px-4 py-1.5 shadow-sm">
            <p className="text-[13px] text-ink-2">{t(hovered.subtitle, locale)}</p>
          </div>
        </div>
      )}

      {/* 地块档案抽屉：默认贴右侧，可铺满整屏 */}
      <aside
        aria-hidden={!selected}
        className={`absolute top-0 z-50 hidden flex-col border-l-2 border-doc-line bg-doc-ground transition-all duration-300 md:flex ${
          selected ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
        } ${expanded ? 'left-0 right-0 h-full border-l-0' : 'right-0 h-full w-[440px]'}`}
      >
        {selected && (
          <>
            <div className="flex items-start justify-between gap-4 border-b-2 border-doc-line-soft px-6 py-5">
              <div className="min-w-0">
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-[700]"
                  style={{
                    background: `${REGION_BY_ID[selected.region].color}1F`,
                    color: REGION_BY_ID[selected.region].color,
                  }}
                >
                  {t(REGION_BY_ID[selected.region].name, locale)}
                </span>
                <h2 className="mt-2 text-[24px] font-[660] leading-tight tracking-[-0.02em] text-doc-ink">
                  {t(selected.title, locale)}
                </h2>
                <p className="mt-1 truncate font-mono text-[11px] text-doc-ink-faint">
                  {selected.code}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  aria-label={ui(expanded ? 'collapseFullscreen' : 'expandFullscreen', locale)}
                  title={ui(expanded ? 'collapseFullscreen' : 'expandFullscreen', locale)}
                  className="rounded-lg p-2 text-doc-ink-faint transition-colors hover:bg-doc-surface hover:text-doc-accent"
                >
                  {expanded ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                      <path d="M6.5 2v4.5H2M9.5 14V9.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                      <path d="M2 6V2h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  aria-label={ui('closePanel', locale)}
                  className="rounded-lg p-2 text-doc-ink-faint transition-colors hover:bg-doc-surface hover:text-doc-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ArchivePanel
                key={selected.id}
                block={selected}
                region={REGION_BY_ID[selected.region]}
                locale={locale}
                wide={expanded}
                onJump={selectBlock}
              />

              {(outgoing.length > 0 || incoming.length > 0) && (
                <div className={expanded ? 'mx-auto w-full max-w-[1080px] px-10 pb-10' : 'px-6 pb-8'}>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-doc-ink-faint">
                    {ui('blockRoads', locale)}
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {outgoing.map((e, i) => (
                      <RoadRow key={`o${i}`} kind={e.kind} label={e.label ? t(e.label, locale) : undefined}
                        other={t(BLOCK_BY_ID[e.to].title, locale)} direction="out"
                        locale={locale}
                        onGo={() => selectBlock(e.to)} />
                    ))}
                    {incoming.map((e, i) => (
                      <RoadRow key={`i${i}`} kind={e.kind} label={e.label ? t(e.label, locale) : undefined}
                        other={t(BLOCK_BY_ID[e.from].title, locale)} direction="in"
                        locale={locale}
                        onGo={() => selectBlock(e.from)} />
                    ))}
                  </ul>
                </div>
              )}
              <div className="h-10" />
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function RoadRow({
  kind, label, other, direction, locale, onGo,
}: {
  kind: EdgeKind
  label?: string
  other: string
  direction: 'in' | 'out'
  locale: Locale
  onGo: () => void
}) {
  const meta = EDGE_KIND_BY_ID[kind]
  return (
    <li>
      <button type="button" onClick={onGo} className="group w-full text-left">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.08em]" style={{ color: meta.color }}>
            {direction === 'out' ? '→' : '←'} {t(meta.name, locale)}
          </span>
          <span className="truncate text-[13.5px] text-doc-ink transition-colors group-hover:text-doc-accent">
            {other}
          </span>
        </div>
        {label && <p className="mt-0.5 text-[12px] leading-snug text-doc-ink-mute">{label}</p>}
      </button>
    </li>
  )
}

function MobileIndex({
  openId,
  onOpen,
  locale,
}: {
  openId: string | null
  onOpen: (id: string | null) => void
  locale: Locale
}) {
  const open = openId ? BLOCK_BY_ID[openId] : null

  if (open) {
    return (
      <div className="min-h-full bg-doc-ground">
        <div className="sticky top-0 z-10 border-b border-doc-line bg-doc-ground/95 px-5 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => onOpen(null)}
            className="flex items-center gap-2 text-[13px] text-doc-ink-mute"
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
            {ui('backToList', locale)}
          </button>
        </div>
        <div className="px-5 pb-16 pt-5">
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-[700]"
            style={{
              background: `${REGION_BY_ID[open.region].color}1F`,
              color: REGION_BY_ID[open.region].color,
            }}
          >
            {t(REGION_BY_ID[open.region].name, locale)}
          </span>
          <h1 className="mt-2.5 text-[27px] font-[660] leading-tight tracking-[-0.022em] text-doc-ink">
            {t(open.title, locale)}
          </h1>
          <p className="mt-1 font-mono text-[11px] text-doc-ink-faint">{open.code}</p>
        </div>
        <ArchivePanel
          key={open.id}
          block={open}
          region={REGION_BY_ID[open.region]}
          locale={locale}
          wide={false}
          onJump={onOpen}
        />
        <div className="h-12" />
      </div>
    )
  }

  return (
    <div className="px-5 pb-16 pt-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Architecture Atlas</p>
      <h1 className="mt-2 text-[26px] font-[660] leading-tight tracking-[-0.024em] text-ink">
        DeepSeek Harness 地图
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-mute">
        {ui('mobileNote', locale)}
      </p>

      <Link
        href={`/${locale}/report`}
        className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-doc-accent/35 bg-doc-accent-wash px-4 py-2 text-[13.5px] font-[640] text-doc-accent-ink"
      >
        {ui('reportTitle', locale)}
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="none">
          <path d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <div className="mt-8 flex flex-col gap-8">
        {REGIONS.map((region) => (
          <section key={region.id}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: region.color }} />
              <h2 className="text-[16px] font-[660] text-ink">{t(region.name, locale)}</h2>
            </div>
            <p className="mb-3.5 text-[13px] leading-relaxed text-ink-mute">{t(region.blurb, locale)}</p>
            <ul className="flex flex-col gap-px overflow-hidden rounded-xl border-2 border-line">
              {BLOCKS_BY_REGION[region.id].map((block) => (
                <li key={block.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(block.id)}
                    className="block w-full bg-paper-2 px-4 py-3.5 text-left transition-colors active:bg-sand"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-[620] text-ink">{t(block.title, locale)}</span>
                      <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                        {block.loc > 0 ? `${block.loc.toLocaleString()}${ui('linesUnit', locale)}` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">{t(block.subtitle, locale)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
