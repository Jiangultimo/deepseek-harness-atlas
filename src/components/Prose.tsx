import type { ReactNode } from 'react'

/**
 * 极简行内标记渲染：只支持 **粗体** 和 `代码`。
 * 档案正文由结构化数据生成，不需要完整的 Markdown 解析器。
 */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      out.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else {
      out.push(<code key={key++}>{token.slice(1, -1)}</code>)
    }
    last = m.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/**
 * 段落数组渲染。以 "- " 开头的连续行合并成一个列表。
 */
export function Prose({ body }: { body: string[] }) {
  const nodes: ReactNode[] = []
  let bullets: string[] = []
  let key = 0

  const flush = () => {
    if (bullets.length === 0) return
    nodes.push(
      <ul key={`ul-${key++}`}>
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const line of body) {
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2))
      continue
    }
    flush()
    nodes.push(<p key={`p-${key++}`}>{inline(line)}</p>)
  }
  flush()

  return <div className="prose-cn">{nodes}</div>
}
