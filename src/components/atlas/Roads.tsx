'use client'

import { useMemo } from 'react'
import { Html, Line } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import type { Edge, EdgeKind, RegionId } from '@/content/types'
import {
  BLOCK_BY_ID,
  EDGES,
  EDGE_KIND_BY_ID,
  REGION_BY_ID,
  REGION_EDGES,
  SPACE,
  regionCenter,
} from '@/content/map'
import { hashSeed, trailPoints } from './style'

const INK = '#3B2C1C'

interface Built {
  points: Vector3[]
  head: { pos: Vector3; dir: Vector3 }
  mid: Vector3
}

function buildTrail(
  from: [number, number],
  to: [number, number],
  sway: number,
  seed: number,
  y: number = SPACE.roadY,
): Built {
  const curve = trailPoints(from, to, y, sway, seed)
  return {
    points: curve.getPoints(56),
    head: { pos: curve.getPoint(0.87), dir: curve.getTangent(0.87).normalize() },
    mid: curve.getPoint(0.5),
  }
}

// ── 板块级：总览时看「哪两片地方在打交道、有多密」 ──────────

export function RegionRoads({ onEnter }: { onEnter: (id: RegionId) => void }) {
  const roads = useMemo(() => {
    const pair = new Map<string, number>()
    return REGION_EDGES.map((re) => {
      const key = [re.from, re.to].sort().join('|')
      const n = pair.get(key) ?? 0
      pair.set(key, n + 1)
      const sway = (n % 2 === 0 ? 1 : -1) * (1.1 + Math.floor(n / 2) * 1.3)
      return {
        re,
        built: buildTrail(regionCenter(re.from), regionCenter(re.to), sway, hashSeed(key), 1.15),
      }
    })
  }, [])

  return (
    <group>
      {roads.map(({ re, built }, i) => {
        const meta = EDGE_KIND_BY_ID[re.kinds[0]]
        // 通道越粗表示底下的具体依赖越多
        const width = 2.2 + Math.min(re.count, 8) * 0.85
        return (
          <group key={i}>
            <Line points={built.points} color={INK} lineWidth={width + 2.4} transparent opacity={0.22} />
            <Line
              points={built.points}
              color={meta.color}
              lineWidth={width}
              transparent
              opacity={0.85}
              onClick={(e) => {
                e.stopPropagation()
                onEnter(re.to)
              }}
            />
            <ArrowHead pos={built.head.pos} dir={built.head.dir} color={meta.color} opacity={0.9} scale={1.5} />
            <Html position={built.mid} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: REGION_BY_ID[re.to].color,
                  background: 'rgba(250,244,232,0.94)',
                  border: `1.5px solid ${REGION_BY_ID[re.to].color}`,
                  borderRadius: 999,
                  padding: '1px 8px 2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {re.count}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ── 地块级：进入某片之后看具体是谁调谁 ─────────────────────

interface BlockRoadsProps {
  activeRegion: RegionId
  selectedId: string | null
  hiddenKinds: Set<EdgeKind>
  onPick: (id: string) => void
}

export function BlockRoads({ activeRegion, selectedId, hiddenKinds, onPick }: BlockRoadsProps) {
  const roads = useMemo(() => {
    const pair = new Map<string, number>()
    const relevant = EDGES.filter(
      (e) =>
        BLOCK_BY_ID[e.from].region === activeRegion ||
        BLOCK_BY_ID[e.to].region === activeRegion,
    )
    return relevant.map((edge) => {
      const a = BLOCK_BY_ID[edge.from]
      const b = BLOCK_BY_ID[edge.to]
      const key = [edge.from, edge.to].sort().join('|')
      const n = pair.get(key) ?? 0
      pair.set(key, n + 1)
      const sway = (n % 2 === 0 ? 1 : -1) * (0.75 + Math.floor(n / 2) * 0.95)
      return {
        edge,
        built: buildTrail(
          [a.pos.x, a.pos.z],
          [b.pos.x, b.pos.z],
          sway,
          hashSeed(`${edge.from}->${edge.to}:${edge.kind}`),
        ),
      }
    })
  }, [activeRegion])

  return (
    <group>
      {roads.map(({ edge, built }, i) => {
        if (hiddenKinds.has(edge.kind)) return null
        const meta = EDGE_KIND_BY_ID[edge.kind]
        const touches = selectedId === null || edge.from === selectedId || edge.to === selectedId
        const active = selectedId !== null && touches
        const opacity = selectedId === null ? 0.78 : touches ? 1 : 0.05
        const width = active ? 4.2 : 2.6

        return (
          <group key={i}>
            <Line
              points={built.points}
              color={INK}
              lineWidth={width + 2.2}
              transparent
              opacity={opacity * 0.3}
              dashed={meta.dashed}
              dashSize={0.5}
              gapSize={0.34}
            />
            <Line
              points={built.points}
              color={meta.color}
              lineWidth={width}
              transparent
              opacity={opacity}
              dashed={meta.dashed}
              dashSize={0.5}
              gapSize={0.34}
              onClick={(e) => {
                e.stopPropagation()
                onPick(edge.to)
              }}
            />
            <ArrowHead
              pos={built.head.pos}
              dir={built.head.dir}
              color={meta.color}
              opacity={opacity}
              scale={active ? 1.3 : 1.05}
            />
          </group>
        )
      })}
    </group>
  )
}

function ArrowHead({
  pos, dir, color, opacity, scale,
}: { pos: Vector3; dir: Vector3; color: string; opacity: number; scale: number }) {
  const quaternion = useMemo(() => {
    const q = new Quaternion()
    q.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize())
    return q
  }, [dir])

  return (
    <group position={pos} quaternion={quaternion} scale={scale}>
      <mesh>
        <coneGeometry args={[0.19, 0.44, 12]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh scale={1.22}>
        <coneGeometry args={[0.19, 0.44, 12]} />
        <meshBasicMaterial color={INK} transparent opacity={opacity * 0.32} />
      </mesh>
    </group>
  )
}
