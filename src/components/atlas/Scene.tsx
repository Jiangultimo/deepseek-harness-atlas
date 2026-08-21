'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { EdgeKind, RegionId } from '@/content/types'
import {
  BLOCKS,
  BLOCKS_BY_REGION,
  BLOCK_BY_ID,
  REGIONS,
  blockPosition,
  mapBounds,
  regionBounds,
} from '@/content/map'
import { BlockMesh } from './BlockMesh'
import { RegionArea } from './RegionArea'
import { BlockRoads, RegionRoads } from './Roads'
import { Lighthouse } from './Lighthouse'
import { makeSeaTexture, makeToonGradient } from './style'
import type { Locale } from '@/content/i18n'

/** 两级导航：总览看板块，进入某片才看具体地块 */
export type View =
  | { level: 'world' }
  | { level: 'region'; region: RegionId }
  | { level: 'block'; region: RegionId; block: string }

interface SceneProps {
  view: View
  locale: Locale
  hiddenKinds: Set<EdgeKind>
  linkedIds: Set<string>
  resetNonce: number
  signLabel: string
  signHint: string
  onOpenReport: () => void
  onEnterRegion: (id: RegionId) => void
  onSelectBlock: (id: string) => void
  onBack: () => void
  onHover: (id: string | null) => void
}

const MAP = mapBounds()

/** 停手多久之后开始自转 */
const IDLE_DELAY_MS = 3500
/** 转一圈约一分半。再慢就看不出在动了，再快会打扰读字 */
const AUTO_ROTATE_SPEED = 0.6

const OVERVIEW = {
  target: new Vector3(MAP.cx - 2, 0, MAP.cz),
  position: new Vector3(MAP.cx - 2, 40, MAP.cz + 37),
}

function desiredFor(view: View) {
  if (view.level === 'block') {
    const [x, y, z] = blockPosition(BLOCK_BY_ID[view.block])
    return {
      target: new Vector3(x, y, z),
      position: new Vector3(x + 2, y + 17, z + 19),
    }
  }
  if (view.level === 'region') {
    const b = regionBounds(view.region)
    const reach = Math.max(b.w, b.d)
    return {
      target: new Vector3(b.cx, 0, b.cz),
      position: new Vector3(b.cx, reach * 1.25 + 6, b.cz + reach * 0.95 + 5),
    }
  }
  return { target: OVERVIEW.target.clone(), position: OVERVIEW.position.clone() }
}

/**
 * 相机只在视图切换后的一小段时间里接管；到位、超时、或用户一动手，
 * 立刻把控制权还回去，之后绝不再写 camera.position。
 * 闲置几秒后开始缓慢自转，用户一碰立即停。
 */
function CameraRig({
  view,
  resetNonce,
  suppressSpin,
}: {
  view: View
  resetNonce: number
  suppressSpin: boolean
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()
  const animating = useRef(false)
  const elapsed = useRef(0)
  const placed = useRef(false)
  const idle = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      idle.current = true
    }, IDLE_DELAY_MS)
  }, [])

  const wake = useCallback(() => {
    idle.current = false
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = null
  }, [])

  useEffect(() => {
    armIdle()
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [armIdle])

  const key =
    view.level === 'block' ? `b:${view.block}` : view.level === 'region' ? `r:${view.region}` : 'w'
  const desired = useMemo(() => desiredFor(view), [key])

  useEffect(() => {
    animating.current = true
    elapsed.current = 0
    wake()
  }, [key, resetNonce, wake])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c) return

    if (!placed.current) {
      c.target.copy(desired.target)
      camera.position.copy(desired.position)
      c.update()
      placed.current = true
      animating.current = false
      armIdle()
      return
    }

    // 不接管时也要 update，阻尼才有惯性；但绝不写 position/target
    if (!animating.current) {
      // 读文章的时候别在背后转，其余时候闲置几秒就自己转起来
      c.autoRotate = idle.current && !suppressSpin
      c.update()
      return
    }
    // 飞行中一律不自转，否则两股力会打架
    c.autoRotate = false

    const k = 1 - Math.exp(-4 * delta)
    c.target.lerp(desired.target, k)
    camera.position.lerp(desired.position, k)
    c.update()

    elapsed.current += delta
    // 阻尼与角度钳制会让残差稳定在零点几，所以阈值放宽，
    // 再加一个硬超时——飞行动画绝不能变成永久接管。
    const settled =
      camera.position.distanceTo(desired.position) < 0.35 &&
      c.target.distanceTo(desired.target) < 0.35
    if (settled || elapsed.current > 2.5) {
      animating.current = false
      armIdle()
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={90}
      maxPolarAngle={Math.PI * 0.46}
      minPolarAngle={0.05}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      // 用户一开始操作就交权，比 addEventListener 可靠：ref 挂载时机不用操心
      onStart={() => {
        animating.current = false
        wake()
      }}
      onEnd={armIdle}
    />
  )
}

