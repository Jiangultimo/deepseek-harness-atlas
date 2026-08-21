import type { Block, Edge, EdgeKind, EdgeKindMeta, Region, RegionId } from './types'

/**
 * 七片地方。核心在正中，四周按「它和核心是什么关系」排布：
 * 地基在南、边界口岸在北、执行在东南、上下文在东、组合在西，
 * 工程体系是一座离岸的岛——它不属于运行时。
 */
export const REGIONS: Region[] = [
  {
    id: 'core',
    name: { zh: '驱动核心', en: 'The Driver' },
    blurb: { zh: '主循环和它声明依赖的那几样服务。循环自己只有 1643 行，围着它的那一圈才是产品。', en: 'The loop and the handful of services it declares a dependency on. The loop itself is 1,643 lines; the ring around it is the product.' },
    color: '#C2551F',
    label: { x: 0, z: -7.4 },
  },
  {
    id: 'context',
    name: { zh: '模型与上下文', en: 'Model & Context' },
    blurb: { zh: '决定模型看到什么：调哪个模型、上下文满了怎么办、额外资料怎么进来。', en: 'Everything that decides what the model sees: which model to call, what to do when the window fills up, how outside material gets in.' },
    color: '#B8860F',
    label: { x: 13.4, z: -9 },
  },
  {
    id: 'execution',
    name: { zh: '执行与委派', en: 'Doing & Delegating' },
    blurb: { zh: '让 agent 对外界做事：读写文件、跑命令、关进沙箱、派出子任务。', en: 'How the agent acts on the world: reading and writing files, running commands, confining processes, sending out sub-tasks.' },
    color: '#A85539',
    label: { x: 7.9, z: 15 },
  },
  {
    id: 'frontier',
    name: { zh: '边界口岸', en: 'The Ports' },
    blurb: { zh: '朝外的一侧：类型化 RPC、编辑器与外部工具协议、浏览器界面。', en: 'The outward-facing side: typed RPC, editor and external-tool protocols, the browser UI.' },
    color: '#3F8378',
    label: { x: 0, z: -16.6 },
  },
  {
    id: 'composition',
    name: { zh: '组合与自修改', en: 'Composition & Self-Editing' },
    blurb: { zh: '产品形态在这里决定，而且是数据不是代码；模型也能在这里改自己。', en: 'This is where the product\'s shape is decided — as data, not code. It\'s also where the model can edit itself.' },
    color: '#96597B',
    label: { x: -13.2, z: -9 },
  },
  {
    id: 'foundation',
    name: { zh: '地基', en: 'Bedrock' },
    blurb: { zh: '插件框架本身。全部 3,830 行，整张地图都压在这两块上。', en: 'The plugin framework itself. 3,830 lines total, and the whole map rests on these two.' },
    color: '#7A6B53',
    label: { x: -7.2, z: 15.4 },
  },
  {
    id: 'meta',
    name: { zh: '工程离岛', en: 'Process Island' },
    blurb: { zh: '不属于运行时，却可能是最可迁移的部分——以及这套架构真实的账单。', en: 'Not part of the runtime, yet probably the most portable part of all — plus the real bill this architecture runs up.' },
    color: '#56697C',
    label: { x: 17.8, z: 15.4 },
    offshore: true,
  },
]

export const REGION_BY_ID: Record<RegionId, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<RegionId, Region>

/**
 * 22 个地块。pos 是平面坐标，loc 是真实源码行数（决定地形高度）。
 * 核心区刻意排成一圈围着主循环：主循环声明的注入正好是它周围这几样。
 */
