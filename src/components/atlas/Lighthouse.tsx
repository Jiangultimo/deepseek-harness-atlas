'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Outlines } from '@react-three/drei'
import {
  AdditiveBlending,
  Color,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshToonMaterial,
  type PointLight,
  type Texture,
} from 'three'

const INK = '#3B2C1C'
/** 灯闪一次的周期。真实灯塔就是这个节奏，太快会显得慌 */
/**
 * 火光不是按周期开关的灯，是一团在喘气的东西。
 * 三条互质频率的正弦叠加，永远不会重复出同一个亮度曲线，
 * 看久了也不会察觉到循环。
 */
/** 火焰的两端色：弱的时候偏赤，旺的时候偏橙黄 */
const EMBER = new Color('#E24A12')
const BLAZE = new Color('#FFA136')
/** 每帧复用，避免在渲染循环里不停 new Color */
const flameColor = new Color()

function firelight(t: number): number {
  const slow = Math.sin(t * 1.15)
  const mid = Math.sin(t * 2.37 + 1.7) * 0.55
  const fast = Math.sin(t * 4.61 + 0.4) * 0.22
  // 归一化到 0..1，再压一下让暗的时候不至于全灭
  return 0.42 + ((slow + mid + fast) / 1.77) * 0.34
}

interface Props {
  position: [number, number]
  label: string
  hint: string
  toonMap: Texture
  onOpen: () => void
}

/**
 * 立在礁石上的灯塔，指向那篇架构解剖。
 * 灯每三秒多闪一次，光束同时缓慢扫过海面——在一张会自转的地图上，
 * 一个按自己节奏发光的东西比一块安静的牌子更抓眼睛。
 */
export function Lighthouse({ position, label, hint, toonMap, onOpen }: Props) {
  const root = useRef<Group>(null)
  const lamp = useRef<Mesh>(null)
  const glow = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const [hovered, setHovered] = useState(false)
  const [x, z] = position

  /** 塔身的红白环带：与其贴图，不如直接叠几节，绘本本来就该看得出笔触 */
  const bands = useMemo(
    () => [
      { y: 0.62, h: 1.24, rt: 0.42, rb: 0.52, color: '#F2E7D2' },
      { y: 1.72, h: 0.96, rt: 0.35, rb: 0.42, color: '#C2551F' },
      { y: 2.56, h: 0.72, rt: 0.3, rb: 0.35, color: '#F2E7D2' },
    ],
    [],
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // 随浪轻轻起伏
    if (root.current) {
      root.current.position.y = Math.sin(t * 0.85) * 0.05
      root.current.rotation.z = Math.sin(t * 0.6) * 0.012
    }

    const flame = firelight(t) * (hovered ? 1.35 : 1)
    // 亮度和颜色一起动：火弱下去会发赤，旺起来才转橙黄，只调亮度会像个调光灯泡
    flameColor.copy(EMBER).lerp(BLAZE, Math.min(1, flame))

    const mat = lamp.current?.material as MeshToonMaterial | undefined
    if (mat) {
      mat.emissive.copy(flameColor)
      mat.emissiveIntensity = 0.8 + flame * 2.4
    }
    if (glow.current) {
      // 光晕跟着火光胀缩，幅度比亮度小一档，否则会像在跳
      glow.current.scale.setScalar(0.86 + flame * 0.3)
      const gm = glow.current.material as MeshBasicMaterial
      gm.opacity = 0.12 + flame * 0.34
      gm.color.copy(flameColor)
    }
    if (light.current) {
      light.current.intensity = 3 + flame * 14
      light.current.color.copy(flameColor)
    }
  })

  const enter = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }
  const leave = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }
  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onOpen()
  }

  return (
    <group position={[x, 0, z]} ref={root}>
      {/* 礁石：让塔有个落脚点，不至于浮在水面上 */}
      <mesh position={[0, -0.12, 0]} rotation={[0.12, 0.6, 0.06]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.95, 0]} />
        <meshToonMaterial color="#9E8E72" gradientMap={toonMap} />
        <Outlines thickness={0.04} color={INK} opacity={0.7} transparent />
      </mesh>

      <group onPointerOver={enter} onPointerOut={leave} onClick={click}>
        {bands.map((b, i) => (
          <mesh key={i} position={[0, b.y, 0]} castShadow>
            <cylinderGeometry args={[b.rt, b.rb, b.h, 14]} />
            <meshToonMaterial color={b.color} gradientMap={toonMap} />
            <Outlines thickness={0.04} color={INK} opacity={0.8} transparent />
          </mesh>
        ))}

        {/* 观景台 */}
        <mesh position={[0, 2.98, 0]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.13, 16]} />
          <meshToonMaterial color="#8A6A45" gradientMap={toonMap} />
          <Outlines thickness={0.04} color={INK} opacity={0.8} transparent />
        </mesh>

        {/* 灯室与灯 */}
        <mesh ref={lamp} position={[0, 3.32, 0]}>
          <cylinderGeometry args={[0.27, 0.29, 0.5, 12]} />
          <meshToonMaterial
            color="#FFE3C0"
            emissive="#FF7A1A"
            emissiveIntensity={1}
            gradientMap={toonMap}
          />
          <Outlines thickness={0.04} color={INK} opacity={0.75} transparent />
        </mesh>

        {/* 塔顶 */}
        <mesh position={[0, 3.74, 0]} castShadow>
          <coneGeometry args={[0.36, 0.42, 14]} />
          <meshToonMaterial color="#C2551F" gradientMap={toonMap} />
          <Outlines thickness={0.04} color={INK} opacity={0.8} transparent />
        </mesh>
      </group>

      {/* 灯周围的光晕 */}
      <mesh ref={glow} position={[0, 3.32, 0]}>
        <sphereGeometry args={[0.52, 16, 12]} />
        <meshBasicMaterial
          color="#FF8C2E"
          transparent
          opacity={0.2}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <pointLight ref={light} position={[0, 3.32, 0]} color="#FF7E28" intensity={2} distance={16} />


      <Html position={[0, 4.5, 0]} center zIndexRange={[35, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            whiteSpace: 'nowrap',
            textAlign: 'center',
            transform: `scale(${hovered ? 1.07 : 1})`,
            transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontSize: 13.5,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: INK,
              background: 'rgba(250,244,232,0.95)',
              border: `2px solid ${hovered ? '#C2551F' : '#DCCBAB'}`,
              borderRadius: 999,
              padding: '3px 13px 4px',
              boxShadow: '0 2px 0 rgba(59,44,28,0.16)',
              transition: 'border-color 200ms ease',
            }}
          >
            {label}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#9A6A3A',
              textShadow: '0 0 6px rgba(250,244,232,0.95)',
            }}
          >
            {hint}
          </div>
        </div>
      </Html>
    </group>
  )
}
