#!/usr/bin/env node
/**
 * 正文体检：这批档案的硬约束是「正文里不出现代码痕迹」，
 * 靠人眼扫两个语种几十万字不现实，所以让机器扫。
 *
 * 只检查会渲染成正文的字段（lede / sections / mechanisms / lessons / tradeoffs），
 * codeIndex 和 packages 本来就是放路径的，跳过。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '..', 'src', 'content', 'archives')

/** 档案按语种分目录存放，两个语种都要扫——代码痕迹这条约束不分语言。 */
const locales = readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

/** 代码痕迹的特征，按严重程度排序 */
const SMELLS = [
  { id: '文件路径', re: /[\w@/-]+\.(ts|tsx|js|mjs|json|yml|yaml|md)\b/g },
  { id: '目录路径', re: /\b(packages|vendor|scripts|apps|src)\/[a-z0-9-]+/gi },
  { id: 'ctx 调用', re: /\bctx\.[a-zA-Z]/g },
  { id: '驼峰标识符', re: /\b[a-z]+[A-Z][a-zA-Z]{2,}\b/g },
  { id: '函数调用写法', re: /\b[a-zA-Z_][\w.]*\([^)]{0,40}\)/g },
  { id: '空词', re: /优雅|强大|完美|巧妙|极致|丝滑/g },
  { id: '作文腔', re: /首先[，,]|其次[，,]|最后[，,].{0,6}综上/g },
  { id: '手册腔', re: /该方法|该函数|该属性|接受.{0,4}个参数|返回值为/g },
]

/** 这些词看着像驼峰但其实是正常英文专名，放行 */
const ALLOW = new Set([
  'JavaScript', 'TypeScript', 'GitHub', 'JSON', 'YAML', 'DeepSeek',
  'iOS', 'macOS', 'npm', 'pnpm', 'AGENTS', 'README',
  'microVMs',
])

function proseOf(a) {
  const out = []
  const push = (label, text) => {
    if (typeof text === 'string' && text.trim()) out.push([label, text])
  }
  push('lede', a.lede)
  a.sections?.forEach((s, i) => {
    push(`sections[${i}].heading`, s.heading)
    s.body?.forEach((b, j) => push(`sections[${i}].body[${j}]`, b))
  })
  a.mechanisms?.forEach((m, i) => {
    push(`mechanisms[${i}].name`, m.name)
    push(`mechanisms[${i}].how`, m.how)
    push(`mechanisms[${i}].why`, m.why)
  })
  a.lessons?.forEach((l, i) => {
    push(`lessons[${i}].lesson`, l.lesson)
    push(`lessons[${i}].why`, l.why)
  })
  a.tradeoffs?.forEach((t, i) => push(`tradeoffs[${i}]`, t))
  return out
}

let totalHits = 0
let totalChars = 0
const report = []

let scanned = 0

for (const locale of locales) {
for (const file of readdirSync(join(dir, locale)).filter((f) => f.endsWith('.json')).sort()) {
  scanned++
  const a = JSON.parse(readFileSync(join(dir, locale, file), 'utf8'))
  const prose = proseOf(a)
  if (prose.length === 0) continue

  const chars = prose.reduce((n, [, t]) => n + t.length, 0)
  totalChars += chars

  const hits = []
  for (const [where, text] of prose) {
    for (const smell of SMELLS) {
      for (const m of text.matchAll(smell.re)) {
        if (ALLOW.has(m[0])) continue
        hits.push({ where, smell: smell.id, found: m[0] })
      }
    }
  }
  totalHits += hits.length

  // 风格正向指标
  // 这两项衡量的是中文行文习惯，对译文没有意义，只在中文档案上算。
  const zh = locale === 'zh'
  const bold = zh ? ((a.lede + prose.map(([, t]) => t).join('')).match(/\*\*[^*]+\*\*/g)?.length ?? 0) : null
  const contrast = zh ? prose.filter(([, t]) => /不是.{1,30}而是/.test(t)).length : null

  report.push({ file: `${locale}/${file.replace('.json', '')}`, chars, hits, bold, contrast })
}
}

// 扫不到东西要当场喊出来。归档目录挪过一次位置，那之后这道闸门一直在检查空集然后报成功。
if (scanned === 0) {
  console.error(`没有扫到任何档案：${dir} 下没有语种子目录，或子目录里没有 .json。`)
  process.exit(1)
}

console.log('块'.padEnd(26), '正文字数'.padStart(8), '加粗'.padStart(5), '「不是…而是」'.padStart(10), '代码痕迹'.padStart(8))
console.log('-'.repeat(68))
for (const r of report) {
  const flag = r.hits.length > 0 ? String(r.hits.length) : '·'
  console.log(
    r.file.padEnd(26),
    String(r.chars).padStart(8),
    (r.bold ?? '·').toString().padStart(5),
    (r.contrast ?? '·').toString().padStart(10),
    flag.padStart(8),
  )
}
console.log('-'.repeat(68))
console.log(`${scanned} 份档案，合计正文 ${totalChars.toLocaleString()} 字，代码痕迹 ${totalHits} 处`)

if (totalHits > 0) {
  console.log('\n=== 需要处理的痕迹 ===')
  for (const r of report) {
    if (r.hits.length === 0) continue
    console.log(`\n[${r.file}]`)
    const byKind = new Map()
    for (const h of r.hits) {
      if (!byKind.has(h.smell)) byKind.set(h.smell, [])
      byKind.get(h.smell).push(`${h.found} @ ${h.where}`)
    }
    for (const [kind, list] of byKind) {
      console.log(`  ${kind}: ${list.slice(0, 6).join(' / ')}${list.length > 6 ? ` …共 ${list.length} 处` : ''}`)
    }
  }
}

process.exit(totalHits > 0 ? 1 : 0)