export const BLOCKS: Block[] = [
  {
    id: 'agent-loop',
    title: { zh: '主循环', en: 'The Loop' },
    code: 'core/agent-loop',
    subtitle: { zh: '回合与步的驱动器，整个产品的时间骨架', en: 'Driver of turns and steps — the product’s skeleton of time' },
    region: 'core',
    pos: { x: 0, z: 0 },
    loc: 1643,
    layer: 1,
    keystone: true,
  },
  {
    id: 'agent',
    title: { zh: 'Agent 接口', en: 'Agent Interface' },
    code: 'core/agent · core/scope',
    subtitle: { zh: '收件箱、事件路由、每个会话独立的注册作用域', en: 'Inbox, event routing, and a registration scope per session' },
    region: 'core',
    pos: { x: -4.8, z: -2.9 },
    loc: 2197,
    layer: 1,
  },
  {
    id: 'tools',
    title: { zh: '工具管线', en: 'Tool Pipeline' },
    code: 'core/tools',
    subtitle: { zh: '注册表、可见性解析、五段式执行管线', en: 'Registry, visibility resolution, and a five-stage execution pipeline' },
    region: 'core',
    pos: { x: 4.8, z: -2.9 },
    loc: 8728,
    layer: 1,
  },
  {
    id: 'session',
    title: { zh: '会话日志', en: 'Session Log' },
    code: 'core/session · session/*',
    subtitle: { zh: '只追加的流水账，模型历史每次从它算出来', en: 'An append-only ledger; model history is recomputed from it every time' },
    region: 'core',
    pos: { x: -4.8, z: 2.9 },
    loc: 16830,
    layer: 1,
  },
  {
    id: 'system-prompt',
    title: { zh: '提示词装配', en: 'Prompt Assembly' },
    code: 'core/system-prompt · context/*',
    subtitle: { zh: '段落、变量、工具清单，按序号带装配', en: 'Sections, variables and tool schemas, assembled by numbered bands' },
    region: 'core',
    pos: { x: 4.8, z: 2.9 },
    loc: 3991,
    layer: 1,
  },

  {
    id: 'llm',
    title: { zh: '模型接缝', en: 'Model Seam' },
    code: 'llm/*',
    subtitle: { zh: '流式词汇、适配器契约、错误分类与重试', en: 'Streaming vocabulary, adapter contract, error classification and retry' },
    region: 'context',
    pos: { x: 13.4, z: -5 },
    loc: 8040,
    layer: 2,
    keystone: true,
  },
  {
    id: 'compaction',
    title: { zh: '上下文压缩', en: 'Compaction' },
    code: 'compaction/* · token-meter',
    subtitle: { zh: '两种触发、区域选择、以遮蔽代替删除', en: 'Two triggers, region selection, shadowing instead of deletion' },
    region: 'context',
    pos: { x: 13.4, z: -1.2 },
    loc: 2880,
    layer: 2,
  },
  {
    id: 'skills-web',
    title: { zh: '技能与外部资料', en: 'Skills & Outside Material' },
    code: 'skill/* · web/* · attachment',
    subtitle: { zh: '按需加载的指令体、联网检索、附件存储', en: 'On-demand instruction bodies, web retrieval, attachment storage' },
    region: 'context',
    pos: { x: 13.4, z: 2.6 },
    loc: 6301,
    layer: 2,
  },

  {
    id: 'fs',
    title: { zh: '文件系统', en: 'Filesystem' },
    code: 'fs/*',
    subtitle: { zh: '不透明目标身份、意图事件、原子临界区', en: 'Opaque target identity, intent events, an atomic critical section' },
    region: 'execution',
    pos: { x: 4.9, z: 8.2 },
    loc: 5734,
    layer: 2,
  },
  {
    id: 'shell',
    title: { zh: '命令执行', en: 'Command Execution' },
    code: 'shell/* · subprocess/*',
    subtitle: { zh: '请求与规格分离、进程树、输出溢出', en: 'Request/spec split, process trees, output spill' },
    region: 'execution',
    pos: { x: 10.5, z: 8.2 },
    loc: 5568,
    layer: 2,
  },
  {
    id: 'subagent',
    title: { zh: '子任务编排', en: 'Sub-agents & Workflows' },
    code: 'subagent/* · workflow/* · jobs',
    subtitle: { zh: '一个接口装下三种子代，加上工作流引擎', en: 'One interface holding three kinds of child, plus a workflow engine' },
    region: 'execution',
    pos: { x: 4.9, z: 12.1 },
    loc: 18566,
    layer: 2,
    keystone: true,
  },
  {
    id: 'sandbox',
    title: { zh: '沙箱隔离', en: 'Sandboxing' },
    code: 'sandbox/* · terminal · lsp',
    subtitle: { zh: '交出 argv 换回约束力报告，失败即闭合', en: 'Hand over the argv, get back an enforcement report; fail closed' },
    region: 'execution',
    pos: { x: 10.5, z: 12.1 },
    loc: 8696,
    layer: 2,
  },

  {
    id: 'typert',
    title: { zh: '类型图 RPC', en: 'Typed RPC' },
    code: 'typert/* · api/*',
    subtitle: { zh: '构建期抽类型图，两端各自生成校验器', en: 'Extract a type graph at build time; both ends generate their own validators' },
    region: 'frontier',
    pos: { x: -6, z: -12.6 },
    loc: 10234,
    layer: 3,
    keystone: true,
  },
  {
    id: 'bridges',
    title: { zh: '协议桥接', en: 'Protocol Bridges' },
    code: 'sdk · acp · hooks · mcp',
    subtitle: { zh: '把外部协议翻译成内部事件，反之亦然', en: 'Translating foreign protocols into internal events, and back' },
    region: 'frontier',
    pos: { x: 0, z: -12.6 },
    loc: 5028,
    layer: 3,
  },
  {
    id: 'web-client',
    title: { zh: '浏览器界面', en: 'Browser UI' },
    code: 'client/* · host/*',
    subtitle: { zh: '同样是插件树，只不过跑在浏览器里', en: 'Also a plugin tree — it just happens to run in a browser' },
    region: 'frontier',
    pos: { x: 6, z: -12.6 },
    loc: 82337,
    layer: 3,
  },

  {
    id: 'patch-stack',
    title: { zh: '补丁栈组合', en: 'The Patch Stack' },
    code: 'boot/* · bundle/* · apps/cli',
    subtitle: { zh: '产品是打在空列表上的补丁层，不是程序', en: 'The product is a stack of patches over an empty list, not a program' },
    region: 'composition',
    pos: { x: -13.2, z: -5 },
    loc: 2884,
    layer: 4,
    keystone: true,
  },
  {
    id: 'preset',
    title: { zh: '会话预设', en: 'Session Presets' },
    code: 'preset/*',
    subtitle: { zh: '挂载一次，各会话靠作用域父子关系加入', en: 'Mounted once; sessions join it through scope parentage' },
    region: 'composition',
    pos: { x: -13.2, z: -1.2 },
    loc: 1783,
    layer: 4,
  },
  {
    id: 'self-modification',
    title: { zh: '运行时自修改', en: 'Runtime Self-Editing' },
    code: 'extensions/*',
    subtitle: { zh: '模型检视并挂载自己写的插件', en: 'The model inspects the live runtime and mounts plugins it wrote' },
    region: 'composition',
    pos: { x: -13.2, z: 2.6 },
    loc: 16084,
    layer: 4,
  },

  {
    id: 'cordis-core',
    title: { zh: '框架内核', en: 'Framework Core' },
    code: 'vendor/cordis',
    subtitle: { zh: '上下文、纤程、服务解析、可撤销的注册', en: 'Contexts, fibers, service resolution, and registrations you can take back' },
    region: 'foundation',
    pos: { x: -7.2, z: 8.8 },
    loc: 2693,
    layer: 0,
    keystone: true,
  },
  {
    id: 'cordis-loader',
    title: { zh: '配置加载器', en: 'Config Loader' },
    code: 'vendor/loader · include · hmr',
    subtitle: { zh: 'YAML 变成活的插件树，以及热重载', en: 'YAML becomes a live plugin tree, plus hot reload' },
    region: 'foundation',
    pos: { x: -7.2, z: 12.6 },
    loc: 2129,
    layer: 0,
  },

  {
    id: 'engineering',
    title: { zh: '闸门与工程体系', en: 'Gates & Process' },
    code: 'scripts/* · .agents/notes',
    subtitle: { zh: '把团队约定升级成机器强制', en: 'Turning team convention into machine enforcement' },
    region: 'meta',
    pos: { x: 17.8, z: 8.8 },
    loc: 29981,
    layer: 5,
    keystone: true,
  },
  {
    id: 'critique',
    title: { zh: '代价与弱点', en: 'Costs & Weaknesses' },
    code: '独立核实',
    subtitle: { zh: '这套架构真实的账单，逐条验证过', en: 'The real bill for this architecture, verified line by line' },
    region: 'meta',
    pos: { x: 17.8, z: 12.6 },
    loc: 900,
    layer: 5,
  },
]

