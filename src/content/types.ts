/**
 * 内容模型：地图的区域划分、块的平面位置与地形高度、块之间的道路，
 * 以及点进去看到的完整技术档案。
 *
 * 所有给人看的字段都是双语的 I18nText，取值统一走 t(text, locale)。
 */

import type { I18nText } from './i18n'

export type RegionId =
  | 'foundation'
  | 'core'
  | 'context'
  | 'execution'
  | 'frontier'
  | 'composition'
  | 'meta'

export interface Region {
  id: RegionId
  /** 区域名 */
  name: I18nText
  /** 一句话说明这片地方管什么 */
  blurb: I18nText
  /** 区域主色 */
  color: string
  /** 区域标牌在平面上的位置 */
  label: { x: number; z: number }
  /** 离岸：单独一块地，与大陆之间画海峡 */
  offshore?: boolean
}

/** 依赖层级。地图不再展示它，保留是因为它仍是这块地的真实属性，将来可能用得上 */
export type LayerId = 0 | 1 | 2 | 3 | 4 | 5

/** 证据强度：这块内容我是怎么知道的。目前不在页面上展示，只作为写作时的自我约束 */
export type Confidence = 'read' | 'agent' | 'docs'

export interface Block {
  id: string
  /** 块名，地图上显示 */
  title: I18nText
  /** 包路径标识 */
  code: string
  /** 一句话：这块干什么 */
  subtitle: I18nText
  region: RegionId
  /** 平面坐标；y 由代码量决定 */
  pos: { x: number; z: number }
  /** 真实源码行数，决定这块地形有多高 */
  loc: number
  /** 依赖层级，0 是地基 */
  layer: LayerId
  /** 区域的中心块，视觉强调 */
  keystone?: boolean
}

/** 四种道路，对应插件与主循环之间真实存在的四条通道 */
export type EdgeKind = 'call' | 'intercept' | 'register' | 'implement'

export interface Edge {
  from: string
  to: string
  kind: EdgeKind
  /** 这条路具体在传什么 */
  label?: I18nText
}

export interface EdgeKindMeta {
  id: EdgeKind
  name: I18nText
  /** 方向读法：from ___ to */
  reading: I18nText
  color: string
  dashed: boolean
}

// ── 档案 ────────────────────────────────────────────────

export interface Mechanism {
  name: string
  how: string
  why?: string
}

export interface Lesson {
  lesson: string
  why: string
}

export interface CodeRef {
  path: string
  note: string
}

export interface Section {
  heading: string
  /** 段落数组；支持 **粗体**、`代码`，以及以 "- " 开头的列表行 */
  body: string[]
}

export interface Archive {
  id: string
  lede: string
  packages: string[]
  confidence: Confidence
  sections: Section[]
  mechanisms: Mechanism[]
  lessons: Lesson[]
  tradeoffs: string[]
  codeIndex: CodeRef[]
  related: string[]
}
