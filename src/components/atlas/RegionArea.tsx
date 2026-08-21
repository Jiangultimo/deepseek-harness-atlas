'use client'

import { useMemo } from 'react'
import { Html, Outlines } from '@react-three/drei'
import { Color, type Texture } from 'three'
import type { Region } from '@/content/types'
import { BLOCKS_BY_REGION, SPACE, regionBounds } from '@/content/map'
import { type Locale, t } from '@/content/i18n'
import { hashSeed, islandGeometry, seeded } from './style'

/** world = 总览时的一整块板；active = 已进入，露出岛上的建筑；faded = 别处，只留轮廓做方位参照 */
export type RegionMode = 'world' | 'active' | 'faded'

interface Props {
  region: Region
  locale: Locale
  mode: RegionMode
  toonMap: Texture
  onEnter: (id: Region['id']) => void
}

const INK = '#3B2C1C'

/**
 * 一整片板块。总览时它是一块厚实的陆地，写着名字和地块数；
 * 进入之后它退成一层薄薄的地基，把注意力让给上面的建筑。
 */
export function RegionArea({ region, locale, mode, toonMap, onEnter }: Props) {
  const b = regionBounds(region.id)
  const seed = hashSeed(region.id)
  const blocks = BLOCKS_BY_REGION[region.id]

  // 总览时板块更厚，像一块可以拿起来的拼图
  const depth = mode === 'world' ? 1.05 : 0.3
  const geo = useMemo(
    () => islandGeometry(b.w * 0.99, b.d * 1.0, seed, depth),
    [b.w, b.d, seed, depth],
  )

  // 浪花用同一个种子放大生成，轮廓与海岸完全同形，所以能严丝合缝地围一圈
  const foamGeo = useMemo(
    () => islandGeometry(b.w * 0.99 * 1.075, b.d * 1.0 * 1.075, seed, 0.07),
    [b.w, b.d, seed],
  )
  const surfGeo = useMemo(
    () => islandGeometry(b.w * 0.99 * 1.15, b.d * 1.0 * 1.15, seed, 0.04),
    [b.w, b.d, seed],
  )

  const grass = useMemo(() => {
    const mix = mode === 'world' ? 0.2 : 0.34
    return `#${new Color(region.color).lerp(new Color('#FFF6E4'), mix).getHexString()}`
  }, [region.color, mode])

  /** 岛上的装饰只在进入后出现；总览要干净 */
  const props = useMemo(() => {
    if (mode !== 'active') return []
    const rand = seeded(seed ^ 0x9e37)
    const out: { x: number; z: number; kind: 'tree' | 'rock'; s: number; r: number }[] = []
    let guard = 0
    while (out.length < 7 && guard++ < 260) {
      const x = b.cx + (rand() - 0.5) * b.w * 0.88
      const z = b.cz + (rand() - 0.5) * b.d * 0.88
      if (
        blocks.some(
          (bl) =>
            Math.abs(bl.pos.x - x) < SPACE.footprint.w * 0.78 &&
            Math.abs(bl.pos.z - z) < SPACE.footprint.d * 0.95,
        )
      )
        continue
      if (out.some((p) => Math.hypot(p.x - x, p.z - z) < 1.15)) continue
      out.push({ x, z, kind: rand() > 0.34 ? 'tree' : 'rock', s: 0.72 + rand() * 0.5, r: rand() * Math.PI })
    }
    return out
  }, [mode, b.cx, b.cz, b.w, b.d, blocks, seed])

  const opacity = mode === 'faded' ? 0.34 : 1
  const y = mode === 'world' ? -depth + 0.02 : -depth

  return (
    <group>
      {/* 外圈碎浪 */}
      <mesh geometry={surfGeo} position={[b.cx, -0.5, b.cz]}>
        <meshBasicMaterial color="#CFE9E4" transparent opacity={mode === 'faded' ? 0.22 : 0.42} />
      </mesh>
      {/* 贴岸的白浪 */}
      <mesh geometry={foamGeo} position={[b.cx, -0.47, b.cz]}>
        <meshBasicMaterial color="#EDF8F4" transparent opacity={mode === 'faded' ? 0.3 : 0.72} />
      </mesh>

      <mesh
        geometry={geo}
        position={[b.cx, y, b.cz]}
        receiveShadow
        castShadow={mode === 'world'}
        onPointerOver={(e) => {
          if (mode !== 'world') return
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          if (mode !== 'world') return
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          if (mode !== 'world') return
          e.stopPropagation()
          onEnter(region.id)
        }}
      >
        <meshToonMaterial color={grass} gradientMap={toonMap} transparent opacity={opacity} />
        {mode !== 'faded' && (
          <Outlines thickness={mode === 'world' ? 0.1 : 0.075} color={INK} opacity={0.75} transparent />
        )}
      </mesh>

      {props.map((p, i) =>
        p.kind === 'tree' ? (
          <Tree key={i} x={p.x} z={p.z} s={p.s} r={p.r} color={region.color} toonMap={toonMap} />
        ) : (
          <Rock key={i} x={p.x} z={p.z} s={p.s} r={p.r} toonMap={toonMap} />
        ),
      )}

      {mode !== 'faded' && (
        <Html
          position={
            mode === 'world'
              ? [b.cx, 1.5, b.cz]
              : [region.label.x, 0.42, region.label.z]
          }
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none', transition: 'opacity 240ms ease' }}
        >
          <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
            <div
              style={{
                fontSize: mode === 'world' ? 19 : 15,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: region.color,
                background: 'rgba(250,244,232,0.94)',
                border: `2px solid ${region.color}`,
                borderRadius: 999,
                padding: mode === 'world' ? '5px 18px 6px' : '3px 13px 4px',
                boxShadow: '0 2px 0 rgba(59,44,28,0.16)',
              }}
            >
              {t(region.name, locale)}
            </div>
            {mode === 'world' && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: INK,
                  WebkitTextStroke: '3.5px rgba(250,244,232,0.95)',
                  paintOrder: 'stroke fill',
                }}
              >
                {locale === 'en'
                  ? `${blocks.length} plots · click to enter`
                  : `${blocks.length} 块地 · 点击进入`}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

function Tree({
  x, z, s, r, color, toonMap,
}: { x: number; z: number; s: number; r: number; color: string; toonMap: Texture }) {
  const leaf = useMemo(
    () => `#${new Color(color).lerp(new Color('#8FB96A'), 0.62).getHexString()}`,
    [color],
  )
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]} scale={s}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.1, 0.44, 7]} />
        <meshToonMaterial color="#8A6A45" gradientMap={toonMap} />
        <Outlines thickness={0.03} color={INK} opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshToonMaterial color={leaf} gradientMap={toonMap} />
        <Outlines thickness={0.032} color={INK} opacity={0.7} transparent />
      </mesh>
      <mesh position={[0.2, 0.5, 0.12]} castShadow>
        <sphereGeometry args={[0.26, 9, 7]} />
        <meshToonMaterial color={leaf} gradientMap={toonMap} />
        <Outlines thickness={0.032} color={INK} opacity={0.7} transparent />
      </mesh>
    </group>
  )
}

function Rock({
  x, z, s, r, toonMap,
}: { x: number; z: number; s: number; r: number; toonMap: Texture }) {
  return (
    <mesh position={[x, 0.15 * s, z]} rotation={[0.2, r, 0.1]} scale={s} castShadow>
      <dodecahedronGeometry args={[0.27, 0]} />
      <meshToonMaterial color="#B9A98C" gradientMap={toonMap} />
      <Outlines thickness={0.03} color={INK} opacity={0.7} transparent />
    </mesh>
  )
}