export const BLOCK_BY_ID: Record<string, Block> = Object.fromEntries(
  BLOCKS.map((b) => [b.id, b]),
)

export const BLOCKS_BY_REGION: Record<RegionId, Block[]> = REGIONS.reduce(
  (acc, r) => {
    acc[r.id] = BLOCKS.filter((b) => b.region === r.id)
    return acc
  },
  {} as Record<RegionId, Block[]>,
)

export const EDGE_KINDS: EdgeKindMeta[] = [
  { id: 'call', name: { zh: '调用服务', en: 'Calls a service' }, reading: { zh: '声明依赖并直接调用', en: 'Declares a dependency and calls it directly' }, color: '#8A5A2B', dashed: false },
  { id: 'intercept', name: { zh: '拦截事件', en: 'Intercepts an event' }, reading: { zh: '在对方的扩展点上插手，可改写或否决', en: 'Steps into the other side’s extension point; can rewrite or veto' }, color: '#C0452A', dashed: true },
  { id: 'register', name: { zh: '注册贡献', en: 'Registers into' }, reading: { zh: '把内容放进对方的注册表，等对方来读', en: 'Puts things into the other side’s registry and waits to be read' }, color: '#2F7D71', dashed: true },
  { id: 'implement', name: { zh: '接缝实现', en: 'Implements a seam' }, reading: { zh: '为对方声明的能力提供具体实现', en: 'Provides a concrete implementation for a capability the other side declares' }, color: '#6A5FA0', dashed: false },
]

