import {
  CatmullRomCurve3,
  DataTexture,
  ExtrudeGeometry,
  NearestFilter,
  RedFormat,
  RepeatWrapping,
  Shape,
  Texture,
  Vector2,
  Vector3,
} from 'three'

/**
 * 绘本风格的三件底料：卡通着色用的分级贴图、纸纹、以及可复现的伪随机。
 * 都在客户端一次性构建，场景挂载时通过 useMemo 缓存。
 */

/** 卡通着色的分级贴图：把连续光照压成四档，才有绘本的平涂感。 */
export function makeToonGradient(): DataTexture {
  const steps = new Uint8Array([96, 152, 202, 246])
  const tex = new DataTexture(steps, steps.length, 1, RedFormat)
  tex.minFilter = NearestFilter
  tex.magFilter = NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

/** 确定性伪随机：同样的种子永远给同一张地图，避免每次刷新岛的形状都在变。 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** 把字符串折成一个整数种子。 */
export function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 手绘纸纹：暖白底 + 颗粒 + 几道纤维。作为海面的贴图，
 * 让整张图看起来是画在纸上而不是渲染在虚空里。
 */
export function makePaperTexture(size = 512): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = seeded(20260821)

  ctx.fillStyle = '#F6EEDC'
  ctx.fillRect(0, 0, size, size)

  // 颗粒
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 15
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  // 纤维：几十道极淡的短弧，模拟纸浆纹理
  ctx.strokeStyle = 'rgba(180,158,120,0.10)'
  ctx.lineWidth = 1
  for (let i = 0; i < 90; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = 18 + rand() * 52
    const ang = rand() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (rand() - 0.5) * 12,
      y + Math.sin(ang) * len * 0.5 + (rand() - 0.5) * 12,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    )
    ctx.stroke()
  }

  const tex = new Texture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(6, 6)
  tex.needsUpdate = true
  return tex
}

/**
 * 有机岛屿轮廓：在椭圆基底上叠三条不同频率的正弦扰动。
 * 用解析函数而不是随机点连线，得到的边界天然平滑，不需要再做样条。
 */
export function islandShape(w: number, d: number, seed: number): Shape {
  const rand = seeded(seed)
  const p1 = rand() * Math.PI * 2
  const p2 = rand() * Math.PI * 2
  const p3 = rand() * Math.PI * 2
  const a1 = 0.055 + rand() * 0.03
  const a2 = 0.032 + rand() * 0.022
  const a3 = 0.018 + rand() * 0.014

  const pts: Vector2[] = []
  const N = 96
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2
    const wobble =
      1 + a1 * Math.sin(3 * t + p1) + a2 * Math.sin(5 * t + p2) + a3 * Math.sin(8 * t + p3)
    pts.push(new Vector2(Math.cos(t) * (w / 2) * wobble, Math.sin(t) * (d / 2) * wobble))
  }

  const shape = new Shape()
  shape.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y)
  shape.closePath()
  return shape
}

/** 岛屿的挤出几何：带圆角斜面，边缘才不会像切开的蛋糕。 */
export function islandGeometry(w: number, d: number, seed: number, depth = 0.28) {
  const geo = new ExtrudeGeometry(islandShape(w, d, seed), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.18,
    bevelSegments: 3,
    curveSegments: 8,
  })
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

/**
 * 一条手绘感的路径：在直线基础上加轻微横向摆动，再用样条平滑。
 * 绘本地图上的路不会是直的。
 */
export function trailPoints(
  from: [number, number],
  to: [number, number],
  y: number,
  sway: number,
  seed: number,
) {
  const rand = seeded(seed)
  const [x0, z0] = from
  const [x1, z1] = to
  const dx = x1 - x0
  const dz = z1 - z0
  const len = Math.hypot(dx, dz)
  const nx = -dz / len
  const nz = dx / len

  const knots = 5
  const ctrl: Vector3[] = []
  for (let i = 0; i <= knots; i++) {
    const t = i / knots
    // 端点不摆动，中段摆幅最大
    const envelope = Math.sin(t * Math.PI)
    const off = (sway + (rand() - 0.5) * 0.45) * envelope
    ctrl.push(
      new Vector3(x0 + dx * t + nx * off, y + envelope * 0.06, z0 + dz * t + nz * off),
    )
  }
  return new CatmullRomCurve3(ctrl, false, 'catmullrom', 0.4)
}

/**
 * 手绘海面：水色打底，再撒一层classic 地图上那种「~」波纹。
 * 笔触在贴图四边各画一份镜像副本，所以平铺时不会露缝。
 */
export function makeSeaTexture(size = 512): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = seeded(19700101)

  // 底色：近岸浅、深处略沉，用一层斜向渐变带出水体的厚度
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#AFD3D2')
  grad.addColorStop(0.5, '#9CC6C9')
  grad.addColorStop(1, '#8FBCC3')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  /** 一笔波纹：两个小驼峰，像手写的 ~ */
  const stroke = (x: number, y: number, w: number, alpha: number) => {
    ctx.strokeStyle = `rgba(247,252,250,${alpha})`
    ctx.lineWidth = 1.6 + rand() * 1.1
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + w * 0.25, y - w * 0.22, x + w * 0.5, y)
    ctx.quadraticCurveTo(x + w * 0.75, y + w * 0.22, x + w, y)
    ctx.stroke()
  }

  for (let i = 0; i < 150; i++) {
    const x = rand() * size
    const y = rand() * size
    const w = 16 + rand() * 26
    const a = 0.3 + rand() * 0.4
    // 九宫格重复：贴图边缘的笔触也在对侧出现，平铺才连得上
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        stroke(x + dx, y + dy, w, a)
      }
    }
  }

  const tex = new Texture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(9, 9)
  tex.needsUpdate = true
  return tex
}