function useKeyboard(view: View, onSelectBlock: (id: string) => void, onBack: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack()
        return
      }
      if (view.level !== 'block') return
      const peers = BLOCKS_BY_REGION[view.region]
      const i = peers.findIndex((b) => b.id === view.block)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        onSelectBlock(peers[(i + 1) % peers.length].id)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onSelectBlock(peers[(i - 1 + peers.length) % peers.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, onSelectBlock, onBack])
}

/** 海面：两层波纹以不同速度反向漂移，叠出「水在动」而不是贴图在滚 */
function Sea() {
  const near = useMemo(() => makeSeaTexture(), [])
  const far = useMemo(() => {
    const t = makeSeaTexture()
    t.repeat.set(5, 5)
    return t
  }, [])

  useFrame((_, delta) => {
    near.offset.x += delta * 0.004
    near.offset.y -= delta * 0.0022
    far.offset.x -= delta * 0.0026
    far.offset.y += delta * 0.0015
  })

  return (
    <group>
      <mesh position={[MAP.cx, -0.52, MAP.cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP.w + 150, MAP.d + 150]} />
        <meshBasicMaterial map={far} />
      </mesh>
      <mesh position={[MAP.cx, -0.5, MAP.cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP.w + 150, MAP.d + 150]} />
        <meshBasicMaterial map={near} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

export function Scene({
  view,
  locale,
  hiddenKinds,
  linkedIds,
  resetNonce,
  signLabel,
  signHint,
  onOpenReport,
  onEnterRegion,
  onSelectBlock,
  onBack,
  onHover,
}: SceneProps) {
  useKeyboard(view, onSelectBlock, onBack)
  const toonMap = useMemo(makeToonGradient, [])

  const activeRegion = view.level === 'world' ? null : view.region
  const selectedId = view.level === 'block' ? view.block : null

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      camera={{ fov: 38, near: 0.1, far: 400, position: OVERVIEW.position.toArray() }}
      gl={{ antialias: true }}
      onPointerMissed={onBack}
    >
      <color attach="background" args={['#7FB0BA']} />
      <fog attach="fog" args={['#8CB9C1', 78, 168]} />

      {/* 绘本要平光：卡通着色本身给形体，方向光只负责让屋顶和墙分档 */}
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#FFFAF0', '#D9C8A8', 0.5]} />
      <directionalLight
        position={[14, 24, 16]}
        intensity={1.35}
        color="#FFF6E4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-radius={7}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      <Sea />

      <Suspense fallback={null}>
        {REGIONS.map((region) => (
          <RegionArea
            key={region.id}
            region={region}
            locale={locale}
            mode={
              activeRegion === null ? 'world' : activeRegion === region.id ? 'active' : 'faded'
            }
            toonMap={toonMap}
            onEnter={onEnterRegion}
          />
        ))}

        {/* 只在总览立着：进了某片地之后它在视野之外，留着也是噪音 */}
        {activeRegion === null && (
          <Lighthouse
            position={[MAP.minX + 3.2, MAP.maxZ - 5.5]}
            label={signLabel}
            hint={signHint}
            toonMap={toonMap}
            onOpen={onOpenReport}
          />
        )}

        {activeRegion === null ? (
          <RegionRoads onEnter={onEnterRegion} />
        ) : (
          <BlockRoads
            activeRegion={activeRegion}
            selectedId={selectedId}
            hiddenKinds={hiddenKinds}
            onPick={onSelectBlock}
          />
        )}

        {/* 建筑只在进入某片之后出现；总览保持干净 */}
        {activeRegion !== null &&
          BLOCKS.filter((b) => b.region === activeRegion).map((block) => (
            <BlockMesh
              key={block.id}
              block={block}
              locale={locale}
              selected={selectedId === block.id}
              linked={linkedIds.has(block.id)}
              dimmed={selectedId !== null && selectedId !== block.id && !linkedIds.has(block.id)}
              toonMap={toonMap}
              onSelect={onSelectBlock}
              onHover={onHover}
            />
          ))}
      </Suspense>

      <CameraRig view={view} resetNonce={resetNonce} suppressSpin={view.level === 'block'} />
    </Canvas>
  )
}