export const EDGE_KIND_BY_ID: Record<EdgeKind, EdgeKindMeta> = Object.fromEntries(
  EDGE_KINDS.map((k) => [k.id, k]),
) as Record<EdgeKind, EdgeKindMeta>

/**
 * 手工整理的依赖道路。只收录我在源码或精读报告里确认过的关系，
 * 不收录「理论上应该有」的连线。
 */
export const EDGES: Edge[] = [
  { from: 'agent-loop', to: 'agent', kind: 'call', label: { zh: 'inject agents', en: 'injects agents' } },
  { from: 'agent-loop', to: 'session', kind: 'call', label: { zh: 'inject sessions', en: 'injects sessions' } },
  { from: 'agent-loop', to: 'tools', kind: 'call', label: { zh: 'inject tools', en: 'injects tools' } },
  { from: 'agent-loop', to: 'system-prompt', kind: 'call', label: { zh: 'inject systemPrompt', en: 'injects systemPrompt' } },
  { from: 'agent-loop', to: 'llm', kind: 'call', label: { zh: 'inject llm', en: 'injects llm' } },

  { from: 'compaction', to: 'agent-loop', kind: 'intercept', label: { zh: '压力检测与溢出恢复', en: 'pressure check and overflow recovery' } },
  { from: 'compaction', to: 'llm', kind: 'call', label: { zh: '摘要也要调模型', en: 'summarising also calls the model' } },
  { from: 'compaction', to: 'session', kind: 'call', label: { zh: '追加遮蔽记录', en: 'appends a shadowing entry' } },
  { from: 'system-prompt', to: 'agent-loop', kind: 'intercept', label: { zh: '把工作区说明拼进这一步', en: 'splices workspace notes into this step' } },
  { from: 'skills-web', to: 'system-prompt', kind: 'register', label: { zh: '技能目录进提示词', en: 'skill catalogue enters the prompt' } },
  { from: 'skills-web', to: 'tools', kind: 'register', label: { zh: '技能 / 网页 / 待办工具', en: 'skill / web / todo tools' } },
  { from: 'skills-web', to: 'fs', kind: 'call', label: { zh: '技能正文按需读盘', en: 'skill bodies read from disk on demand' } },

  { from: 'fs', to: 'tools', kind: 'register', label: { zh: '读写编辑工具', en: 'read / write / edit tools' } },
  { from: 'shell', to: 'tools', kind: 'register', label: { zh: 'bash 工具', en: 'the bash tool' } },
  { from: 'subagent', to: 'tools', kind: 'register', label: { zh: '委派 / 工作流 / Ralph 工具', en: 'delegation / workflow / Ralph tools' } },
  { from: 'sandbox', to: 'shell', kind: 'implement', label: { zh: '为命令执行提供约束后端', en: 'supplies the confinement backend for command execution' } },
  { from: 'sandbox', to: 'fs', kind: 'implement', label: { zh: '同一份策略约束写入', en: 'the same policy constrains writes' } },
  { from: 'sandbox', to: 'system-prompt', kind: 'register', label: { zh: '当前沙箱模式写进提示词', en: 'current sandbox mode goes into the prompt' } },
  { from: 'subagent', to: 'agent', kind: 'call', label: { zh: '创建子 agent', en: 'creates child agents' } },
  { from: 'subagent', to: 'session', kind: 'call', label: { zh: '子会话与前缀种子', en: 'child sessions and prefix seeds' } },

  { from: 'bridges', to: 'agent', kind: 'call', label: { zh: '驱动 agent 收发', en: 'drives the agent’s send and receive' } },
  { from: 'bridges', to: 'session', kind: 'call', label: { zh: '加载与重放会话', en: 'loads and replays sessions' } },
  { from: 'bridges', to: 'tools', kind: 'intercept', label: { zh: '外部钩子拦截工具执行', en: 'external hooks intercept tool execution' } },
  { from: 'bridges', to: 'tools', kind: 'implement', label: { zh: 'ACP 提供审批实现', en: 'ACP supplies the approval implementation' } },
  { from: 'web-client', to: 'typert', kind: 'call', label: { zh: '浏览器侧的远程调用', en: 'remote calls from the browser side' } },
  { from: 'typert', to: 'session', kind: 'call', label: { zh: '把会话投影到线上', en: 'projects sessions onto the wire' } },

  { from: 'patch-stack', to: 'cordis-loader', kind: 'call', label: { zh: '把补丁栈交给加载器', en: 'hands the patch stack to the loader' } },
  { from: 'preset', to: 'cordis-loader', kind: 'call', label: { zh: '挂一棵子配置树', en: 'mounts a sub-tree of config' } },
  { from: 'preset', to: 'agent', kind: 'call', label: { zh: '绑定作用域父子关系', en: 'binds scope parentage' } },
  { from: 'preset', to: 'tools', kind: 'register', label: { zh: '会话专属的工具集', en: 'a tool set specific to this session' } },
  { from: 'self-modification', to: 'cordis-core', kind: 'call', label: { zh: '检视活的插件与服务', en: 'inspects live plugins and services' } },
  { from: 'self-modification', to: 'tools', kind: 'register', label: { zh: '自修改工具族', en: 'the self-editing tool family' } },

  { from: 'cordis-loader', to: 'cordis-core', kind: 'call', label: { zh: '插件树建在纤程上', en: 'the plugin tree is built on fibers' } },
  { from: 'agent', to: 'cordis-core', kind: 'call', label: { zh: '作用域即定制的上下文', en: 'a scope is just a tailored context' } },
  { from: 'tools', to: 'cordis-core', kind: 'call', label: { zh: '注册即可撤销的效果', en: 'registration is a revocable effect' } },
]

