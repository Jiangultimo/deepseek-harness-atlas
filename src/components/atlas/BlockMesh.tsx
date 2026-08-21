'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Outlines, RoundedBox } from '@react-three/drei'
import { Color, type Group, type Texture } from 'three'
import type { Block } from '@/content/types'
import { REGION_BY_ID, SPACE, blockHeight } from '@/content/map'
import { type Locale, t } from '@/content/i18n'
import { hashSeed, seeded } from './style'

interface Props {
  block: Block
  locale: Locale
  selected: boolean
  linked: boolean
  dimmed: boolean
  toonMap: Texture
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const INK = '#3B2C1C'

/**
 * 一座小建筑。占地固定，高度是真实源码行数——矮的像小屋，
 * 高的像塔。屋顶用同色系更亮的一档，加上墨线描边，是绘本的基本笔法。
 */
export function BlockMesh({
  block,
  locale,
  selected,
  linked,
  dimmed,
  toonMap,
  onSelect,
  onHover,
}: Props) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const region = REGION_BY_ID[block.region]
  const h = blockHeight(block)
  const raised = hovered || selected

  /** 每座建筑给一点固定的歪斜，手绘的东西不会横平竖直 */
  const tilt = useMemo(() => {
    const rand = seeded(hashSeed(block.id))
    return {
      yaw: (rand() - 0.5) * 0.11,
      roofYaw: (rand() - 0.5) * 0.16,
      roofScale: 1.04 + rand() * 0.06,
    }
  }, [block.id])

  const { wall, roof } = useMemo(() => {
    const base = new Color(region.color)
    const roofColor = base.clone().lerp(new Color('#FFF3DF'), 0.2)
    const wallColor = base.clone()
    return { wall: `#${wallColor.getHexString()}`, roof: `#${roofColor.getHexString()}` }
  }, [region.color])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const k = 1 - Math.exp(-13 * delta)
    const targetY = raised ? h / 2 + 0.32 : h / 2
    g.position.y += (targetY - g.position.y) * k
  })

  const roofH = 0.3
  // 世界单位：地块宽 3.3，墨线取 0.05 量级才是一条线而不是一层壳
  const outlineW = selected ? 0.085 : 0.05
  const opacity = dimmed ? 0.36 : 1

  return (
    <group position={[block.pos.x, h / 2, block.pos.z]} rotation={[0, tilt.yaw, 0]} ref={group}>
      {/* 墙身 */}
      <RoundedBox
        args={[SPACE.footprint.w, h, SPACE.footprint.d]}
        radius={0.16}
        smoothness={5}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover(block.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(block.id)
        }}
      >
        <meshToonMaterial
          color={wall}
          gradientMap={toonMap}
          transparent
          opacity={opacity}
        />
        {!dimmed && <Outlines thickness={outlineW} color={INK} opacity={0.9} transparent />}
      </RoundedBox>

      {/* 屋顶：略大、略歪、更亮的一档 */}
      <group position={[0, h / 2 + roofH / 2 - 0.03, 0]} rotation={[0, tilt.roofYaw, 0]}>
        <RoundedBox
          args={[
            SPACE.footprint.w * tilt.roofScale,
            roofH,
            SPACE.footprint.d * tilt.roofScale,
          ]}
          radius={0.13}
          smoothness={5}
          castShadow
        >
          <meshToonMaterial
            color={roof}
            gradientMap={toonMap}
            transparent
            opacity={opacity}
          />
          {!dimmed && <Outlines thickness={outlineW} color={INK} opacity={0.9} transparent />}
        </RoundedBox>
      </group>

      {/* 选中时脚下一圈手绘光环 */}
      {selected && (
        <mesh position={[0, -h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[SPACE.footprint.w * 0.66, SPACE.footprint.w * 0.76, 40]} />
          <meshBasicMaterial color={INK} transparent opacity={0.45} />
        </mesh>
      )}

      <Html
        position={[0, h / 2 + roofH + 0.2, 0]}
        center
        zIndexRange={[40, 0]}
        style={{
          pointerEvents: 'none',
          opacity: dimmed ? 0.28 : 1,
          transition: 'opacity 240ms ease',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transform: `translateY(${raised ? -5 : 0}px)`,
            transition: 'transform 180ms ease',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.01em',
              color: INK,
              WebkitTextStroke: '3.5px rgba(250,244,232,0.92)',
              paintOrder: 'stroke fill',
            }}
          >
            {t(block.title, locale)}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: region.color,
              WebkitTextStroke: '3px rgba(250,244,232,0.95)',
              paintOrder: 'stroke fill',
              marginTop: 1,
              opacity: raised ? 1 : 0,
              transition: 'opacity 160ms ease',
            }}
          >
            {block.loc > 0
              ? `${block.loc.toLocaleString()}${locale === 'en' ? ' lines' : ' 行'}`
              : locale === 'en'
                ? 'analysis'
                : '分析记录'}
          </div>
        </div>
      </Html>
    </group>
  )
}