export const SPACE = {
  footprint: { w: 3.3, d: 2.1 },
  height: { min: 0.34, max: 3.1 },
  roadY: 0.05,
} as const

const MAX_LOC = Math.max(...BLOCKS.map((b) => b.loc))

/** 代码量 → 地形高度。开平方，否则 8 万行的那块会把其余全压平。 */
export function blockHeight(block: Block): number {
  const t = Math.sqrt(block.loc / MAX_LOC)
  return SPACE.height.min + (SPACE.height.max - SPACE.height.min) * t
}

export function blockPosition(block: Block): [number, number, number] {
  return [block.pos.x, blockHeight(block) / 2, block.pos.z]
}

export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  cx: number
  cz: number
  w: number
  d: number
}

function boundsOf(blocks: Block[], pad: number): Bounds {
  const minX = Math.min(...blocks.map((b) => b.pos.x - SPACE.footprint.w / 2)) - pad
  const maxX = Math.max(...blocks.map((b) => b.pos.x + SPACE.footprint.w / 2)) + pad
  const minZ = Math.min(...blocks.map((b) => b.pos.z - SPACE.footprint.d / 2)) - pad
  const maxZ = Math.max(...blocks.map((b) => b.pos.z + SPACE.footprint.d / 2)) + pad
  return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, w: maxX - minX, d: maxZ - minZ }
}

/** 一个区域的地块轮廓，用来画它那片「陆地」。 */
export function regionBounds(id: RegionId): Bounds {
  return boundsOf(BLOCKS_BY_REGION[id], 1.4)
}

/** 整张地图的范围，相机默认框住它。 */
export function mapBounds(): Bounds {
  return boundsOf(BLOCKS, 3)
}

// ── 板块级聚合 ──────────────────────────────────────────

export interface RegionEdge {
  from: RegionId
  to: RegionId
  /** 这条板块间通道底下有多少条具体依赖 */
  count: number
  /** 出现过的关系种类，按数量降序 */
  kinds: EdgeKind[]
}

/**
 * 把地块之间的依赖聚合到板块之间：总览只需要回答
 * 「哪两片地方在打交道、有多密」，具体是谁调谁进去再看。
 */
export const REGION_EDGES: RegionEdge[] = (() => {
  const acc = new Map<string, { from: RegionId; to: RegionId; count: number; kinds: Map<EdgeKind, number> }>()
  for (const e of EDGES) {
    const a = BLOCK_BY_ID[e.from].region
    const b = BLOCK_BY_ID[e.to].region
    if (a === b) continue
    const key = `${a}>${b}`
    let rec = acc.get(key)
    if (!rec) {
      rec = { from: a, to: b, count: 0, kinds: new Map() }
      acc.set(key, rec)
    }
    rec.count++
    rec.kinds.set(e.kind, (rec.kinds.get(e.kind) ?? 0) + 1)
  }
  return [...acc.values()].map((r) => ({
    from: r.from,
    to: r.to,
    count: r.count,
    kinds: [...r.kinds.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k),
  }))
})()

/** 板块中心（取该板块所有地块的外接框中心）。 */
export function regionCenter(id: RegionId): [number, number] {
  const b = regionBounds(id)
  return [b.cx, b.cz]
}

/** 某个板块牵涉到的所有地块级依赖（任一端在该板块内）。 */
export function edgesTouchingRegion(id: RegionId): Edge[] {
  return EDGES.filter(
    (e) => BLOCK_BY_ID[e.from].region === id || BLOCK_BY_ID[e.to].region === id,
  )
}
